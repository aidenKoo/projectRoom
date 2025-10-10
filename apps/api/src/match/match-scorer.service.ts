import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, In } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { User } from '../users/entities/user.entity';
import { Profile } from '../profiles/entities/profile.entity';
import { Preference } from '../preferences/entities/preference.entity';
import { Like } from './entities/like.entity';
import { Match } from './entities/match.entity';
import { Recommendation } from './entities/recommendation.entity';
import { ProfilePrivate } from '../profiles-private/entities/profile-private.entity';

interface ScoreResult {
  totalScore: number;
  breakdown: any;
  sharedBits: string[];
  reason: string;
}

// Helper function to calculate distance score (0-1)
const calculateDistanceScore = (distance_km: number): number => {
  const MAX_DISTANCE = 100; // Cap at 100km
  if (distance_km >= MAX_DISTANCE) {
    return 0;
  }
  return 1 - (distance_km / MAX_DISTANCE);
};

// Helper function to calculate activity score (0-1)
const calculateActivityScore = (last_active_min: number): number => {
  if (last_active_min <= 0) {
    return 1;
  }
  return 1 / (Math.log10(last_active_min / 10 + 1) + 1);
};

// Helper function to calculate distance between two lat/lon points in KM
const calculateHaversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  if (!lat1 || !lon1 || !lat2 || !lon2) {
    return 200; // Return a default large distance if location is missing
  }

  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return distance;
};

const calculateJaccardSimilarity = (setA: any[], setB: any[]): number => {
    const intersection = new Set(setA.filter(x => setB.includes(x)));
    const union = new Set([...setA, ...setB]);
    if (union.size === 0) return 0;
    return intersection.size / union.size;
}

const goldenPairs: { [key: string]: string[] } = {
  'INFJ': ['ENFP', 'ENTP'],
  'ENFP': ['INFJ', 'INTJ'],
  'INFP': ['ENFJ', 'ENTJ'],
  'ENFJ': ['INFP', 'ISFP'],
  'INTJ': ['ENFP', 'ENTP'],
  'ENTJ': ['INFP', 'INTP'],
  'INTP': ['ENTJ', 'ESTJ'],
  'ISFJ': ['ESFP', 'ESTP'],
  'ESFP': ['ISFJ', 'ISTJ'],
  'ISTJ': ['ESFP', 'ENFP'],
  'ESTP': ['ISFJ', 'ISTP'],
  'ISFP': ['ENFJ', 'ESFJ', 'ESTJ'],
  'ESFJ': ['ISFP', 'ISTP'],
  'ISTP': ['ESFJ', 'ESTJ'],
  'ESTJ': ['INTP', 'ISFP', 'ISTP'],
};

const calculateMbtiSimilarity = (mbti1: string, mbti2: string): number => {
  if (!mbti1 || !mbti2) return 0.5; // Neutral score if undefined

  if (goldenPairs[mbti1]?.includes(mbti2) || goldenPairs[mbti2]?.includes(mbti1)) {
    return 1.0;
  }

  // Simple matching letters as a fallback
  let matchingLetters = 0;
  for (let i = 0; i < 4; i++) {
    if (mbti1[i] === mbti2[i]) {
      matchingLetters++;
    }
  }
  return 0.2 + (matchingLetters / 4) * 0.6; // Lowered the max score for simple matching
}

@Injectable()
export class MatchScorerService {
  private readonly logger = new Logger(MatchScorerService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Profile)
    private readonly profileRepository: Repository<Profile>,
    @InjectRepository(ProfilePrivate)
    private readonly profilePrivateRepository: Repository<ProfilePrivate>,
    @InjectRepository(Preference)
    private readonly preferenceRepository: Repository<Preference>,
    @InjectRepository(Like)
    private readonly likeRepository: Repository<Like>,
    @InjectRepository(Match)
    private readonly matchRepository: Repository<Match>,
    @InjectRepository(Recommendation)
    private readonly recommendationRepository: Repository<Recommendation>,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  async getCandidates(userId: string, limit = 100): Promise<Profile[]> {
    const myUser = await this.userRepository.findOneBy({ uid: userId });
    if (!myUser) return [];

    const myProfile = await this.profileRepository.findOneBy({ user_id: myUser.id });
    if (!myProfile || !myProfile.latitude || !myProfile.longitude) return [];

    const likedUserIds = (
      await this.likeRepository.find({
        where: { fromUserId: userId },
        select: ['toUserId'],
      })
    ).map((l) => l.toUserId);

    const matchedUsersQuery = await this.matchRepository.find({
      where: [{ uidA: userId }, { uidB: userId }],
    });
    const matchedUserIds = matchedUsersQuery.flatMap((m) => [m.uidA, m.uidB]);

    const skippedUserIds = (
      await this.recommendationRepository.find({
        where: { userId, isSkipped: true },
        select: ['targetUserId'],
      })
    ).map((r) => r.targetUserId);

    const excludedUserIds = [
      ...new Set([
        userId,
        ...likedUserIds,
        ...matchedUserIds,
        ...skippedUserIds,
      ]),
    ];

    const query = this.profileRepository
      .createQueryBuilder('profile')
      .innerJoinAndSelect('profile.user', 'user')
      .where('user.uid NOT IN (:...excludedUserIds)', { excludedUserIds })
      // Hard Filter 1: Distance
      .andWhere(`ST_Distance_Sphere(point(profile.longitude, profile.latitude), point(:myLon, :myLat)) <= 50000`, {
          myLon: myProfile.longitude,
          myLat: myProfile.latitude,
      })
      // Hard Filter 2: Age
      .andWhere('user.birth_year BETWEEN :minBirthYear AND :maxBirthYear', {
        minBirthYear: myUser.birth_year - 10,
        maxBirthYear: myUser.birth_year + 10,
      });

    // TODO: Add hard filters for age, etc. based on legal requirements if any

    return query.orderBy('RAND()').take(limit).getMany();
  }

  async calculateScore(
    userId: string,
    targetUserId: string,
    token?: string,
  ): Promise<ScoreResult> {
    const [myUser, targetUser] = await Promise.all([
      this.userRepository.findOneBy({ uid: userId }),
      this.userRepository.findOneBy({ uid: targetUserId }),
    ]);

    if (!myUser || !targetUser) {
      return { totalScore: 0, breakdown: {}, sharedBits: [], reason: '사용자 정보 없음' };
    }

    const [myProfile, targetProfile, myPreference, targetProfilePrivate, reciprocityLike] = await Promise.all([
      this.profileRepository.findOneBy({ user_id: myUser.id }),
      this.profileRepository.findOneBy({ user_id: targetUser.id }),
      this.preferenceRepository.findOneBy({ userId: myUser.id }),
      this.profilePrivateRepository.findOneBy({ userId: targetUser.id }),
      this.likeRepository.findOneBy({ fromUserId: targetUserId, toUserId: userId }), // Check for reciprocity
    ]);

    if (!myProfile || !targetProfile || !myPreference) {
      return { totalScore: 0, breakdown: {}, sharedBits: [], reason: '정보 부족' };
    }

    const breakdown: any = {};
    const sharedBits: string[] = [];
    
    // 1. Calculate Preference Score based on myPreference
    let preferenceScore = 0;
    const { items, weights } = myPreference;
    if (items && weights && items.length === weights.length) {
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            const weight = weights[i];
            let similarity = 0;

            switch (item.type) {
                case 'age_range':
                    const targetAge = new Date().getFullYear() - targetUser.birth_year;
                    const { min: minAge, max: maxAge } = item.value;
                    if (targetAge >= minAge && targetAge <= maxAge) {
                        similarity = 1;
                        sharedBits.push(`나이 ${targetAge}세`);
                    } else if (targetAge >= minAge - 2 && targetAge <= maxAge + 2) {
                        // Linear decay up to 2 years difference
                        similarity = 1 - (Math.min(Math.abs(targetAge - minAge), Math.abs(targetAge - maxAge))) / 2 * 0.5;
                    }
                    break;

                case 'height_cm_range':
                    const targetHeight = targetProfile.height_cm;
                    const { min: minHeight, max: maxHeight } = item.value;
                    if (targetHeight >= minHeight && targetHeight <= maxHeight) {
                        similarity = 1;
                        sharedBits.push(`키 ${targetHeight}cm`);
                    } else if (targetHeight >= minHeight - 5 && targetHeight <= maxHeight + 5) {
                        // Linear decay up to 5cm difference
                        similarity = 1 - (Math.min(Math.abs(targetHeight - minHeight), Math.abs(targetHeight - maxHeight))) / 5 * 0.5;
                    }
                    break;

                case 'region':
                    const preferredRegions = item.value as string[];
                    if (preferredRegions.includes(targetProfile.region_code)) {
                        similarity = 1.0;
                        sharedBits.push(`지역: ${targetProfile.region_code}`);
                    } else {
                        similarity = 0.3; // Default score for non-match
                    }
                    break;

                case 'hobby_overlap':
                    const myHobbies = myProfile.hobbies || [];
                    const targetHobbies = targetProfile.hobbies || [];
                    similarity = calculateJaccardSimilarity(myHobbies, targetHobbies);
                    const intersection = myHobbies.filter(h => targetHobbies.includes(h));
                    if (intersection.length > 0) {
                        sharedBits.push(`공통 취미: ${intersection.join(', ')}`);
                    }
                    break;

                case 'mbti':
                    const preferredMbtis = item.value as string[];
                    const targetMbti = (targetProfile.mbti || [])[0];
                    if (targetMbti && preferredMbtis.length > 0) {
                        // Find best match among preferred MBTIs
                        similarity = Math.max(...preferredMbtis.map(pref => calculateMbtiSimilarity(pref, targetMbti)));
                    }
                    break;

                case 'job_group':
                case 'edu_level':
                    const preferredValues = item.value as string[];
                    const targetValue = targetProfile[item.type];
                    if (targetValue && preferredValues.includes(targetValue)) {
                        similarity = 1.0;
                        sharedBits.push(`${item.type === 'job_group' ? '직업' : '학력'}: ${targetValue}`);
                    }
                    break;
            }
            const weightedScore = similarity * weight;
            preferenceScore += weightedScore;
            breakdown[item.type] = { similarity, weight, score: weightedScore };
        }
    }
    breakdown.basePreferenceScore = preferenceScore;

    // 2. Shared Bits Boost (Cognitive Similarity)
    const ALPHA_SHARED_BITS = 0.05;
    const sharedBitsBoost = (sharedBits.length > 0) ? sharedBits.length * ALPHA_SHARED_BITS : 0;
    preferenceScore += sharedBitsBoost;
    breakdown.sharedBitsBoost = sharedBitsBoost;

    // 3. Confidence Boost & Information Penalty
    let confidenceBoost = 0;
    if (targetProfilePrivate) {
      if ((targetProfilePrivate.lookConfidence || 0) >= 4) confidenceBoost += 0.05;
      if ((targetProfilePrivate.bodyConfidence || 0) >= 4) confidenceBoost += 0.05;
    }
    preferenceScore += confidenceBoost;
    breakdown.confidenceBoost = confidenceBoost;
    
    let informationPenalty = 0;
    if (!targetProfile.bio_highlight || targetProfile.bio_highlight.length < 20) {
      informationPenalty += 0.05;
    }
    if (!targetProfile.hobbies || targetProfile.hobbies.length < 3) {
      informationPenalty += 0.05;
    }
    preferenceScore -= informationPenalty;
    breakdown.informationPenalty = informationPenalty;

    preferenceScore = Math.max(0, preferenceScore); // Ensure score is not negative
    breakdown.finalPreferenceScore = preferenceScore;

    // 4. Calculate System Score (Homophily, Activity, Quality)
    const now = new Date();
    const lastActive = targetUser.last_active_at || now;
    const last_active_min = (now.getTime() - lastActive.getTime()) / (1000 * 60);
    const photo_quality = targetProfile.avg_photo_quality || 0;
    const distance_km = calculateHaversineDistance(myProfile.latitude, myProfile.longitude, targetProfile.latitude, targetProfile.longitude);

    const distanceScore = calculateDistanceScore(distance_km);
    const activityScore = calculateActivityScore(last_active_min);
    const qualityScore = photo_quality;

    const w_dist_norm = 0.4;
    const w_act_norm = 0.4;
    const w_qual_norm = 0.2;

    const systemScore = w_dist_norm * distanceScore + w_act_norm * activityScore + w_qual_norm * qualityScore;
    breakdown.systemScore = {
        score: systemScore,
        distance: { score: distanceScore, value: distance_km },
        activity: { score: activityScore, value: last_active_min },
        quality: { score: qualityScore, value: photo_quality },
    };

    // 5. Reciprocity Boost
    const GAMMA_RECIPROCITY = 0.1;
    const reciprocityBoost = reciprocityLike ? GAMMA_RECIPROCITY : 0;
    breakdown.reciprocityBoost = reciprocityBoost;

    // 6. Combine Scores using Extended Formula
    let BETA_PREFERENCE = 0.8;
    let SYSTEM_SCORE_WEIGHT = 0.2;

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    if (myUser.created_at > sevenDaysAgo) {
      // Cold start for new users: rely more on system score
      BETA_PREFERENCE = 0.6;
      SYSTEM_SCORE_WEIGHT = 0.4;
      breakdown.coldStart = true;
    }

    const finalScore = 
        BETA_PREFERENCE * preferenceScore +
        SYSTEM_SCORE_WEIGHT * systemScore +
        reciprocityBoost;

    let reason = '추천 프로필';
    if (sharedBits.length > 0) {
      reason = sharedBits.slice(0, 2).join(' · ');
    }
    if (reciprocityLike) {
        reason = '회원님을 좋아해요! · ' + reason;
    }

    return {
      totalScore: Math.min(1, finalScore),
      breakdown,
      sharedBits: sharedBits.slice(0, 3),
      reason,
    };
  }
}
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
    const myUser = await this.userRepository.findOneBy({ firebase_uid: userId });
    if (!myUser) return [];

    const myPreference = await this.preferenceRepository.findOneBy({
      userId: myUser.id,
    });

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
      .where('user.firebase_uid NOT IN (:...excludedUserIds)', {
        excludedUserIds,
      });

    if (myPreference) {
      if (myPreference.ageMin && myPreference.ageMax) {
        const maxBirthYear = new Date().getFullYear() - myPreference.ageMin;
        const minBirthYear = new Date().getFullYear() - myPreference.ageMax;
        query.andWhere('user.birth_year BETWEEN :minBirthYear AND :maxBirthYear', {
          minBirthYear,
          maxBirthYear,
        });
      }
    }

    return query.take(limit).getMany();
  }

  async calculateScore(
    userId: string,
    targetUserId: string,
    token?: string,
  ): Promise<ScoreResult> {
    const [myUser, targetUser] = await Promise.all([
      this.userRepository.findOneBy({ firebase_uid: userId }),
      this.userRepository.findOneBy({ firebase_uid: targetUserId }),
    ]);

    if (!myUser || !targetUser) {
      return { totalScore: 0, breakdown: {}, sharedBits: [], reason: '사용자 정보 없음' };
    }

    const [myProfile, targetProfile, myPreference, targetProfilePrivate] = await Promise.all([
      this.profileRepository.findOneBy({ user_id: myUser.id }),
      this.profileRepository.findOneBy({ user_id: targetUser.id }),
      this.preferenceRepository.findOneBy({ userId: myUser.id }),
      this.profilePrivateRepository.findOneBy({ userId: targetUser.id }),
    ]);

    if (!myProfile || !targetProfile || !myPreference) {
      return { totalScore: 0, breakdown: {}, sharedBits: [], reason: '정보 부족' };
    }

    let totalScore = 0;
    const breakdown: any = {};
    const sharedBits: string[] = [];
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
            } else if (targetAge === minAge - 1 || targetAge === maxAge + 1) {
              similarity = 0.8; // 경계값에서 1년 차이
            }
            // 선형 감쇠는 추후 구체적인 규칙에 따라 추가 가능
            break;

          case 'height_cm_range':
            const targetHeight = targetProfile.height_cm;
            const { min: minHeight, max: maxHeight } = item.value;
            if (targetHeight >= minHeight && targetHeight <= maxHeight) {
              similarity = 1;
              sharedBits.push(`키 ${targetHeight}cm`);
            } else if (targetHeight >= minHeight - 5 && targetHeight <= maxHeight + 5) {
              // 키는 5cm 범위까지 유사도 부여
              similarity = 0.8;
            }
            break;

          case 'religion':
            if (Array.isArray(item.value) && item.value.includes(targetProfile.religion)) {
                similarity = 1;
                sharedBits.push(`종교: ${targetProfile.religion}`);
            }
            break;

          case 'drink':
            if (Array.isArray(item.value) && item.value.includes(targetProfile.drink)) {
                similarity = 1;
            }
            break;

          case 'smoke':
            if (Array.isArray(item.value) && item.value.includes(targetProfile.smoke)) {
                similarity = 1;
            }
            break;

          case 'hobby_overlap':
            const myHobbies = myProfile.hobbies || [];
            const targetHobbies = targetProfile.hobbies || [];
            const intersection = myHobbies.filter(h => targetHobbies.includes(h));
            const union = [...new Set([...myHobbies, ...targetHobbies])];
            if (union.length > 0) {
              similarity = intersection.length / union.length; // Jaccard Similarity
            }
            if (intersection.length > 0) {
              sharedBits.push(`공통 취미: ${intersection.join(', ')}`);
            }
            break;

          case 'region':
            const preferredRegions = item.value as string[];
            if (preferredRegions.includes(targetUser.region_code)) {
              similarity = 1.0;
              sharedBits.push(`선호 지역: ${targetUser.region_code}`);
            } else {
              similarity = 0.3; // 기본 점수
            }
            break;

          case 'mbti':
            const preferredMbtis = item.value as string[];
            const targetMbti = (targetProfile.mbti || [])[0]; // 대상은 첫번째 MBTI만 고려
            if (targetMbti && preferredMbtis.length > 0) {
              let maxMbtiScore = 0;
              for (const prefMbti of preferredMbtis) {
                let matchingLetters = 0;
                for (let j = 0; j < 4; j++) {
                  if (prefMbti[j] === targetMbti[j]) {
                    matchingLetters++;
                  }
                }
                maxMbtiScore = Math.max(maxMbtiScore, (matchingLetters / 4) * 0.8 + 0.2);
              }
              similarity = maxMbtiScore;
            }
            break;

          case 'job_group':
            const preferredJobs = item.value as string[];
            if (preferredJobs.includes(targetProfile.job_group)) {
              similarity = 1.0;
              sharedBits.push(`직업: ${targetProfile.job_group}`);
            }
            break;

          case 'edu_level':
            const preferredEdus = item.value as string[];
            if (preferredEdus.includes(targetProfile.edu_level)) {
              similarity = 1.0;
              sharedBits.push(`학력: ${targetProfile.edu_level}`);
            }
            break;
        }

        const weightedScore = similarity * weight;
        totalScore += weightedScore;
        breakdown[item.type] = { similarity, weight, score: weightedScore };
      }
    }

    // Confidence Boost
    if (targetProfilePrivate) {
      if ((targetProfilePrivate.lookConfidence || 0) >= 4) {
        totalScore *= 1.05;
        breakdown.lookConfidenceBoost = 0.05;
      }
      if ((targetProfilePrivate.bodyConfidence || 0) >= 4) {
        totalScore *= 1.05;
        breakdown.bodyConfidenceBoost = 0.05;
      }
    }

    // Information Penalty
    const penaltyFields = ['job_group', 'edu_level', 'hobbies', 'mbti'];
    let penaltyCount = 0;
    for (const field of penaltyFields) {
      if (!targetProfile[field] || (Array.isArray(targetProfile[field]) && targetProfile[field].length === 0)) {
        penaltyCount++;
      }
    }
    if (penaltyCount > 0) {
      const penaltyMultiplier = Math.pow(0.95, penaltyCount);
      totalScore *= penaltyMultiplier;
      breakdown.informationPenalty = { penaltyCount, penaltyMultiplier };
    }
    
    let reason = '추천 프로필';
    if (sharedBits.length > 0) {
      reason = sharedBits.slice(0, 2).join(' · ');
    }

    return {
      totalScore: Math.min(1, totalScore),
      breakdown,
      sharedBits: sharedBits.slice(0, 3),
      reason,
    };
  }
}
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
    // ... (getCandidates function remains unchanged)
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

    const [myProfile, targetProfile, myPreference, targetProfilePrivate] = await Promise.all([
      this.profileRepository.findOneBy({ user_id: myUser.uid }),
      this.profileRepository.findOneBy({ user_id: targetUser.uid }),
      this.preferenceRepository.findOneBy({ userId: myUser.uid }),
      this.profilePrivateRepository.findOneBy({ userId: targetUser.uid }),
    ]);

    if (!myProfile || !targetProfile || !myPreference) {
      return { totalScore: 0, breakdown: {}, sharedBits: [], reason: '정보 부족' };
    }

    // 1. Calculate Preference Score (from existing logic)
    let preferenceScore = 0;
    const breakdown: any = {};
    const sharedBits: string[] = [];
    const { items, weights } = myPreference;

    if (items && weights && items.length === weights.length) {
      // ... (preference scoring logic remains the same)
    }

    let intermediateScore = preferenceScore;
    // ... (boosts and penalties remain the same)
    
    preferenceScore = Math.min(1, intermediateScore);
    breakdown.preferenceScore = preferenceScore;

    // 2. Calculate System Score (using real data)
    const now = new Date();
    const lastActive = targetUser.last_active_at || now;
    const last_active_min = (now.getTime() - lastActive.getTime()) / (1000 * 60);

    const photo_quality = targetProfile.avg_photo_quality || 0;

    const distance_km = calculateHaversineDistance(
      myProfile.latitude,
      myProfile.longitude,
      targetProfile.latitude,
      targetProfile.longitude
    );

    const distanceScore = calculateDistanceScore(distance_km);
    const activityScore = calculateActivityScore(last_active_min);
    const qualityScore = photo_quality;

    const w_dist_norm = 0.4;
    const w_act_norm = 0.4;
    const w_qual_norm = 0.2;

    const systemScore = 
      w_dist_norm * distanceScore +
      w_act_norm * activityScore +
      w_qual_norm * qualityScore;
      
    breakdown.systemScore = {
        score: systemScore,
        distance: { score: distanceScore, value: distance_km },
        activity: { score: activityScore, value: last_active_min },
        quality: { score: qualityScore, value: photo_quality },
    };

    // 3. Combine Scores
    const finalScore = 0.6 * preferenceScore + 0.4 * systemScore;

    let reason = '추천 프로필';
    if (sharedBits.length > 0) {
      reason = sharedBits.slice(0, 2).join(' · ');
    }

    return {
      totalScore: Math.min(1, finalScore),
      breakdown,
      sharedBits: sharedBits.slice(0, 3),
      reason,
    };
  }
}
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Profile } from '../profiles/entities/profile.entity';
import { Swipe } from '../swipes/entities/swipe.entity';
import { ConfigService } from '@nestjs/config';

interface FeedCandidate {
  user: User;
  profile: Profile;
  score: number;
  reasons: string[];
}

@Injectable()
export class FeedService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Profile)
    private profilesRepository: Repository<Profile>,
    @InjectRepository(Swipe)
    private swipesRepository: Repository<Swipe>,
    private configService: ConfigService,
  ) {}

  async getFeed(
    userId: number,
    limit: number = 20,
  ): Promise<FeedCandidate[]> {
    // 1. Get user's profile
    const myProfile = await this.profilesRepository.findOne({
      where: { user_id: userId },
      relations: ['user'],
    });

    if (!myProfile) {
      return [];
    }

    // 2. Get already swiped user IDs
    const swipedUsers = await this.swipesRepository.find({
      where: { actor_id: userId },
      select: ['target_id'],
    });
    const swipedIds = swipedUsers.map((s) => s.target_id);

    // 3. Candidate generation (hard filters)
    const candidatePoolSize = this.configService.get(
      'FEED_CANDIDATE_POOL_SIZE',
      200,
    );

    const query = this.profilesRepository
      .createQueryBuilder('profile')
      .leftJoinAndSelect('profile.user', 'user')
      .where('profile.user_id != :userId', { userId })
      .andWhere('user.id NOT IN (:...swipedIds)', {
        swipedIds: swipedIds.length > 0 ? swipedIds : [0],
      })
      .limit(candidatePoolSize);

    const candidates = await query.getMany();

    // 4. Scoring (v0 rules)
    const scoredCandidates = candidates.map((candidate) => {
      const { score, reasons } = this.calculateScore(myProfile, candidate);
      return {
        user: candidate.user,
        profile: candidate,
        score,
        reasons,
      };
    });

    // 5. Sort by score and return top N
    scoredCandidates.sort((a, b) => b.score - a.score);
    return scoredCandidates.slice(0, limit);
  }

  private calculateScore(
    myProfile: Profile,
    candidate: Profile,
  ): { score: number; reasons: string[] } {
    const reasons: string[] = [];
    let score = 0;

    // Weights from config
    const w1 = parseFloat(this.configService.get('WEIGHT_COMMON_TAGS', '0.25'));
    const w2 = parseFloat(
      this.configService.get('WEIGHT_VALUES_MATCH', '0.20'),
    );
    const w3 = parseFloat(
      this.configService.get('WEIGHT_TIME_OVERLAP', '0.15'),
    );
    const w4 = parseFloat(this.configService.get('WEIGHT_DISTANCE', '0.15'));
    const w5 = parseFloat(
      this.configService.get('WEIGHT_RESPONSIVENESS', '0.15'),
    );
    const w6 = parseFloat(
      this.configService.get('WEIGHT_QUALITY_SCORE', '0.10'),
    );

    // 1. Common tags score (Jaccard similarity)
    const myTags = (myProfile.values_json?.tags || []) as string[];
    const theirTags = (candidate.values_json?.tags || []) as string[];
    const commonTags = myTags.filter((tag) => theirTags.includes(tag));
    const union = new Set([...myTags, ...theirTags]);
    const jaccardScore = union.size > 0 ? commonTags.length / union.size : 0;
    score += w1 * jaccardScore * 100;

    if (commonTags.length > 0) {
      reasons.push(`공통 취미 ${commonTags.length}개`);
    }

    // 2. Values match (placeholder - needs actual values comparison logic)
    const valuesMatchScore = 50; // Default 50%
    score += w2 * valuesMatchScore;

    // 3. Time overlap (if active_time_band exists)
    if (
      myProfile.active_time_band !== null &&
      candidate.active_time_band !== null
    ) {
      const timeOverlap =
        myProfile.active_time_band === candidate.active_time_band ? 1 : 0.3;
      score += w3 * timeOverlap * 100;

      if (timeOverlap > 0.5) {
        reasons.push('활동시간대 유사');
      }
    }

    // 4. Distance score (placeholder - needs actual location logic)
    const distanceScore = 80; // Default
    score += w4 * distanceScore;

    // 5. Responsiveness (placeholder - needs metrics table)
    const responsivenessScore = 50;
    score += w5 * responsivenessScore;

    // 6. Quality score (placeholder)
    const qualityScore = 70;
    score += w6 * qualityScore;

    // Ensure we have at least 3 reasons
    if (reasons.length < 3) {
      if (candidate.religion === myProfile.religion) {
        reasons.push('종교 일치');
      }
      if (candidate.drink === myProfile.drink) {
        reasons.push('음주 성향 유사');
      }
      if (reasons.length < 3) {
        reasons.push('프로필 적합도 높음');
      }
    }

    return { score: Math.round(score), reasons: reasons.slice(0, 3) };
  }
}

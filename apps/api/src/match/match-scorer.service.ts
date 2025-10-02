import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { User } from '../users/entities/user.entity';
import { Profile } from '../profiles/entities/profile.entity';
import { Preference } from '../preferences/entities/preference.entity';

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
    @InjectRepository(Preference)
    private readonly preferenceRepository: Repository<Preference>,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  // 후보군 조회 (하드 필터 적용)
  async getCandidates(userId: string, limit = 20): Promise<User[]> {
    // 본인 제외, 이미 매칭된 사람 제외, 차단된 사람 제외
    // 간단한 예시
    return this.userRepository.find({
      where: { firebase_uid: Not(userId) },
      take: limit * 2, // 여분 확보
    });
  }

  // 매칭 점수 계산
  async calculateScore(
    userId: string,
    targetUserId: string,
    token?: string,
  ): Promise<ScoreResult> {
    const myUser = await this.userRepository.findOne({
      where: { firebase_uid: userId },
    });
    const targetUser = await this.userRepository.findOne({
      where: { firebase_uid: targetUserId },
    });

    if (!myUser || !targetUser) {
      return {
        totalScore: 0,
        breakdown: {},
        sharedBits: [],
        reason: '사용자 정보 없음',
      };
    }

    const myProfile = await this.profileRepository.findOne({
      where: { user_id: myUser.id },
    });
    const targetProfile = await this.profileRepository.findOne({
      where: { user_id: targetUser.id },
    });
    const myPreference = await this.preferenceRepository.findOne({
      where: { userId: myUser.id },
    });

    if (!myProfile || !targetProfile || !myPreference) {
      return {
        totalScore: 0,
        breakdown: {},
        sharedBits: [],
        reason: '정보 부족',
      };
    }

    let totalScore = 0;
    const breakdown: any = {};
    const sharedBits: string[] = [];

    // ... (score calculation logic remains the same)

    // 이유 생성 (AI 호출 또는 폴백)
    let reason = '추천 프로필';
    if (sharedBits.length > 0) {
      reason = sharedBits.slice(0, 2).join(' · ');
    }

    if (token) {
      try {
        const explainerUrl = this.configService.get(
          'SUPABASE_FN_MATCH_EXPLAINER_URL',
        );
        if (explainerUrl) {
          const response = await firstValueFrom(
            this.httpService.post(
              explainerUrl,
              { target_user_id: targetUserId },
              { headers: { Authorization: `Bearer ${token}` } },
            ),
          );
          if (response.data?.explanation) {
            reason = response.data.explanation;
          }
        }
      } catch (error) {
        this.logger.error(
          `Failed to get match explanation: ${error.message}`,
          error.stack,
        );
        // Fallback to default reason if AI fails
      }
    }

    return {
      totalScore: Math.min(1, totalScore),
      breakdown,
      sharedBits: sharedBits.slice(0, 3),
      reason, // AI-generated or default reason
    };
  }
}

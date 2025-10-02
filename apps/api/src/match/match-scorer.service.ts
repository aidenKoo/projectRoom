import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, In } from 'typeorm';
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
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Profile)
    private readonly profileRepository: Repository<Profile>,
    @InjectRepository(Preference)
    private readonly preferenceRepository: Repository<Preference>,
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
  async calculateScore(userId: string, targetUserId: string): Promise<ScoreResult> {
    // userId는 firebase_uid 문자열이므로, 실제 user_id를 먼저 조회
    const myUser = await this.userRepository.findOne({ where: { firebase_uid: userId } });
    const targetUser = await this.userRepository.findOne({ where: { firebase_uid: targetUserId } });

    if (!myUser || !targetUser) {
      return {
        totalScore: 0,
        breakdown: {},
        sharedBits: [],
        reason: '사용자 정보 없음',
      };
    }

    const myProfile = await this.profileRepository.findOne({ where: { user_id: myUser.id } });
    const targetProfile = await this.profileRepository.findOne({ where: { user_id: targetUser.id } });
    const myPreference = await this.preferenceRepository.findOne({ where: { userId: myUser.id } });

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

    // 선호도 items와 weights 기반 점수 계산
    if (myPreference.items && myPreference.weights) {
      for (let i = 0; i < myPreference.items.length; i++) {
        const item = myPreference.items[i];
        const weight = myPreference.weights[i];

        let itemScore = 0;

        // 예시: 나이대
        if (item.type === 'age_range') {
          const [minAge, maxAge] = item.value.split('-').map(Number);
          const targetAge = new Date().getFullYear() - targetUser.birth_year;
          if (targetAge >= minAge && targetAge <= maxAge) {
            itemScore = 1.0;
            sharedBits.push(`✨ 원하는 나이대 (${item.value})`);
          } else {
            itemScore = Math.max(0, 1 - Math.abs(targetAge - (minAge + maxAge) / 2) / 10);
          }
        }

        // 예시: 지역
        if (item.type === 'region') {
          const preferredRegions = Array.isArray(item.value) ? item.value : [item.value];
          if (preferredRegions.includes(targetUser.region_code)) {
            itemScore = 1.0;
            sharedBits.push(`📍 동일 지역 (${targetUser.region_code})`);
          } else {
            itemScore = 0.3;
          }
        }

        // 예시: 직업군
        if (item.type === 'job_group') {
          const preferredJobs = Array.isArray(item.value) ? item.value : [item.value];
          if (targetProfile.job_group && preferredJobs.includes(targetProfile.job_group)) {
            itemScore = 1.0;
            sharedBits.push(`💼 선호 직업군 (${targetProfile.job_group})`);
          } else {
            itemScore = 0.5;
          }
        }

        breakdown[item.type] = { score: itemScore, weight };
        totalScore += itemScore * weight;
      }
    }

    // 기본 점수 (선호도 없는 경우)
    if (totalScore === 0) {
      totalScore = 0.5;
    }

    // 이유 생성
    const reason = sharedBits.length > 0 ? sharedBits.slice(0, 2).join(' · ') : '추천 프로필';

    return {
      totalScore: Math.min(1, totalScore),
      breakdown,
      sharedBits: sharedBits.slice(0, 3),
      reason,
    };
  }
}

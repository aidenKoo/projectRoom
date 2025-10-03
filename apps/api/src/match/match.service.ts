import { Injectable, NotFoundException, ForbiddenException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, LessThan } from "typeorm";
import { Like } from "./entities/like.entity";
import { Match } from "./entities/match.entity";
import { Recommendation } from "./entities/recommendation.entity";
import { MatchScorerService } from "./match-scorer.service";

@Injectable()
export class MatchService {
  constructor(
    @InjectRepository(Like)
    private readonly likeRepository: Repository<Like>,
    @InjectRepository(Match)
    private readonly matchRepository: Repository<Match>,
    @InjectRepository(Recommendation)
    private readonly recommendationRepository: Repository<Recommendation>,
    private readonly scorerService: MatchScorerService,
  ) {}

  // Like 생성 및 상호 매칭 확인
  async createLike(
    fromUserId: string,
    toUserId: string,
  ): Promise<{ like: Like; match?: Match }> {
    // 이미 좋아요 했는지 확인
    const existing = await this.likeRepository.findOne({
      where: { fromUserId, toUserId },
    });

    if (existing) {
      return { like: existing };
    }

    // 새로운 좋아요 생성
    const like = this.likeRepository.create({ fromUserId, toUserId });
    await this.likeRepository.save(like);

    // 상대방도 나를 좋아했는지 확인 (상호 매칭)
    const reciprocalLike = await this.likeRepository.findOne({
      where: { fromUserId: toUserId, toUserId: fromUserId },
    });

    if (reciprocalLike) {
      // 상호 매칭 생성
      const match = await this.createMatch(fromUserId, toUserId);
      return { like, match };
    }

    return { like };
  }

  // 상호 매칭 생성
  async createMatch(userId1: string, userId2: string): Promise<Match> {
    // LEAST/GREATEST 로직으로 중복 방지
    const [uidA, uidB] = [userId1, userId2].sort();

    const existing = await this.matchRepository.findOne({
      where: { uidA, uidB },
    });

    if (existing) {
      return existing;
    }

    const match = this.matchRepository.create({ uidA, uidB });
    return this.matchRepository.save(match);
  }

  // ID로 매치 조회 (권한 확인 포함)
  async findMatchById(matchId: string, userId: string): Promise<Match> {
    const match = await this.matchRepository.findOne({
      where: { id: matchId },
    });

    if (!match) {
      throw new NotFoundException(`Match with ID ${matchId} not found`);
    }

    if (match.uidA !== userId && match.uidB !== userId) {
      throw new ForbiddenException("You do not have access to this match");
    }

    return match;
  }

  // 나의 상호 매칭 목록 조회
  async getMyMatches(userId: string): Promise<Match[]> {
    return this.matchRepository
      .createQueryBuilder("match")
      .where("match.uid_a = :userId OR match.uid_b = :userId", { userId })
      .orderBy("match.created_at", "DESC")
      .getMany();
  }

  // 나를 좋아한 사람 목록
  async getLikesReceived(userId: string): Promise<Like[]> {
    return this.likeRepository.find({
      where: { toUserId: userId },
      order: { createdAt: "DESC" },
    });
  }

  // 추천 목록 조회
  async getRecommendations(
    userId: string,
    token?: string,
    limit = 9,
  ): Promise<Recommendation[]> {
    // 아직 노출되지 않은 추천 조회
    let recommendations = await this.recommendationRepository.find({
      where: {
        userId,
        isShown: false,
        isSkipped: false,
      },
      order: { score: "DESC" },
      take: limit,
    });

    // 추천이 부족하면 새로 생성
    if (recommendations.length < limit) {
      await this.generateRecommendations(userId, token, limit);
      recommendations = await this.recommendationRepository.find({
        where: {
          userId,
          isShown: false,
          isSkipped: false,
        },
        order: { score: "DESC" },
        take: limit,
      });
    }

    // 노출 처리
    const now = new Date();
    for (const rec of recommendations) {
      rec.isShown = true;
      rec.shownAt = now;
    }
    await this.recommendationRepository.save(recommendations);

    return recommendations;
  }

  // 추천 생성 (매칭 스코어 기반)
  async generateRecommendations(
    userId: string,
    token?: string,
    count = 20,
  ): Promise<void> {
    // 실제로는 전체 사용자 풀에서 매칭 스코어 계산
    // 여기서는 간단한 플레이스홀더
    const candidates = await this.scorerService.getCandidates(userId, count);

    for (const candidate of candidates) {
      const scoreResult = await this.scorerService.calculateScore(
        userId,
        candidate.user.firebase_uid,
        token,
      );

      const rec = this.recommendationRepository.create({
        userId,
        targetUserId: candidate.user.firebase_uid,
        score: scoreResult.totalScore,
        scoreBreakdown: scoreResult.breakdown,
        sharedBits: scoreResult.sharedBits,
        reason: scoreResult.reason,
      });

      await this.recommendationRepository.save(rec);
    }
  }

  // 스킵 처리
  async skipRecommendation(
    userId: string,
    targetUserId: string,
  ): Promise<void> {
    const rec = await this.recommendationRepository.findOne({
      where: { userId, targetUserId },
    });

    if (rec) {
      rec.isSkipped = true;
      await this.recommendationRepository.save(rec);
    }
  }

  // 72시간 지난 추천 재노출 정리 (크론 잡용)
  async cleanupOldRecommendations(): Promise<void> {
    const threshold = new Date();
    threshold.setHours(threshold.getHours() - 72);

    await this.recommendationRepository.delete({
      shownAt: LessThan(threshold),
      isShown: true,
    });
  }

  // 매칭 후 초기 질문 답변 저장
  async saveInitialAnswers(
    userId: string,
    matchId: string,
    answers: Record<string, string>,
  ): Promise<void> {
    // TODO: 실제 답변 저장 로직 구현
    // 예: conversations 또는 match_metadata 테이블에 저장
    console.log('Saving initial answers:', { userId, matchId, answers });
  }
}

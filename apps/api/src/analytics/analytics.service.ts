import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, Between, MoreThanOrEqual } from "typeorm";
import { User } from "../users/entities/user.entity";
import { Match } from "../match/entities/match.entity";
import { Like } from "../match/entities/like.entity";
import { Message } from "../conversations/entities/message.entity";
import { Conversation } from "../conversations/entities/conversation.entity";

export interface DailyStats {
  date: string;
  newUsers: number;
  newMatches: number;
  totalMessages: number;
  activeConversations: number;
}

export interface MatchingStats {
  totalLikes: number;
  totalMatches: number;
  matchRate: number; // 매칭 성공률
  averageLikesPerUser: number;
}

export interface MessagingStats {
  totalConversations: number;
  activeConversations: number;
  totalMessages: number;
  averageMessagesPerConversation: number;
  firstMessageRate: number; // 상호매칭 후 첫 메시지 전송률
}

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Match)
    private readonly matchRepository: Repository<Match>,
    @InjectRepository(Like)
    private readonly likeRepository: Repository<Like>,
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
    @InjectRepository(Conversation)
    private readonly conversationRepository: Repository<Conversation>,
  ) {}

  /**
   * 일별 통계 조회
   */
  async getDailyStats(startDate: Date, endDate: Date): Promise<DailyStats[]> {
    const days: DailyStats[] = [];

    let currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const nextDate = new Date(currentDate);
      nextDate.setDate(nextDate.getDate() + 1);

      const [newUsers, newMatches, totalMessages, activeConversations] =
        await Promise.all([
          this.userRepository.count({
            where: {
              created_at: Between(currentDate, nextDate),
            },
          }),
          this.matchRepository.count({
            where: {
              createdAt: Between(currentDate, nextDate),
            },
          }),
          this.messageRepository.count({
            where: {
              createdAt: Between(currentDate, nextDate),
            },
          }),
          this.conversationRepository.count({
            where: {
              lastMessageAt: Between(currentDate, nextDate),
              isEnded: false,
            },
          }),
        ]);

      days.push({
        date: currentDate.toISOString().split("T")[0],
        newUsers,
        newMatches,
        totalMessages,
        activeConversations,
      });

      currentDate = nextDate;
    }

    return days;
  }

  /**
   * 매칭 통계
   */
  async getMatchingStats(): Promise<MatchingStats> {
    const [totalLikes, totalMatches, totalUsers] = await Promise.all([
      this.likeRepository.count(),
      this.matchRepository.count(),
      this.userRepository.count(),
    ]);

    const matchRate =
      totalLikes > 0 ? ((totalMatches * 2) / totalLikes) * 100 : 0;
    const averageLikesPerUser = totalUsers > 0 ? totalLikes / totalUsers : 0;

    return {
      totalLikes,
      totalMatches,
      matchRate: Number(matchRate.toFixed(2)),
      averageLikesPerUser: Number(averageLikesPerUser.toFixed(2)),
    };
  }

  /**
   * 메시징 통계
   */
  async getMessagingStats(): Promise<MessagingStats> {
    const [
      totalConversations,
      activeConversations,
      totalMessages,
      conversationsWithMessages,
    ] = await Promise.all([
      this.conversationRepository.count(),
      this.conversationRepository.count({ where: { isEnded: false } }),
      this.messageRepository.count(),
      this.conversationRepository
        .createQueryBuilder("conv")
        .leftJoin("messages", "msg", "msg.conversation_id = conv.id")
        .select("COUNT(DISTINCT conv.id)", "count")
        .where("msg.id IS NOT NULL")
        .getRawOne(),
    ]);

    const averageMessagesPerConversation =
      totalConversations > 0
        ? Number((totalMessages / totalConversations).toFixed(2))
        : 0;

    const firstMessageRate =
      totalConversations > 0
        ? Number(
            (
              (conversationsWithMessages.count / totalConversations) *
              100
            ).toFixed(2),
          )
        : 0;

    return {
      totalConversations,
      activeConversations,
      totalMessages,
      averageMessagesPerConversation,
      firstMessageRate,
    };
  }

  /**
   * 가입자 증가 추이 (최근 N일)
   */
  async getUserGrowth(days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const users = await this.userRepository
      .createQueryBuilder("user")
      .select("DATE(user.created_at)", "date")
      .addSelect("COUNT(*)", "count")
      .where("user.created_at >= :startDate", { startDate })
      .groupBy("DATE(user.created_at)")
      .orderBy("date", "ASC")
      .getRawMany();

    return users;
  }

  /**
   * 매칭 성공률 추이 (최근 N일)
   */
  async getMatchRateTrend(days: number = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const likes = await this.likeRepository
      .createQueryBuilder("like")
      .select("DATE(like.created_at)", "date")
      .addSelect("COUNT(*)", "count")
      .where("like.created_at >= :startDate", { startDate })
      .groupBy("DATE(like.created_at)")
      .orderBy("date", "ASC")
      .getRawMany();

    const matches = await this.matchRepository
      .createQueryBuilder("match")
      .select("DATE(match.created_at)", "date")
      .addSelect("COUNT(*)", "count")
      .where("match.created_at >= :startDate", { startDate })
      .groupBy("DATE(match.created_at)")
      .orderBy("date", "ASC")
      .getRawMany();

    // 날짜별 매칭률 계산
    const matchRateByDate = likes.map((like) => {
      const match = matches.find((m) => m.date === like.date);
      const matchCount = match ? Number(match.count) : 0;
      const likeCount = Number(like.count);
      const rate = likeCount > 0 ? ((matchCount * 2) / likeCount) * 100 : 0;

      return {
        date: like.date,
        likes: likeCount,
        matches: matchCount,
        matchRate: Number(rate.toFixed(2)),
      };
    });

    return matchRateByDate;
  }

  /**
   * 전체 대시보드 통계 (요약)
   */
  async getDashboardStats() {
    const [totalUsers, activeUsers30d, matchingStats, messagingStats] =
      await Promise.all([
        this.userRepository.count(),
        this.userRepository.count({
          where: {
            updated_at: MoreThanOrEqual(
              new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            ),
          },
        }),
        this.getMatchingStats(),
        this.getMessagingStats(),
      ]);

    return {
      users: {
        total: totalUsers,
        active30d: activeUsers30d,
      },
      matching: matchingStats,
      messaging: messagingStats,
    };
  }
}

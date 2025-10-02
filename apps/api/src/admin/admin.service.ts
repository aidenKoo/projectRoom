import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { User } from "../users/entities/user.entity";
import { Profile } from "../profiles/entities/profile.entity";
import { ProfilePrivate } from "../profiles-private/entities/profile-private.entity";
import { Preference } from "../preferences/entities/preference.entity";
import { MonthlyCode } from "../codes/entities/monthly-code.entity";
import { Referral } from "../referrals/entities/referral.entity";
import { Like } from "../match/entities/like.entity";
import { Match } from "../match/entities/match.entity";
import { Recommendation } from "../match/entities/recommendation.entity";
import { Message } from "../conversations/entities/message.entity";
import * as crypto from "crypto";

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Profile)
    private readonly profileRepository: Repository<Profile>,
    @InjectRepository(ProfilePrivate)
    private readonly profilePrivateRepository: Repository<ProfilePrivate>,
    @InjectRepository(Preference)
    private readonly preferenceRepository: Repository<Preference>,
    @InjectRepository(MonthlyCode)
    private readonly monthlyCodeRepository: Repository<MonthlyCode>,
    @InjectRepository(Referral)
    private readonly referralRepository: Repository<Referral>,
    @InjectRepository(Like)
    private readonly likeRepository: Repository<Like>,
    @InjectRepository(Match)
    private readonly matchRepository: Repository<Match>,
    @InjectRepository(Recommendation)
    private readonly recommendationRepository: Repository<Recommendation>,
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
  ) {}

  // KPI 메트릭
  async getMetrics() {
    const totalUsers = await this.userRepository.count();
    const totalMatches = await this.matchRepository.count();
    const totalMessages = await this.messageRepository.count();
    const totalLikes = await this.likeRepository.count();

    // 최근 7일 신규 가입
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const newUsersLast7Days = await this.userRepository
      .createQueryBuilder("user")
      .where("user.created_at >= :sevenDaysAgo", { sevenDaysAgo })
      .getCount();

    return {
      totalUsers,
      totalMatches,
      totalMessages,
      totalLikes,
      newUsersLast7Days,
    };
  }

  // 사용자 목록 조회
  async getUsers(page = 1, limit = 20, search?: string) {
    const skip = (page - 1) * limit;

    const query = this.userRepository.createQueryBuilder("user");

    if (search) {
      query.where("user.email LIKE :search OR user.display_name LIKE :search", {
        search: `%${search}%`,
      });
    }

    const [users, total] = await query
      .skip(skip)
      .take(limit)
      .orderBy("user.created_at", "DESC")
      .getManyAndCount();

    return {
      users,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // 사용자 상세 조회 (비공개 포함)
  async getUserDetail(uid: string) {
    const user = await this.userRepository.findOne({
      where: { firebase_uid: uid },
    });
    if (!user) {
      throw new Error("User not found");
    }

    const profile = await this.profileRepository.findOne({
      where: { user_id: user.id },
    });
    const profilePrivate = await this.profilePrivateRepository.findOne({
      where: { userId: user.id },
    });
    const preference = await this.preferenceRepository.findOne({
      where: { userId: user.id },
    });

    return {
      user,
      profile,
      profilePrivate,
      preference,
    };
  }

  // 월별 코드 목록
  async getCodes() {
    return this.monthlyCodeRepository.find({
      order: { month: "DESC" },
    });
  }

  // 월별 코드 수동 생성
  async generateMonthlyCode() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const monthKey = `${year}-${month}-01`;

    // 이미 있는지 확인
    const existing = await this.monthlyCodeRepository.findOne({
      where: { month: new Date(monthKey) },
    });

    if (existing) {
      return existing;
    }

    // 랜덤 코드 생성
    const randomPart = crypto.randomBytes(3).toString("hex").toUpperCase();
    const code = `${year}-${month}-${randomPart}`;

    const monthlyCode = this.monthlyCodeRepository.create({
      code,
      month: new Date(monthKey),
      maxUses: null, // 무제한
      usedCount: 0,
      isActive: true,
    });

    return this.monthlyCodeRepository.save(monthlyCode);
  }

  // 추천인 통계
  async getReferralStats() {
    return this.referralRepository
      .createQueryBuilder("referral")
      .select("referral.referrer_name", "referrerName")
      .addSelect("COUNT(*)", "count")
      .groupBy("referral.referrer_name")
      .orderBy("count", "DESC")
      .limit(20)
      .getRawMany();
  }

  // 매칭 큐 모니터
  async getMatchQueue(userId: string) {
    return this.recommendationRepository.find({
      where: { userId },
      order: { score: "DESC" },
      take: 20,
    });
  }
}

import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";
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
import { AuditLogsService } from "../audit-logs/audit-logs.service";
import { AuditAction } from "../audit-logs/entities/audit-log.entity";

interface AuditContext {
  accessorId: string;
  reason: string;
  action: AuditAction;
  ip?: string | null;
  requestId?: string | null;
  userAgent?: string | null;
}

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
    private readonly auditLogsService: AuditLogsService,
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

    const itemsPerPage = limit;
    const totalPages = Math.max(Math.ceil(total / itemsPerPage), 1);

    return {
      items: users,
      meta: {
        totalItems: total,
        itemsPerPage,
        currentPage: page,
        totalPages,
        hasNextPage: page < totalPages,
      },
    };
  }

  // 사용자 상세 조회 (비공개 포함)
  async getUserDetail(uid: string, auditContext?: AuditContext) {
    const user = await this.userRepository.findOne({
      where: { firebase_uid: uid },
    });
    if (!user) {
      throw new NotFoundException("User not found");
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

    const payload = {
      user,
      profile,
      profilePrivate,
      preference,
    };

    if (auditContext) {
      await this.auditLogsService.createLog({
        accessorId: auditContext.accessorId,
        targetUserId: uid,
        action: auditContext.action,
        reason: auditContext.reason,
        targetResource: "admin.users.detail",
        ip: auditContext.ip,
        requestId: auditContext.requestId,
        details: {
          profileExists: Boolean(profile),
          profilePrivateExists: Boolean(profilePrivate),
          userAgent: auditContext.userAgent,
        },
      });
    }

    return payload;
  }

  // 월별 코드 목록
  async getCodes() {
    return this.monthlyCodeRepository.find({
      order: { month: "DESC" },
    });
  }

  // 월별 코드 수동 생성
  async generateMonthlyCode(auditContext?: AuditContext) {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const monthKey = `${year}-${month}-01`;

    // 이미 있는지 확인
    const existing = await this.monthlyCodeRepository.findOne({
      where: { month: new Date(monthKey) },
    });

    if (existing) {
    if (auditContext) {
      await this.auditLogsService.createLog({
        accessorId: auditContext.accessorId,
        targetUserId: auditContext.accessorId,
        action: auditContext.action,
        reason: auditContext.reason,
        targetResource: "admin.codes.generate",
        ip: auditContext.ip,
        requestId: auditContext.requestId,
        details: {
          code: existing.code,
          month:
            existing.month instanceof Date
              ? existing.month.toISOString()
              : existing.month,
          alreadyExists: true,
          userAgent: auditContext.userAgent,
        },
      });
    }
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

    const saved = await this.monthlyCodeRepository.save(monthlyCode);

    if (auditContext) {
      await this.auditLogsService.createLog({
        accessorId: auditContext.accessorId,
        targetUserId: auditContext.accessorId,
        action: auditContext.action,
        reason: auditContext.reason,
        targetResource: "admin.codes.generate",
        ip: auditContext.ip,
        requestId: auditContext.requestId,
        details: {
          code: saved.code,
          month:
            saved.month instanceof Date
              ? saved.month.toISOString()
              : saved.month,
          alreadyExists: false,
          userAgent: auditContext.userAgent,
        },
      });
    }

    return saved;
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
  async getMatchQueue(userId?: string) {
    const query = this.recommendationRepository
      .createQueryBuilder("rec")
      .orderBy("rec.score", "DESC")
      .take(50);

    if (userId) {
      query.where("rec.userId = :userId", { userId });
    }

    const recommendations = await query.getMany();
    const now = new Date();

    const allRelevantUserIds = new Set<string>();
    recommendations.forEach((rec) => {
      allRelevantUserIds.add(rec.userId);
      allRelevantUserIds.add(rec.targetUserId);
    });

    const users = allRelevantUserIds.size
      ? await this.userRepository.find({
          where: {
            firebase_uid: In(Array.from(allRelevantUserIds)),
          },
        })
      : [];
    const usersByUid = new Map(users.map((user) => [user.firebase_uid, user]));

    const profileUserIds = users
      .map((user) => user.id)
      .filter((id) => typeof id === "number");

    const profiles = profileUserIds.length
      ? await this.profileRepository.find({
          where: { user_id: In(profileUserIds) },
        })
      : [];
    const profilesByUserId = new Map(
      profiles.map((profile) => [profile.user_id, profile]),
    );

    const waitTimes: number[] = [];
    const staleThresholdMinutes = 72 * 60;
    let queuedCount = 0;
    let shownCount = 0;
    let skippedCount = 0;
    let staleCount = 0;
    let scoreSum = 0;

    const toMinuteDiff = (start: Date, end: Date) =>
      Math.max(0, Math.round((end.getTime() - start.getTime()) / 60000));

    const buildProfileSummary = (user?: User, profile?: Profile) => {
      if (!user) {
        return null;
      }
      const currentYear = now.getFullYear();
      const age = user.birth_year ? currentYear - user.birth_year : null;
      return {
        uid: user.firebase_uid,
        email: user.email,
        name: user.display_name ?? null,
        regionCode: user.region_code ?? null,
        age,
        jobGroup: profile?.job_group ?? null,
        education: profile?.edu_level ?? null,
        hobbies: Array.isArray(profile?.hobbies) ? profile?.hobbies : null,
        mbti: Array.isArray(profile?.mbti) ? profile?.mbti : null,
      };
    };

    const formatted = recommendations.map((rec) => {
      const status = rec.isSkipped
        ? "skipped"
        : rec.isShown
        ? "shown"
        : "queued";

      const waitMinutes =
        rec.isShown && rec.shownAt
          ? toMinuteDiff(rec.createdAt, rec.shownAt)
          : toMinuteDiff(rec.createdAt, now);

      waitTimes.push(waitMinutes);
      const numericScore =
        typeof rec.score === "number"
          ? rec.score
          : Number(rec.score ?? 0);
      const safeScore = Number.isFinite(numericScore) ? numericScore : 0;
      scoreSum += safeScore;

      if (status === "queued") {
        queuedCount += 1;
        if (waitMinutes > staleThresholdMinutes) {
          staleCount += 1;
        }
      } else if (status === "shown") {
        shownCount += 1;
      } else if (status === "skipped") {
        skippedCount += 1;
      }

      const baseUser = usersByUid.get(rec.userId);
      const baseProfile = baseUser
        ? profilesByUserId.get(baseUser.id)
        : undefined;
      const targetUser = usersByUid.get(rec.targetUserId);
      const targetProfile = targetUser
        ? profilesByUserId.get(targetUser.id)
        : undefined;

      return {
        id: rec.id,
        userId: rec.userId,
        targetUserId: rec.targetUserId,
        score: safeScore,
        scoreBreakdown: rec.scoreBreakdown ?? null,
        sharedBits: rec.sharedBits ?? null,
        reason: rec.reason ?? null,
        status,
        createdAt: rec.createdAt,
        shownAt: rec.shownAt ?? null,
        waitMinutes,
        isShown: rec.isShown,
        isSkipped: rec.isSkipped,
        baseProfile: buildProfileSummary(baseUser, baseProfile),
        targetProfile: buildProfileSummary(targetUser, targetProfile),
      };
    });

    const totalCount = recommendations.length;
    const avgScore = totalCount > 0 ? scoreSum / totalCount : 0;
    const sortedWaits = waitTimes.slice().sort((a, b) => a - b);
    const p95Index =
      sortedWaits.length === 0
        ? -1
        : Math.min(sortedWaits.length - 1, Math.floor(sortedWaits.length * 0.95));
    const p95WaitMinutes = p95Index >= 0 ? sortedWaits[p95Index] : 0;

    const ownerUser = userId ? usersByUid.get(userId) : undefined;
    const ownerProfile =
      ownerUser && ownerUser.id
        ? profilesByUserId.get(ownerUser.id)
        : undefined;

    const ownerSummary = ownerUser
      ? {
          uid: ownerUser.firebase_uid,
          email: ownerUser.email,
          name: ownerUser.display_name ?? null,
          regionCode: ownerUser.region_code ?? null,
          age: ownerUser.birth_year
            ? now.getFullYear() - ownerUser.birth_year
            : null,
          jobGroup: ownerProfile?.job_group ?? null,
          education: ownerProfile?.edu_level ?? null,
        }
      : null;

    return {
      owner: ownerSummary,
      stats: {
        total: totalCount,
        queued: queuedCount,
        shown: shownCount,
        skipped: skippedCount,
        stale: staleCount,
        avgScore,
        p95WaitMinutes,
      },
      recommendations: formatted,
      retrievedAt: now.toISOString(),
      filter: {
        userId: userId ?? null,
        limit: 50,
      },
    };
  }
}

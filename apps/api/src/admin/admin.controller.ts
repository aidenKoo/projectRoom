import {
  Body,
  Controller,
  Get,
  Post,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
  Req,
  Headers,
  BadRequestException,
} from "@nestjs/common";
import { AdminService } from "./admin.service";
import { FirebaseAuthGuard } from "../common/guards/firebase-auth.guard";
import { AdminGuard } from "../common/guards/admin.guard";
import { AuditAction } from "../audit-logs/entities/audit-log.entity";
import { extractRequestContext } from "../common/utils/request-context.util";
import { ModeratePhotoDto, PhotoModerationDecision } from "./dto/moderate-photo.dto";
import { PhotoModerationStatus } from "../photos/entities/photo-meta.entity";
const toDateOrThrow = (value: string, label: string): Date => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new BadRequestException(`${label} must be a valid ISO date`);
  }
  return date;
};

const startOfDay = (date: Date): Date =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

const endOfDay = (date: Date): Date =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);

@Controller("admin")
@UseGuards(FirebaseAuthGuard, AdminGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // KPI 대시보드
  @Get("metrics")
  async getMetrics() {
    return this.adminService.getMetrics();
  }

  // 사용자 검색 및 목록
  @Get("users")
  async getUsers(
    @Query("page", new ParseIntPipe({ optional: true })) page = 1,
    @Query("limit", new ParseIntPipe({ optional: true })) limit = 20,
    @Query("search") search?: string,
  ) {
    return this.adminService.getUsers(page, limit, search);
  }

  // 특정 사용자 상세 (공개/비공개 프로필 포함)
  @Get("users/:uid")
  async getUserDetail(
    @Param("uid") uid: string,
    @Req() req: any,
    @Headers("x-audit-reason") auditReason?: string,
  ) {
    const accessorId = req.user?.uid;
    if (!accessorId) {
      throw new BadRequestException("인증 정보가 없습니다.");
    }

    const reason = auditReason?.trim();
    if (!reason) {
      throw new BadRequestException(
        "비공개 데이터 접근 시 X-Audit-Reason 헤더가 필요합니다.",
      );
    }

    const { ip, requestId, userAgent } = extractRequestContext(req);

    return this.adminService.getUserDetail(uid, {
      accessorId,
      reason,
      action: AuditAction.READ_PRIVATE_PROFILE,
      ip,
      requestId,
      userAgent,
    });
  }

  // 월별 코드 목록
  @Get("codes")
  async getCodes() {
    return this.adminService.getCodes();
  }

  // 월별 코드 수동 생성
  @Post("codes/generate")
  async generateCode(
    @Req() req: any,
    @Headers("x-audit-reason") auditReason?: string,
  ) {
    const accessorId = req.user?.uid;
    if (!accessorId) {
      throw new BadRequestException("인증 정보가 없습니다.");
    }

    const reason = auditReason?.trim();
    if (!reason) {
      throw new BadRequestException(
        "민감한 변경 작업 시 X-Audit-Reason 헤더가 필요합니다.",
      );
    }

    const { ip, requestId, userAgent } = extractRequestContext(req);

    return this.adminService.generateMonthlyCode({
      accessorId,
      reason,
      action: AuditAction.UPDATE_SENSITIVE_DATA,
      ip,
      requestId,
      userAgent,
    });
  }

  // 추천인 통계
  @Get("referrals/stats")
  async getReferralStats() {
    return this.adminService.getReferralStats();
  }

  // 매칭 큐 모니터 (추천 디버깅)
  @Get("match/queue")
  async getMatchQueue(@Query("userId") userId?: string) {
    return this.adminService.getMatchQueue(userId);
  }

  @Get("moderation/photos")
  async getPhotoModerationQueue(
    @Query("status") status?: string,
    @Query("search") search?: string,
    @Query("page") pageParam?: string,
    @Query("limit") limitParam?: string,
    @Query("dateFrom") dateFromParam?: string,
    @Query("dateTo") dateToParam?: string,
  ) {
    const allowedStatuses = Object.values(PhotoModerationStatus);
    const parsedStatuses = status
      ?.split(",")
      .map((value) => value.trim())
      .filter((value) =>
        allowedStatuses.includes(value as PhotoModerationStatus),
      ) as PhotoModerationStatus[] | undefined;

    const statuses =
      parsedStatuses && parsedStatuses.length > 0 ? parsedStatuses : undefined;

    const page = pageParam ? parseInt(pageParam, 10) : 1;
    const limit = limitParam ? parseInt(limitParam, 10) : 20;

    if (Number.isNaN(page) || page < 1) {
      throw new BadRequestException("page must be a positive integer");
    }

    if (Number.isNaN(limit) || limit < 1 || limit > 100) {
      throw new BadRequestException("limit must be between 1 and 100");
    }

    let dateFrom: Date | undefined;
    let dateTo: Date | undefined;

    if (dateFromParam) {
      dateFrom = startOfDay(toDateOrThrow(dateFromParam, "dateFrom"));
    }

    if (dateToParam) {
      dateTo = endOfDay(toDateOrThrow(dateToParam, "dateTo"));
    }

    if (dateFrom && dateTo && dateFrom > dateTo) {
      throw new BadRequestException("dateFrom cannot be after dateTo");
    }

    return this.adminService.getPhotoModerationQueue({
      statuses,
      searchTerm: search?.trim() || undefined,
      page,
      limit,
      dateFrom,
      dateTo,
    });
  }

  @Post("moderation/photos/:id/decision")
  async moderatePhoto(
    @Param("id", ParseIntPipe) id: number,
    @Body() body: ModeratePhotoDto,
    @Req() req: any,
    @Headers("x-audit-reason") auditReason?: string,
  ) {
    const accessorId = req.user?.uid;
    if (!accessorId) {
      throw new BadRequestException("���� ������ �����ϴ�.");
    }

    const reason = auditReason?.trim();
    if (!reason) {
      throw new BadRequestException(
        "�ΰ��� ���� �۾� �� X-Audit-Reason ����� �ʿ��մϴ�.",
      );
    }

    const { ip, requestId, userAgent } = extractRequestContext(req);

    const decision =
      body.decision === PhotoModerationDecision.APPROVE
        ? PhotoModerationStatus.APPROVED
        : PhotoModerationStatus.REJECTED;

    return this.adminService.moderatePhoto(
      id,
      decision,
      {
        accessorId,
        reason,
        action: AuditAction.UPDATE_SENSITIVE_DATA,
        ip,
        requestId,
        userAgent,
      },
      body.note,
    );
  }
}

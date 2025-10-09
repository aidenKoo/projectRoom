import {
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

    return this.adminService.getUserDetail(uid, {
      accessorId,
      reason,
      action: AuditAction.READ_PRIVATE_PROFILE,
    });
  }

  // 월별 코드 목록
  @Get("codes")
  async getCodes() {
    return this.adminService.getCodes();
  }

  // 월별 코드 수동 생성
  @Post("codes/generate")
  async generateCode() {
    return this.adminService.generateMonthlyCode();
  }

  // 추천인 통계
  @Get("referrals/stats")
  async getReferralStats() {
    return this.adminService.getReferralStats();
  }

  // 매칭 큐 모니터 (추천 디버깅)
  @Get("match/queue")
  async getMatchQueue(@Query("userId") userId: string) {
    return this.adminService.getMatchQueue(userId);
  }
}

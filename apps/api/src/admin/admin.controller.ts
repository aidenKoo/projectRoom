import { Controller, Get, Post, Put, Delete, Body, Param, Query, ParseIntPipe } from '@nestjs/common';
import { AdminService } from './admin.service';

@Controller('admin')
// @UseGuards(AdminGuard) - Admin only
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // KPI 대시보드
  @Get('metrics')
  async getMetrics() {
    return this.adminService.getMetrics();
  }

  // 사용자 검색 및 목록
  @Get('users')
  async getUsers(
    @Query('page', new ParseIntPipe({ optional: true })) page = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit = 20,
    @Query('search') search?: string,
  ) {
    return this.adminService.getUsers(page, limit, search);
  }

  // 특정 사용자 상세 (공개/비공개 프로필 포함)
  @Get('users/:uid')
  async getUserDetail(@Param('uid') uid: string) {
    return this.adminService.getUserDetail(uid);
  }

  // 월별 코드 목록
  @Get('codes')
  async getCodes() {
    return this.adminService.getCodes();
  }

  // 월별 코드 수동 생성
  @Post('codes/generate')
  async generateCode() {
    return this.adminService.generateMonthlyCode();
  }

  // 추천인 통계
  @Get('referrals/stats')
  async getReferralStats() {
    return this.adminService.getReferralStats();
  }

  // 매칭 큐 모니터 (추천 디버깅)
  @Get('match/queue')
  async getMatchQueue(@Query('userId') userId: string) {
    return this.adminService.getMatchQueue(userId);
  }
}

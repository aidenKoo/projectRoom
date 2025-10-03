import {
  Controller,
  Get,
  Query,
  ParseIntPipe,
} from "@nestjs/common";
import { AnalyticsService, DailyStats, MatchingStats, MessagingStats } from "./analytics.service";

@Controller("analytics")
// @UseGuards(FirebaseAuthGuard, AdminGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get("dashboard")
  async getDashboard() {
    return this.analyticsService.getDashboardStats();
  }

  @Get("daily")
  async getDailyStats(
    @Query("startDate") startDate: string,
    @Query("endDate") endDate: string,
  ): Promise<DailyStats[]> {
    const start = startDate
      ? new Date(startDate)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    return this.analyticsService.getDailyStats(start, end);
  }

  @Get("matching")
  async getMatchingStats(): Promise<MatchingStats> {
    return this.analyticsService.getMatchingStats();
  }

  @Get("messaging")
  async getMessagingStats(): Promise<MessagingStats> {
    return this.analyticsService.getMessagingStats();
  }

  @Get("user-growth")
  async getUserGrowth(
    @Query("days", new ParseIntPipe({ optional: true })) days = 30,
  ) {
    return this.analyticsService.getUserGrowth(days);
  }

  @Get("match-rate-trend")
  async getMatchRateTrend(
    @Query("days", new ParseIntPipe({ optional: true })) days = 30,
  ) {
    return this.analyticsService.getMatchRateTrend(days);
  }
}

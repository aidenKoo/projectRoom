import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
} from "@nestjs/swagger";
import { StatisticsService } from "./statistics.service";
import { FirebaseAuthGuard } from "../common/guards/firebase-auth.guard";
// import { AdminGuard } from '../common/guards/admin.guard';

@ApiTags("statistics")
@Controller("v1/statistics")
@UseGuards(FirebaseAuthGuard) // Should probably be an AdminGuard
@ApiBearerAuth("firebase")
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  @Get()
  @ApiOperation({ summary: "Get statistics for a date range" })
  @ApiQuery({ name: "startDate", required: true, example: "2025-10-01" })
  @ApiQuery({ name: "endDate", required: true, example: "2025-10-31" })
  async getStatistics(
    @Query("startDate") startDate: string,
    @Query("endDate") endDate: string,
  ) {
    return this.statisticsService.getStatistics(startDate, endDate);
  }
}

import {
  BadRequestException,
  Controller,
  Get,
  Query,
  UseGuards,
} from "@nestjs/common";
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
} from "@nestjs/swagger";
import { StatisticsService } from "./statistics.service";
import { FirebaseAuthGuard } from "../common/guards/firebase-auth.guard";
import { AdminGuard } from "../common/guards/admin.guard";
const parseDateOrThrow = (value: string, label: string): Date => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new BadRequestException(`${label} must be a valid ISO date`);
  }
  return date;
};

@ApiTags("statistics")
@Controller("v1/statistics")
@UseGuards(FirebaseAuthGuard, AdminGuard)
@ApiBearerAuth("firebase")
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  @Get("overview")
  @ApiOperation({ summary: "Get aggregated statistics" })
  @ApiQuery({ name: "startDate", required: true, example: "2025-10-01" })
  @ApiQuery({ name: "endDate", required: true, example: "2025-10-31" })
  async getOverview(
    @Query("startDate") startDate: string,
    @Query("endDate") endDate: string,
  ) {
    const start = parseDateOrThrow(startDate, "startDate");
    const end = parseDateOrThrow(endDate, "endDate");

    if (start > end) {
      throw new BadRequestException("startDate cannot be after endDate");
    }

    return this.statisticsService.getOverview(start, end);
  }

  @Get()
  @ApiOperation({ summary: "Get statistics for a date range" })
  @ApiQuery({ name: "startDate", required: true, example: "2025-10-01" })
  @ApiQuery({ name: "endDate", required: true, example: "2025-10-31" })
  async getStatistics(
    @Query("startDate") startDate: string,
    @Query("endDate") endDate: string,
  ) {
    const start = parseDateOrThrow(startDate, "startDate");
    const end = parseDateOrThrow(endDate, "endDate");

    if (start > end) {
      throw new BadRequestException("startDate cannot be after endDate");
    }

    return this.statisticsService.getStatistics(startDate, endDate);
  }

  @Get("experiments")
  @ApiOperation({ summary: "Get experiment statistics summary" })
  async getExperimentStats() {
    return this.statisticsService.getExperimentStats();
  }
}

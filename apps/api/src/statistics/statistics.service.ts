import { Injectable, BadRequestException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, Between } from "typeorm";
import { Statistic } from "./entities/statistic.entity";

@Injectable()
export class StatisticsService {
  constructor(
    @InjectRepository(Statistic)
    private readonly statisticRepository: Repository<Statistic>,
  ) {}

  private getTodayDateString(): string {
    return new Date().toISOString().split("T")[0];
  }

  async incrementSignups(): Promise<void> {
    const today = this.getTodayDateString();
    await this.statisticRepository.upsert(
      {
        date: today,
        dailySignups: () => "dailySignups + 1",
      },
      ["date"],
    );
  }

  async incrementMatches(): Promise<void> {
    const today = this.getTodayDateString();
    await this.statisticRepository.upsert(
      {
        date: today,
        dailyMatches: () => "dailyMatches + 1",
      },
      ["date"],
    );
  }

  async getStatistics(
    startDate: string,
    endDate: string,
  ): Promise<Statistic[]> {
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      throw new BadRequestException("Invalid date range");
    }

    return this.statisticRepository.find({
      where: {
        date: Between(startDate, endDate),
      },
      order: {
        date: "ASC",
      },
    });
  }

  async getOverview(start: Date, end: Date) {
    const startDate = start.toISOString().split("T")[0];
    const endDate = end.toISOString().split("T")[0];

    const records = await this.statisticRepository.find({
      where: {
        date: Between(startDate, endDate),
      },
      order: {
        date: "ASC",
      },
    });

    const dayCount = records.length || 1;

    const totals = records.reduce(
      (acc, row) => {
        acc.signups += row.dailySignups ?? 0;
        acc.matches += row.dailyMatches ?? 0;
        acc.messages += row.totalMatches ? 0 : 0; // placeholder
        acc.lastTotalUsers = row.totalUsers ?? acc.lastTotalUsers;
        acc.lastTotalMatches = row.totalMatches ?? acc.lastTotalMatches;
        return acc;
      },
      {
        signups: 0,
        matches: 0,
        messages: 0,
        lastTotalUsers: 0,
        lastTotalMatches: 0,
      },
    );

    return {
      range: {
        startDate,
        endDate,
      },
      totals: {
        signups: totals.signups,
        matches: totals.matches,
        users: totals.lastTotalUsers,
        totalMatches: totals.lastTotalMatches,
      },
      averages: {
        signupsPerDay: totals.signups / dayCount,
        matchesPerDay: totals.matches / dayCount,
      },
    };
  }

  // This would be run by a scheduled task nightly to update totals
  async updateTotalCounts(): Promise<void> {
    // This is a placeholder for a more complex query that would get total users and matches
    // from the users and matches tables.
    const today = this.getTodayDateString();
    const totalUsers = 0; // await this.usersRepository.count();
    const totalMatches = 0; // await this.matchesRepository.count();

    await this.statisticRepository.upsert(
      {
        date: today,
        totalUsers,
        totalMatches,
      },
      ["date"],
    );
  }

  /**
   * Get experiment statistics (placeholder for future A/B testing)
   * TODO: Connect to actual experiments table when A/B testing is implemented
   */
  async getExperimentStats() {
    return {
      summary: {
        activeExperiments: 0,
        draftExperiments: 0,
        completedExperiments: 0,
        totalExperiments: 0,
      },
      recent: [],
      message: "A/B testing framework not yet implemented. This is a placeholder endpoint.",
    };
  }
}

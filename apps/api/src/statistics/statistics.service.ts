import { Injectable } from "@nestjs/common";
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
    return this.statisticRepository.find({
      where: {
        date: Between(startDate, endDate),
      },
      order: {
        date: "ASC",
      },
    });
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
}

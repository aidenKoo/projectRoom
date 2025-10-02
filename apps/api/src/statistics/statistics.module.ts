import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Statistic } from "./entities/statistic.entity";
import { StatisticsService } from "./statistics.service";
import { StatisticsController } from "./statistics.controller";

@Module({
  imports: [TypeOrmModule.forFeature([Statistic])],
  providers: [StatisticsService],
  controllers: [StatisticsController],
  exports: [StatisticsService],
})
export class StatisticsModule {}

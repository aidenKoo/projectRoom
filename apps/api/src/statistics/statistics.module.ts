import { Module, forwardRef } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Statistic } from "./entities/statistic.entity";
import { StatisticsService } from "./statistics.service";
import { StatisticsController } from "./statistics.controller";
import { UsersModule } from "../users/users.module";

@Module({
  imports: [TypeOrmModule.forFeature([Statistic]), forwardRef(() => UsersModule)],
  providers: [StatisticsService],
  controllers: [StatisticsController],
  exports: [StatisticsService],
})
export class StatisticsModule {}

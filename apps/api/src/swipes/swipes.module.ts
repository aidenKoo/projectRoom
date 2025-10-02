import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { SwipesService } from "./swipes.service";
import { SwipesController } from "./swipes.controller";
import { Swipe } from "./entities/swipe.entity";
import { UsersModule } from "../users/users.module";
import { MatchesModule } from "../matches/matches.module";
import { StatisticsModule } from "../statistics/statistics.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([Swipe]),
    UsersModule,
    MatchesModule,
    StatisticsModule,
  ],
  controllers: [SwipesController],
  providers: [SwipesService],
  exports: [SwipesService],
})
export class SwipesModule {}

import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AnalyticsController } from "./analytics.controller";
import { AnalyticsService } from "./analytics.service";
import { User } from "../users/entities/user.entity";
import { Match } from "../match/entities/match.entity";
import { Like } from "../match/entities/like.entity";
import { Message } from "../conversations/entities/message.entity";
import { Conversation } from "../conversations/entities/conversation.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Match, Like, Message, Conversation]),
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}

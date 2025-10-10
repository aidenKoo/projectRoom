import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { HttpModule } from "@nestjs/axios";
import { ConfigModule } from "@nestjs/config";
import { MatchController } from "./match.controller";
import { MatchConfigController } from "./match-config.controller";
import { MatchService } from "./match.service";
import { MatchScorerService } from "./match-scorer.service";
import { Like } from "./entities/like.entity";
import { Match } from "./entities/match.entity";
import { Recommendation } from "./entities/recommendation.entity";
import { User } from "../users/entities/user.entity";
import { Profile } from "../profiles/entities/profile.entity";
import { ProfilePrivate } from "../profiles-private/entities/profile-private.entity";
import { Preference } from "../preferences/entities/preference.entity";
import { Conversation } from "../conversations/entities/conversation.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Like,
      Match,
      Recommendation,
      User,
      Profile,
      ProfilePrivate,
      Preference,
      Conversation,
    ]),
    HttpModule,
    ConfigModule,
  ],
  controllers: [MatchController, MatchConfigController],
  providers: [MatchService, MatchScorerService],
  exports: [MatchService, MatchScorerService],
})
export class MatchModule {}

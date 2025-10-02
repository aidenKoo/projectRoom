import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AdminController } from "./admin.controller";
import { AdminService } from "./admin.service";
import { User } from "../users/entities/user.entity";
import { Profile } from "../profiles/entities/profile.entity";
import { ProfilePrivate } from "../profiles-private/entities/profile-private.entity";
import { Preference } from "../preferences/entities/preference.entity";
import { MonthlyCode } from "../codes/entities/monthly-code.entity";
import { Referral } from "../referrals/entities/referral.entity";
import { Like } from "../match/entities/like.entity";
import { Match } from "../match/entities/match.entity";
import { Recommendation } from "../match/entities/recommendation.entity";
import { Message } from "../conversations/entities/message.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Profile,
      ProfilePrivate,
      Preference,
      MonthlyCode,
      Referral,
      Like,
      Match,
      Recommendation,
      Message,
    ]),
  ],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}

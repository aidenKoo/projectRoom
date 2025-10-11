import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { ABExperiment } from './entities/ab-experiment.entity';
import { User } from '../users/entities/user.entity';
import { Profile } from '../profiles/entities/profile.entity';
import { ProfilePrivate } from '../profiles-private/entities/profile-private.entity';
import { Preference } from '../preferences/entities/preference.entity';
import { MonthlyCode } from '../codes/entities/monthly-code.entity';
import { Referral } from '../referrals/entities/referral.entity';
import { Like } from '../match/entities/like.entity';
import { Match } from '../match/entities/match.entity';
import { Recommendation } from '../match/entities/recommendation.entity';
import { Message } from '../conversations/entities/message.entity';
import { PhotoMeta } from '../photos/entities/photo-meta.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ABExperiment,
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
      PhotoMeta,
    ]),
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}

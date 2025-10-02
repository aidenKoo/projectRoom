import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { FeedService } from "./feed.service";
import { FeedController } from "./feed.controller";
import { User } from "../users/entities/user.entity";
import { Profile } from "../profiles/entities/profile.entity";
import { Swipe } from "../swipes/entities/swipe.entity";
import { UsersModule } from "../users/users.module";

@Module({
  imports: [TypeOrmModule.forFeature([User, Profile, Swipe]), UsersModule],
  controllers: [FeedController],
  providers: [FeedService],
})
export class FeedModule {}

import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ProfilesPrivateController } from "./profiles-private.controller";
import { ProfilesPrivateService } from "./profiles-private.service";
import { ProfilePrivate } from "./entities/profile-private.entity";
import { UsersModule } from "../users/users.module";

@Module({
  imports: [TypeOrmModule.forFeature([ProfilePrivate]), UsersModule],
  controllers: [ProfilesPrivateController],
  providers: [ProfilesPrivateService],
  exports: [ProfilesPrivateService],
})
export class ProfilesPrivateModule {}

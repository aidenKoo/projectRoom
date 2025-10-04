import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { HttpModule } from "@nestjs/axios";
import { ConfigModule } from "@nestjs/config";
import { ProfilesController } from "./profiles.controller";
import { ProfilesService } from "./profiles.service";
import { Profile } from "./entities/profile.entity";
import { UsersModule } from "../users/users.module";
import { PhotosModule } from "../photos/photos.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([Profile]),
    UsersModule,
    HttpModule,
    ConfigModule,
    PhotosModule,
  ],
  controllers: [ProfilesController],
  providers: [ProfilesService],
  exports: [ProfilesService],
})
export class ProfilesModule {}

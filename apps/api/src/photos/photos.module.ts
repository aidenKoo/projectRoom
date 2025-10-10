import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { HttpModule } from "@nestjs/axios";
import { ConfigModule } from "@nestjs/config";
import { PhotosController } from "./photos.controller";
import { PhotoModerationWebhookController } from "./photo-moderation.controller";
import { PhotoStorageWebhookController } from "./photo-storage.controller";
import { PhotosService } from "./photos.service";
import { Photo } from "./entities/photo.entity";
import { PhotoMeta } from "./entities/photo-meta.entity";
import { UsersModule } from "../users/users.module";
import { PhotoModerationService } from "./photo-moderation.service";

@Module({
  imports: [
    HttpModule,
    ConfigModule,
    TypeOrmModule.forFeature([Photo, PhotoMeta]),
    UsersModule,
  ],
  controllers: [PhotosController, PhotoModerationWebhookController, PhotoStorageWebhookController],
  providers: [PhotosService, PhotoModerationService],
  exports: [PhotosService, PhotoModerationService],
})
export class PhotosModule {}

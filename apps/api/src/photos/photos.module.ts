import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { PhotosController } from "./photos.controller";
import { PhotosService } from "./photos.service";
import { Photo } from "./entities/photo.entity";
import { PhotoMeta } from "./entities/photo-meta.entity";
import { UsersModule } from "../users/users.module";

@Module({
  imports: [TypeOrmModule.forFeature([Photo, PhotoMeta]), UsersModule],
  controllers: [PhotosController],
  providers: [PhotosService],
  exports: [PhotosService],
})
export class PhotosModule {}

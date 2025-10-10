import {
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  UnauthorizedException,
  NotFoundException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Photo } from "./entities/photo.entity";
import { PhotoModerationService } from "./photo-moderation.service";
import { StorageWebhookDto } from "./dto/storage-webhook.dto";

@Controller("internal/photos/storage")
export class PhotoStorageWebhookController {
  constructor(
    private readonly configService: ConfigService,
    private readonly photoModerationService: PhotoModerationService,
    @InjectRepository(Photo)
    private readonly photoRepository: Repository<Photo>,
  ) {}

  @Post("upload")
  @HttpCode(HttpStatus.OK)
  async handleStorageUpload(
    @Headers("x-webhook-secret") secret: string | undefined,
    @Body() body: StorageWebhookDto,
  ) {
    const expectedSecret = this.configService.get<string>(
      "PHOTO_STORAGE_WEBHOOK_SECRET",
    );

    if (!expectedSecret || secret !== expectedSecret) {
      throw new UnauthorizedException("Invalid storage webhook secret");
    }

    const objectPath = body?.record?.name;
    if (!objectPath) {
      throw new UnauthorizedException("Invalid payload");
    }

    const photo = await this.photoRepository.findOne({
      where: { objectPath },
      relations: { meta: true },
    });

    if (!photo) {
      throw new NotFoundException("Photo not found for uploaded object");
    }

    const meta = photo.meta ?? (await this.photoModerationService.upsertMeta(
      photo.userId,
      photo,
      {
        width: photo.width,
        height: photo.height,
        bytes: photo.bytes,
        hash: photo.meta?.hash,
        source: "storage_webhook",
      },
    ));

    await this.photoModerationService.requestAutoModeration(
      meta,
      photo.publicUrl,
    );

    return { ok: true };
  }
}

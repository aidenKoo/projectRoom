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

    const metadata = body.record.metadata ?? {};

    const photo = await this.photoRepository.findOne({
      where: { objectPath },
      relations: { meta: true },
    });

    if (!photo) {
      throw new NotFoundException("Photo not found for uploaded object");
    }

    const parsedWidth = metadata.width ? Number(metadata.width) : undefined;
    const parsedHeight = metadata.height ? Number(metadata.height) : undefined;
    const parsedBytes = metadata.bytes ? Number(metadata.bytes) : undefined;

    const meta = photo.meta ??
      (await this.photoModerationService.upsertMeta(photo.userId, photo, {
        width: parsedWidth ?? photo.width ?? undefined,
        height: parsedHeight ?? photo.height ?? undefined,
        bytes: parsedBytes ?? photo.bytes ?? undefined,
        hash: metadata.hash ?? photo.meta?.hash,
        source: "storage_webhook",
      }));

    if (metadata.hash && !meta.hash) {
      meta.hash = metadata.hash;
      await this.photoModerationService.saveMeta(meta);
    }

    await this.photoModerationService.requestAutoModeration(
      meta,
      metadata.public_url ?? photo.publicUrl,
    );

    return { ok: true };
  }
}

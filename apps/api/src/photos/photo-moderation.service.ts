import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { HttpService } from "@nestjs/axios";
import { ConfigService } from "@nestjs/config";
import { Repository } from "typeorm";
import { firstValueFrom } from "rxjs";
import { Photo } from "./entities/photo.entity";
import {
  PhotoMeta,
  PhotoModerationStatus,
} from "./entities/photo-meta.entity";

interface ModerationPayload {
  width?: number;
  height?: number;
  bytes?: number;
  hash?: string;
  source?: string;
}

interface ModerationDecision {
  flagged?: boolean;
  confidence?: number;
  reasons?: string[];
  severity?: "low" | "medium" | "high";
}

@Injectable()
export class PhotoModerationService {
  private readonly logger = new Logger(PhotoModerationService.name);

  constructor(
    @InjectRepository(PhotoMeta)
    private readonly photoMetaRepository: Repository<PhotoMeta>,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  async upsertMeta(
    userId: number,
    photo: Photo,
    payload: ModerationPayload = {},
  ): Promise<PhotoMeta> {
    let meta = await this.photoMetaRepository.findOne({
      where: { photoId: photo.id },
    });

    if (!meta) {
      meta = this.photoMetaRepository.create({
        photoId: photo.id,
        userId,
        path: photo.objectPath,
        source: payload.source ?? "manual",
        status: PhotoModerationStatus.PENDING,
      });
    }

    meta.width = payload.width ?? meta.width;
    meta.height = payload.height ?? meta.height;
    meta.bytes = payload.bytes ?? meta.bytes;
    meta.hash = payload.hash ?? meta.hash;

    meta = await this.photoMetaRepository.save(meta);

    // Fire-and-forget auto moderation
    this.triggerAutoModeration(meta, photo.publicUrl).catch((error) => {
      this.logger.warn(
        `Auto moderation failed for photo ${photo.id}: ${error.message}`,
      );
    });

    return meta;
  }

  async getMetaByPhotoId(photoId: number): Promise<PhotoMeta | null> {
    return this.photoMetaRepository.findOne({
      where: { photoId },
      relations: { photo: { user: true } },
    });
  }

  async getMetaById(id: number): Promise<PhotoMeta | null> {
    return this.photoMetaRepository.findOne({
      where: { id },
      relations: { photo: { user: true } },
    });
  }

  async getModerationQueue(
    status: PhotoModerationStatus[] = [
      PhotoModerationStatus.PENDING,
      PhotoModerationStatus.AUTO_FLAGGED,
    ],
  ): Promise<PhotoMeta[]> {
    return this.photoMetaRepository.find({
      where: status.map((value) => ({ status: value })),
      relations: { photo: { user: true } },
      order: { createdAt: "ASC" },
    });
  }

  async applyDecision(
    meta: PhotoMeta,
    decision: PhotoModerationStatus.APPROVED | PhotoModerationStatus.REJECTED,
    reviewerId: string,
    notes?: string,
    flaggedReason?: string[],
  ): Promise<PhotoMeta> {
    meta.status = decision;
    meta.reviewedBy = reviewerId;
    meta.reviewedAt = new Date();
    meta.reviewNotes = notes ?? null;
    if (flaggedReason?.length) {
      meta.labels = flaggedReason;
    }
    return this.photoMetaRepository.save(meta);
  }

  async markAutoFlagged(
    meta: PhotoMeta,
    nsfwScore?: number,
    labels?: string[],
    reasons?: string[],
  ): Promise<PhotoMeta> {
    meta.status = PhotoModerationStatus.AUTO_FLAGGED;
    meta.nsfw = true;
    meta.nsfwScore = nsfwScore ?? null;
    meta.labels = labels ?? reasons ?? null;
    meta.reviewNotes = reasons?.join(", ").slice(0, 255) ?? null;
    return this.photoMetaRepository.save(meta);
  }

  private async triggerAutoModeration(
    meta: PhotoMeta,
    publicUrl: string,
  ): Promise<void> {
    const url = this.configService.get<string>(
      "SUPABASE_FN_CONTENT_MODERATOR_URL",
    );
    if (!url) {
      this.logger.warn(
        "SUPABASE_FN_CONTENT_MODERATOR_URL not set. Skipping automatic moderation.",
      );
      return;
    }

    try {
      const response = await firstValueFrom(
        this.httpService.post<ModerationDecision>(
          url,
          {
            content: publicUrl,
            type: "photo_caption",
          },
          {
            timeout: 15000,
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${this.configService.get(
                "SUPABASE_SERVICE_ROLE_KEY",
              )}`,
            },
          },
        ),
      );

      const result = response.data;
      meta.nsfw = Boolean(result.flagged);
      meta.nsfwScore =
        typeof result.confidence === "number" ? result.confidence : null;
      meta.labels = result.reasons ?? null;

      if (result.flagged) {
        await this.markAutoFlagged(
          meta,
          meta.nsfwScore ?? undefined,
          meta.labels ?? undefined,
          result.reasons,
        );
        return;
      }

      meta.status = PhotoModerationStatus.APPROVED;
      await this.photoMetaRepository.save(meta);
    } catch (error: any) {
      this.logger.warn(
        `Content moderation request failed for photo ${meta.photoId}: ${error.message}`,
      );
      if (meta.status === PhotoModerationStatus.PENDING) {
        meta.reviewNotes = "Auto moderation pending manual review";
        await this.photoMetaRepository.save(meta);
      }
    }
  }
}

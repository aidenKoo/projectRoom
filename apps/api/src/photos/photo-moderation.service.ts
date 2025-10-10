import { Injectable, Logger, NotFoundException } from "@nestjs/common";
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

export interface ModerationQueueOptions {
  statuses?: PhotoModerationStatus[];
  searchTerm?: string;
  dateFrom?: Date;
  dateTo?: Date;
  page?: number;
  limit?: number;
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
    options: ModerationQueueOptions = {},
  ): Promise<{ items: PhotoMeta[]; total: number; page: number; limit: number }> {
    const {
      statuses = [
        PhotoModerationStatus.PENDING,
        PhotoModerationStatus.AUTO_FLAGGED,
      ],
      searchTerm,
      dateFrom,
      dateTo,
      page = 1,
      limit = 20,
    } = options;

    const safePage = Math.max(1, page);
    const safeLimit = Math.min(Math.max(limit, 1), 100);

    const qb = this.photoMetaRepository
      .createQueryBuilder("meta")
      .leftJoinAndSelect("meta.photo", "photo")
      .leftJoinAndSelect("photo.user", "user")
      .orderBy("meta.created_at", "DESC");

    if (statuses.length > 0) {
      qb.andWhere("meta.status IN (:...statuses)", { statuses });
    }

    if (searchTerm) {
      const term = `%${searchTerm.toLowerCase()}%`;
      qb.andWhere(
        "(LOWER(user.email) LIKE :term OR LOWER(user.display_name) LIKE :term OR LOWER(user.firebase_uid) LIKE :term)",
        { term },
      );
    }

    if (dateFrom) {
      qb.andWhere("meta.created_at >= :dateFrom", { dateFrom });
    }

    if (dateTo) {
      qb.andWhere("meta.created_at <= :dateTo", { dateTo });
    }

    const [items, total] = await qb
      .skip((safePage - 1) * safeLimit)
      .take(safeLimit)
      .getManyAndCount();

    return {
      items,
      total,
      page: safePage,
      limit: safeLimit,
    };
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
      await firstValueFrom(
        this.httpService.post(
          url,
          {
            metaId: meta.id,
            photoId: meta.photoId,
            userId: meta.userId,
            publicUrl,
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

  async handleAutoModerationResult(
    metaId: number,
    result: ModerationDecision,
  ): Promise<PhotoMeta> {
    const meta = await this.getMetaById(metaId);
    if (!meta) {
      throw new NotFoundException("Photo moderation record not found");
    }

    meta.nsfw = Boolean(result.flagged);
    meta.nsfwScore =
      typeof result.confidence === "number" ? result.confidence : null;
    meta.labels = result.reasons ?? null;
    meta.reviewNotes = null;

    if (result.flagged) {
      return this.markAutoFlagged(
        meta,
        meta.nsfwScore ?? undefined,
        meta.labels ?? undefined,
        result.reasons,
      );
    }

    meta.status = PhotoModerationStatus.APPROVED;
    return this.photoMetaRepository.save(meta);
  }
}

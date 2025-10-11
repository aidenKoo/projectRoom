import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { HttpService } from "@nestjs/axios";
import { ConfigService } from "@nestjs/config";
import { Repository } from "typeorm";
import { firstValueFrom } from "rxjs";
import { Photo } from "./entities/photo.entity";
import {
  ModerationLabel,
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
  labels?: ModerationLabel[];
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

    return meta;
  }

  async findDuplicateByHash(
    userId: number,
    hash: string,
  ): Promise<PhotoMeta | null> {
    if (!hash) return null;

    return this.photoMetaRepository.findOne({
      where: { userId, hash },
      relations: { photo: true },
    });
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

  async saveMeta(meta: PhotoMeta): Promise<PhotoMeta> {
    return this.photoMetaRepository.save(meta);
  }

  async getModerationQueue(options: ModerationQueueOptions = {}): Promise<{
    items: PhotoMeta[];
    total: number;
    page: number;
    limit: number;
  }> {
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
    flaggedLabels?: (ModerationLabel | string)[],
  ): Promise<PhotoMeta> {
    meta.status = decision;
    meta.reviewedBy = reviewerId;
    meta.reviewedAt = new Date();
    meta.reviewNotes = notes ?? null;
    if (flaggedLabels?.length) {
      meta.labels = flaggedLabels.map<ModerationLabel>((entry) =>
        typeof entry === "string"
          ? { provider: "admin", label: entry, score: null }
          : {
              provider: entry.provider ?? "admin",
              label: entry.label,
              score: entry.score ?? null,
            },
      );
    }
    return this.photoMetaRepository.save(meta);
  }

  async markAutoFlagged(
    meta: PhotoMeta,
    nsfwScore?: number,
    labels?: ModerationLabel[] | null,
  ): Promise<PhotoMeta> {
    meta.status = PhotoModerationStatus.AUTO_FLAGGED;
    meta.nsfw = true;
    meta.nsfwScore = nsfwScore ?? null;
    meta.labels = labels ?? null;
    meta.reviewNotes =
      labels?.map((entry) => entry.label).join(", ").slice(0, 255) ?? null;
    return this.photoMetaRepository.save(meta);
  }

  private normalizeLabels(
    provider: string,
    result: ModerationDecision,
  ): ModerationLabel[] | null {
    if (result.labels && result.labels.length > 0) {
      return result.labels.map((label) => ({
        provider: label.provider ?? provider,
        label: label.label,
        score: label.score ?? result.confidence ?? null,
      }));
    }
    if (result.reasons && result.reasons.length > 0) {
      return result.reasons.map((reason) => ({
        provider,
        label: reason,
        score: result.confidence ?? null,
      }));
    }
    return null;
  }

  async requestAutoModeration(
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
            type: "photo",
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
    hash?: string,
  ): Promise<PhotoMeta> {
    const meta = await this.getMetaById(metaId);
    if (!meta) {
      throw new NotFoundException("Photo moderation record not found");
    }

    meta.nsfw = Boolean(result.flagged);
    meta.nsfwScore =
      typeof result.confidence === "number" ? result.confidence : null;
    const labels = this.normalizeLabels("supabase_claude", result);
    meta.labels = labels;
    meta.reviewNotes = null;

    // Update hash if provided from Cloud Function
    if (hash && !meta.hash) {
      meta.hash = hash;
      this.logger.log(`Updated hash for photo ${meta.photoId}: ${hash}`);
    }

    if (result.flagged) {
      return this.markAutoFlagged(
        meta,
        meta.nsfwScore ?? undefined,
        labels,
      );
    }

    meta.status = PhotoModerationStatus.APPROVED;
    return this.photoMetaRepository.save(meta);
  }
}

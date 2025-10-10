import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Photo } from "./entities/photo.entity";
import { CreatePhotoDto } from "./dto/create-photo.dto";
import { UpdatePhotoDto } from "./dto/update-photo.dto";
import { PhotoModerationService } from "./photo-moderation.service";
import { PhotoModerationStatus } from "./entities/photo-meta.entity";

@Injectable()
export class PhotosService {
  constructor(
    @InjectRepository(Photo)
    private readonly photoRepository: Repository<Photo>,
    private readonly photoModerationService: PhotoModerationService,
  ) {}

  /**
   * Create a new photo for a user
   */
  async create(userId: number, createPhotoDto: CreatePhotoDto): Promise<Photo> {
    // If this is set as primary, unset all other primary photos for this user
    if (createPhotoDto.isPrimary) {
      await this.photoRepository.update({ userId }, { isPrimary: false });
    }

    const photo = this.photoRepository.create({
      ...createPhotoDto,
      userId,
    });

    const saved = await this.photoRepository.save(photo);

    await this.photoModerationService.upsertMeta(userId, saved, {
      width: createPhotoDto.width,
      height: createPhotoDto.height,
      bytes: createPhotoDto.bytes,
      hash: createPhotoDto.hash,
      source: "manual",
    });

    return this.findOne(saved.id);
  }

  /**
   * Get all photos for a user
   */
  async findByUserId(
    userId: number,
    options: { includePending?: boolean } = {},
  ): Promise<Photo[]> {
    const qb = this.photoRepository
      .createQueryBuilder("photo")
      .leftJoinAndSelect("photo.meta", "meta")
      .where("photo.user_id = :userId", { userId })
      .orderBy("photo.is_primary", "DESC")
      .addOrderBy("photo.created_at", "ASC");

    if (!options.includePending) {
      qb.andWhere(
        "(meta.status IS NULL OR meta.status = :approved)",
        { approved: PhotoModerationStatus.APPROVED },
      );
    }

    return qb.getMany();
  }

  /**
   * Get a single photo by ID
   */
  async findOne(id: number): Promise<Photo> {
    const photo = await this.photoRepository.findOne({
      where: { id },
      relations: { meta: true },
    });
    if (!photo) {
      throw new NotFoundException("Photo not found");
    }
    return photo;
  }

  /**
   * Update a photo (mainly for setting primary)
   */
  async update(
    id: number,
    userId: number,
    updatePhotoDto: UpdatePhotoDto,
  ): Promise<Photo> {
    const photo = await this.findOne(id);

    // Ensure the photo belongs to the requesting user
    if (photo.userId !== userId) {
      throw new ForbiddenException("You can only update your own photos");
    }

    // If setting as primary, unset all other primary photos
    if (updatePhotoDto.isPrimary) {
      await this.photoRepository.update({ userId }, { isPrimary: false });
    }

    await this.photoRepository.update(id, updatePhotoDto);
    return this.findOne(id);
  }

  /**
   * Delete a photo
   */
  async remove(id: number, userId: number): Promise<void> {
    const photo = await this.findOne(id);

    // Ensure the photo belongs to the requesting user
    if (photo.userId !== userId) {
      throw new ForbiddenException("You can only delete your own photos");
    }

    await this.photoRepository.delete(id);
  }

  /**
   * Get primary photo for a user (for feed/matching)
   */
  async findPrimaryPhoto(userId: number): Promise<Photo | null> {
    const photo = await this.photoRepository
      .createQueryBuilder("photo")
      .leftJoinAndSelect("photo.meta", "meta")
      .where("photo.user_id = :userId", { userId })
      .andWhere("photo.is_primary = true")
      .andWhere(
        "(meta.status IS NULL OR meta.status = :approved)",
        { approved: PhotoModerationStatus.APPROVED },
      )
      .orderBy("photo.created_at", "ASC")
      .getOne();

    return photo ?? null;
  }
}

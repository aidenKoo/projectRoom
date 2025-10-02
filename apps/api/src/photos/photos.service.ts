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

@Injectable()
export class PhotosService {
  constructor(
    @InjectRepository(Photo)
    private readonly photoRepository: Repository<Photo>,
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

    return this.photoRepository.save(photo);
  }

  /**
   * Get all photos for a user
   */
  async findByUserId(userId: number): Promise<Photo[]> {
    return this.photoRepository.find({
      where: { userId },
      order: { isPrimary: "DESC", createdAt: "ASC" },
    });
  }

  /**
   * Get a single photo by ID
   */
  async findOne(id: number): Promise<Photo> {
    const photo = await this.photoRepository.findOne({ where: { id } });
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
    return this.photoRepository.findOne({
      where: { userId, isPrimary: true },
    });
  }
}

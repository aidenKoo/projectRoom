import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProfilePrivate } from './entities/profile-private.entity';
import { CreateProfilePrivateDto } from './dto/create-profile-private.dto';
import { UpdateProfilePrivateDto } from './dto/update-profile-private.dto';

@Injectable()
export class ProfilesPrivateService {
  constructor(
    @InjectRepository(ProfilePrivate)
    private readonly profilePrivateRepository: Repository<ProfilePrivate>,
  ) {}

  /**
   * Create or update private profile (upsert)
   * 비공개 프로필은 선택 사항 - "자신 있는 부분만" 작성
   */
  async upsert(userId: number, createDto: CreateProfilePrivateDto): Promise<ProfilePrivate> {
    const existing = await this.profilePrivateRepository.findOne({ where: { userId } });

    if (existing) {
      await this.profilePrivateRepository.update(userId, createDto);
      return this.findByUserId(userId);
    }

    const profilePrivate = this.profilePrivateRepository.create({
      ...createDto,
      userId,
    });

    return this.profilePrivateRepository.save(profilePrivate);
  }

  /**
   * Get private profile by user ID
   * 접근: 본인 + 관리자만 (audit log 필요)
   */
  async findByUserId(userId: number): Promise<ProfilePrivate | null> {
    const profile = await this.profilePrivateRepository.findOne({ where: { userId } });
    return profile;
  }

  /**
   * Update private profile
   */
  async update(userId: number, updateDto: UpdateProfilePrivateDto): Promise<ProfilePrivate> {
    const existing = await this.profilePrivateRepository.findOne({ where: { userId } });

    if (!existing) {
      // 없으면 생성
      return this.upsert(userId, updateDto);
    }

    await this.profilePrivateRepository.update(userId, updateDto);
    return this.findByUserId(userId);
  }

  /**
   * Delete private profile
   */
  async remove(userId: number): Promise<void> {
    await this.profilePrivateRepository.delete({ userId });
  }
}

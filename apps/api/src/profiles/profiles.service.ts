import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Profile } from './entities/profile.entity';

@Injectable()
export class ProfilesService {
  constructor(
    @InjectRepository(Profile)
    private profilesRepository: Repository<Profile>,
  ) {}

  async create(userId: number, data: Partial<Profile>): Promise<Profile> {
    const profile = this.profilesRepository.create({
      user_id: userId,
      ...data,
    });
    return this.profilesRepository.save(profile);
  }

  async update(userId: number, data: Partial<Profile>): Promise<Profile> {
    await this.profilesRepository.update({ user_id: userId }, data);
    return this.findByUserId(userId);
  }

  async findByUserId(userId: number): Promise<Profile> {
    const profile = await this.profilesRepository.findOne({
      where: { user_id: userId },
      relations: ['user'],
    });

    if (!profile) {
      throw new NotFoundException('Profile not found');
    }

    return profile;
  }
}

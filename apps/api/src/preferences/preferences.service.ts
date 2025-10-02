import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Preference } from "./entities/preference.entity";
import { CreatePreferenceDto } from "./dto/create-preference.dto";
import { UpdatePreferenceDto } from "./dto/update-preference.dto";
import {
  calculateWeights,
  validatePreferenceItems,
} from "./preference-weights.util";

@Injectable()
export class PreferencesService {
  constructor(
    @InjectRepository(Preference)
    private readonly preferenceRepository: Repository<Preference>,
  ) {}

  /**
   * Create or update preferences for a user
   */
  async upsert(
    userId: number,
    createPreferenceDto: CreatePreferenceDto,
  ): Promise<Preference> {
    const existing = await this.preferenceRepository.findOne({
      where: { userId },
    });

    // 선호도 랭킹 검증 및 가중치 자동 계산
    if (createPreferenceDto.items && createPreferenceDto.items.length > 0) {
      const validation = validatePreferenceItems(createPreferenceDto.items);
      if (!validation.valid) {
        throw new BadRequestException(validation.error);
      }

      // 가중치가 제공되지 않았으면 자동 계산
      if (!createPreferenceDto.weights) {
        createPreferenceDto.weights = calculateWeights(
          createPreferenceDto.items.length,
        );
      }
    }

    if (existing) {
      await this.preferenceRepository.update(userId, createPreferenceDto);
      return this.findByUserId(userId);
    }

    const preference = this.preferenceRepository.create({
      ...createPreferenceDto,
      userId,
    });

    return this.preferenceRepository.save(preference);
  }

  /**
   * Get preferences for a user
   */
  async findByUserId(userId: number): Promise<Preference> {
    const preference = await this.preferenceRepository.findOne({
      where: { userId },
    });
    if (!preference) {
      throw new NotFoundException("Preferences not found for this user");
    }
    return preference;
  }

  /**
   * Update preferences
   */
  async update(
    userId: number,
    updatePreferenceDto: UpdatePreferenceDto,
  ): Promise<Preference> {
    const existing = await this.preferenceRepository.findOne({
      where: { userId },
    });

    if (!existing) {
      throw new NotFoundException(
        "Preferences not found. Please create preferences first.",
      );
    }

    await this.preferenceRepository.update(userId, updatePreferenceDto);
    return this.findByUserId(userId);
  }

  /**
   * Delete preferences
   */
  async remove(userId: number): Promise<void> {
    const result = await this.preferenceRepository.delete({ userId });
    if (result.affected === 0) {
      throw new NotFoundException("Preferences not found");
    }
  }
}

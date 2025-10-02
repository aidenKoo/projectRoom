import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SurveyOption, OptionCategory } from './entities/survey-option.entity';
import { CreateSurveyOptionDto } from './dto/create-survey-option.dto';
import { UpdateSurveyOptionDto } from './dto/update-survey-option.dto';

@Injectable()
export class SurveyOptionsService {
  constructor(
    @InjectRepository(SurveyOption)
    private readonly surveyOptionRepository: Repository<SurveyOption>,
  ) {}

  async create(createDto: CreateSurveyOptionDto): Promise<SurveyOption> {
    const option = this.surveyOptionRepository.create(createDto);
    return this.surveyOptionRepository.save(option);
  }

  async findAll(): Promise<SurveyOption[]> {
    return this.surveyOptionRepository.find({
      order: { category: 'ASC', sortOrder: 'ASC' },
    });
  }

  async findByCategory(category: OptionCategory): Promise<SurveyOption[]> {
    return this.surveyOptionRepository.find({
      where: { category, isActive: true },
      order: { sortOrder: 'ASC' },
    });
  }

  async findOne(id: number): Promise<SurveyOption> {
    const option = await this.surveyOptionRepository.findOne({ where: { id } });
    if (!option) {
      throw new NotFoundException(`SurveyOption with ID ${id} not found`);
    }
    return option;
  }

  async update(id: number, updateDto: UpdateSurveyOptionDto): Promise<SurveyOption> {
    const option = await this.findOne(id);
    Object.assign(option, updateDto);
    return this.surveyOptionRepository.save(option);
  }

  async remove(id: number): Promise<void> {
    const option = await this.findOne(id);
    await this.surveyOptionRepository.remove(option);
  }

  async toggleActive(id: number): Promise<SurveyOption> {
    const option = await this.findOne(id);
    option.isActive = !option.isActive;
    return this.surveyOptionRepository.save(option);
  }
}

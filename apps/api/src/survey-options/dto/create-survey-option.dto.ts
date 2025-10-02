import { IsEnum, IsString, IsOptional, IsInt, IsBoolean, MaxLength } from 'class-validator';
import { OptionCategory } from '../entities/survey-option.entity';

export class CreateSurveyOptionDto {
  @IsEnum(OptionCategory)
  category: OptionCategory;

  @IsString()
  @MaxLength(100)
  value: string;

  @IsString()
  @MaxLength(100)
  @IsOptional()
  label?: string;

  @IsInt()
  @IsOptional()
  sortOrder?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

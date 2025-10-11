import { Type } from "class-transformer";
import {
  ArrayNotEmpty,
  IsArray,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from "class-validator";

export class VariantFiltersDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  regions?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  platforms?: string[];

  @IsOptional()
  @IsNumber()
  @Min(0)
  newUserDays?: number;
}

export class VariantConfigDto {
  @IsString()
  @MaxLength(20)
  key: string;

  @IsNumber()
  @Min(0)
  weight: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => VariantFiltersDto)
  filters?: VariantFiltersDto;
}

export class UpdateExperimentConfigDto {
  @IsString()
  @MaxLength(20)
  defaultVariant: string;

  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => VariantConfigDto)
  variants: VariantConfigDto[];
}


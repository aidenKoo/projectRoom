import {
  IsInt,
  IsString,
  IsOptional,
  IsObject,
  Min,
  Max,
} from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";

export class CreateProfileDto {
  @ApiPropertyOptional({ description: "Height in cm", example: 175 })
  @IsInt()
  @Min(100)
  @Max(250)
  @IsOptional()
  height_cm?: number;

  @ApiPropertyOptional({ description: "Job group", example: "IT/Tech" })
  @IsString()
  @IsOptional()
  job_group?: string;

  @ApiPropertyOptional({ description: "Education level", example: "Bachelor" })
  @IsString()
  @IsOptional()
  edu_level?: string;

  @ApiPropertyOptional({ description: "Religion", example: "Christian" })
  @IsString()
  @IsOptional()
  religion?: string;

  @ApiPropertyOptional({ description: "Drinking habit", example: "Social" })
  @IsString()
  @IsOptional()
  drink?: string;

  @ApiPropertyOptional({ description: "Smoking habit", example: "Never" })
  @IsString()
  @IsOptional()
  smoke?: string;

  @ApiPropertyOptional({
    description: "Introduction text",
    example: "Hello, nice to meet you!",
  })
  @IsString()
  @IsOptional()
  intro_text?: string;

  @ApiPropertyOptional({
    description: "Values as JSON (tags, interests, etc.)",
    example: { tags: ["fitness", "travel"], values: ["honesty", "kindness"] },
  })
  @IsObject()
  @IsOptional()
  values_json?: any;

  @ApiPropertyOptional({ description: "Active time band (0-23)", example: 18 })
  @IsInt()
  @Min(0)
  @Max(23)
  @IsOptional()
  active_time_band?: number;

  @ApiPropertyOptional({
    description: "Visibility flags",
    example: { hideAge: false, hideLocation: false },
  })
  @IsObject()
  @IsOptional()
  visibility_flags?: any;
}

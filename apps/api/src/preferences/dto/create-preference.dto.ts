import {
  IsInt,
  IsString,
  IsArray,
  IsOptional,
  Min,
  Max,
  ValidateNested,
  IsNumber,
} from "class-validator";
import { ApiPropertyOptional, ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";

class PreferenceItemDto {
  @ApiProperty({ description: "Rank (1~5)", example: 1 })
  @IsInt()
  @Min(1)
  @Max(5)
  rank: number;

  @ApiProperty({ description: "Preference type", example: "age_range" })
  @IsString()
  type: string;

  @ApiProperty({ description: "Preference value", example: "27-33" })
  value: any;
}

export class CreatePreferenceDto {
  @ApiPropertyOptional({ description: "Minimum age preference", example: 25 })
  @IsInt()
  @Min(18)
  @Max(100)
  @IsOptional()
  ageMin?: number;

  @ApiPropertyOptional({ description: "Maximum age preference", example: 35 })
  @IsInt()
  @Min(18)
  @Max(100)
  @IsOptional()
  ageMax?: number;

  @ApiPropertyOptional({ description: "Maximum distance in km", example: 50 })
  @IsInt()
  @Min(1)
  @Max(500)
  @IsOptional()
  distanceKm?: number;

  @ApiPropertyOptional({
    description: "Acceptable religions (comma-separated)",
    example: "Christian,Buddhist,None",
  })
  @IsString()
  @IsOptional()
  religionOk?: string;

  @ApiPropertyOptional({
    description: "Acceptable drinking habits (comma-separated)",
    example: "Social,Never",
  })
  @IsString()
  @IsOptional()
  drinkOk?: string;

  @ApiPropertyOptional({
    description: "Acceptable smoking habits (comma-separated)",
    example: "Never",
  })
  @IsString()
  @IsOptional()
  smokeOk?: string;

  @ApiPropertyOptional({ description: "Want children?", example: "Yes,Maybe" })
  @IsString()
  @IsOptional()
  wantChildren?: string;

  @ApiPropertyOptional({
    description: "Tags to include",
    example: ["fitness", "travel"],
  })
  @IsArray()
  @IsOptional()
  tagsInclude?: string[];

  @ApiPropertyOptional({ description: "Tags to exclude", example: ["smoking"] })
  @IsArray()
  @IsOptional()
  tagsExclude?: string[];

  // 작업서 기준: Top N 랭킹 (≤5)
  @ApiPropertyOptional({
    description: "Top ≤5 선호도 랭킹 (선택 수가 적을수록 가중치 증가)",
    type: [PreferenceItemDto],
    example: [
      { rank: 1, type: "age_range", value: "27-33" },
      { rank: 2, type: "region", value: ["SEOUL", "GWANGGYO"] },
      { rank: 3, type: "hobby_overlap", value: ["테니스", "등산"] },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PreferenceItemDto)
  @IsOptional()
  items?: PreferenceItemDto[];

  @ApiPropertyOptional({
    description: "가중치 배열 (자동 계산되지만 수동 설정도 가능)",
    example: [0.45, 0.35, 0.2],
  })
  @IsArray()
  @IsNumber({}, { each: true })
  @IsOptional()
  weights?: number[];
}

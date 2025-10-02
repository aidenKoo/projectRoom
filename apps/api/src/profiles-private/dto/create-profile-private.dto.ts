import { IsEnum, IsInt, IsOptional, IsObject, Min, Max } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";
import { WealthLevel } from "../entities/profile-private.entity";

export class CreateProfilePrivateDto {
  @ApiPropertyOptional({
    description: "재산 수준 (선택)",
    enum: WealthLevel,
    example: WealthLevel.QUITE_HIGH,
  })
  @IsEnum(WealthLevel)
  @IsOptional()
  wealthLevel?: WealthLevel;

  @ApiPropertyOptional({
    description: "외모 자신감 (1~5, 기본 3)",
    example: 4,
    minimum: 1,
    maximum: 5,
  })
  @IsInt()
  @Min(1)
  @Max(5)
  @IsOptional()
  lookConfidence?: number;

  @ApiPropertyOptional({
    description: "몸매 자신감 (1~5, 기본 3)",
    example: 3,
    minimum: 1,
    maximum: 5,
  })
  @IsInt()
  @Min(1)
  @Max(5)
  @IsOptional()
  bodyConfidence?: number;

  @ApiPropertyOptional({
    description: "성격 설문 답변 (최대 5문항)",
    example: { intro_extro: "중간", schedule: "규칙적" },
  })
  @IsObject()
  @IsOptional()
  personalityAnswers?: any;

  @ApiPropertyOptional({
    description: "가치관 설문 답변 (최대 5문항)",
    example: { family: "중요", career: "매우 중요" },
  })
  @IsObject()
  @IsOptional()
  valuesAnswers?: any;
}

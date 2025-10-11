import { Type } from "class-transformer";
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from "class-validator";
import { PhotoModerationStatus } from "../entities/photo-meta.entity";

export class ModerationResultDto {
  @IsBoolean()
  flagged: boolean;

  @IsOptional()
  @IsNumber()
  confidence?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  reasons?: string[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ModerationLabelDto)
  labels?: ModerationLabelDto[];

  @IsOptional()
  @IsIn(["low", "medium", "high"])
  severity?: "low" | "medium" | "high";
}

export class ModerationLabelDto {
  @IsString()
  provider: string;

  @IsString()
  label: string;

  @IsOptional()
  @IsNumber()
  score?: number;
}

export class ModerationWebhookDto {
  @IsNumber()
  metaId: number;

  @IsNumber()
  photoId: number;

  @IsNumber()
  userId: number;

  @IsOptional()
  @IsString()
  hash?: string;

  @IsOptional()
  @IsIn([
    PhotoModerationStatus.PENDING,
    PhotoModerationStatus.APPROVED,
    PhotoModerationStatus.REJECTED,
    PhotoModerationStatus.AUTO_FLAGGED,
  ])
  status?: PhotoModerationStatus;

  @ValidateNested()
  @Type(() => ModerationResultDto)
  result: ModerationResultDto;
}

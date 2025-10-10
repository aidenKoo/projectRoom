import { Type } from "class-transformer";
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from "class-validator";

export class StorageMetadataDto {
  @IsOptional()
  @IsString()
  meta_id?: string;

  @IsOptional()
  @IsString()
  photo_id?: string;

  @IsOptional()
  @IsString()
  user_id?: string;

  @IsOptional()
  @IsString()
  hash?: string;

  @IsOptional()
  @IsString()
  width?: string;

  @IsOptional()
  @IsString()
  height?: string;

  @IsOptional()
  @IsString()
  bytes?: string;

  @IsOptional()
  @IsString()
  public_url?: string;
}

export class StorageWebhookRecordDto {
  @IsString()
  @IsNotEmpty()
  name: string; // object path e.g., users/{uid}/photos/{id}

  @IsString()
  @IsOptional()
  bucket?: string;

  @ValidateNested()
  @Type(() => StorageMetadataDto)
  @IsOptional()
  metadata?: StorageMetadataDto;
}

export class StorageWebhookDto {
  @ValidateNested()
  @Type(() => StorageWebhookRecordDto)
  record: StorageWebhookRecordDto;
}

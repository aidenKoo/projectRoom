import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class StorageWebhookRecordDto {
  @IsString()
  @IsNotEmpty()
  name: string; // object path e.g., users/{uid}/photos/{id}

  @IsString()
  @IsOptional()
  bucket?: string;

  @IsString()
  @IsOptional()
  metadataUid?: string;
}

export class StorageWebhookDto {
  record: StorageWebhookRecordDto;
}

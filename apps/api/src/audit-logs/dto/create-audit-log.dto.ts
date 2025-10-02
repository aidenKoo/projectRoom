import { IsEnum, IsString, IsOptional, MaxLength } from "class-validator";
import { AuditAction } from "../entities/audit-log.entity";

export class CreateAuditLogDto {
  @IsEnum(AuditAction)
  action: AuditAction;

  @IsString()
  @IsOptional()
  targetUid?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  targetResource?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  reason?: string;

  @IsOptional()
  metadata?: any;
}

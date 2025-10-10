import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsOptional, IsString, MaxLength } from "class-validator";

export enum PhotoModerationDecision {
  APPROVE = "approve",
  REJECT = "reject",
}

export class ModeratePhotoDto {
  @ApiProperty({
    enum: PhotoModerationDecision,
    description: "Decision to apply for the photo.",
  })
  @IsEnum(PhotoModerationDecision)
  decision: PhotoModerationDecision;

  @ApiProperty({
    required: false,
    description: "Optional reviewer note.",
    maxLength: 255,
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  note?: string;
}

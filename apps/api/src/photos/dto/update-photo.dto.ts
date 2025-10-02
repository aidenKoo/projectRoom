import { IsBoolean, IsOptional } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";

export class UpdatePhotoDto {
  @ApiPropertyOptional({ description: "Set as primary profile photo" })
  @IsBoolean()
  @IsOptional()
  isPrimary?: boolean;
}

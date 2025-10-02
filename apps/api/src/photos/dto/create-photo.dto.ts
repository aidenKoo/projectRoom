import { IsString, IsOptional, IsInt, IsBoolean } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreatePhotoDto {
  @ApiProperty({ description: "Firebase Storage object path" })
  @IsString()
  objectPath: string;

  @ApiProperty({ description: "Public accessible URL" })
  @IsString()
  publicUrl: string;

  @ApiPropertyOptional({ description: "MIME type (e.g., image/jpeg)" })
  @IsString()
  @IsOptional()
  mimeType?: string;

  @ApiPropertyOptional({ description: "Image width in pixels" })
  @IsInt()
  @IsOptional()
  width?: number;

  @ApiPropertyOptional({ description: "Image height in pixels" })
  @IsInt()
  @IsOptional()
  height?: number;

  @ApiPropertyOptional({ description: "File size in bytes" })
  @IsInt()
  @IsOptional()
  bytes?: number;

  @ApiPropertyOptional({
    description: "Is this the primary profile photo?",
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  isPrimary?: boolean;
}

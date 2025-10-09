import {
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  ValidateIf,
} from "class-validator";

export class CreateMessageDto {
  @IsEnum(["text", "image"])
  type: "text" | "image";

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  @ValidateIf((o) => o.type === "text")
  body?: string;

  @IsOptional()
  @IsString()
  @ValidateIf((o) => o.type === "image")
  imageUrl?: string;
}

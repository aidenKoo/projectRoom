import { IsString, IsInt, IsBoolean, IsNotEmpty } from 'class-validator';

export class CreatePhotoMetaDto {
  @IsString()
  @IsNotEmpty()
  uid: string;

  @IsString()
  @IsNotEmpty()
  path: string;

  @IsString()
  @IsNotEmpty()
  thumbPath: string;

  @IsInt()
  width: number;

  @IsInt()
  height: number;

  @IsString()
  @IsNotEmpty()
  hash: string;

  @IsBoolean()
  isNsfw: boolean;
}

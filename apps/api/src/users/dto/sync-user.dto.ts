import { IsEmail, IsEnum, IsInt, IsOptional, IsString, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SyncUserDto {
  @ApiProperty({ example: 'john@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'John Doe', required: false })
  @IsOptional()
  @IsString()
  display_name?: string;

  @ApiProperty({ enum: ['M', 'F', 'N'], example: 'M' })
  @IsEnum(['M', 'F', 'N'])
  gender: 'M' | 'F' | 'N';

  @ApiProperty({ example: 1995, minimum: 1950 })
  @IsInt()
  @Min(1950)
  @Max(new Date().getFullYear() - 19)
  birth_year: number;

  @ApiProperty({ example: 'KR-SEO', required: false })
  @IsOptional()
  @IsString()
  region_code?: string;
}

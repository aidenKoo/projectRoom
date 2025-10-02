import { IsString, MaxLength, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CreateReferralDto {
  @ApiPropertyOptional({
    description: '추천인 이름 (선택)',
    example: '김프로',
    maxLength: 80
  })
  @IsString()
  @MaxLength(80)
  @IsOptional()
  referrerName?: string;
}

import { IsString } from 'class-validator';

export class SkipRecommendationDto {
  @IsString()
  targetUserId: string;
}

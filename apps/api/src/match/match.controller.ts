import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  ParseIntPipe,
  Request,
  UseGuards,
} from '@nestjs/common';
import { MatchService } from './match.service';
import { CreateLikeDto } from './dto/create-like.dto';
import { SkipRecommendationDto } from './dto/skip-recommendation.dto';

@Controller('match')
export class MatchController {
  constructor(private readonly matchService: MatchService) {}

  @Get('recommendations')
  // @UseGuards(FirebaseAuthGuard)
  async getRecommendations(
    @Request() req: any,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ) {
    const userId = req.user?.uid || 'test-user'; // Placeholder
    return this.matchService.getRecommendations(userId, limit || 9);
  }

  @Post('like')
  // @UseGuards(FirebaseAuthGuard)
  async createLike(@Request() req: any, @Body() createLikeDto: CreateLikeDto) {
    const userId = req.user?.uid || 'test-user'; // Placeholder
    return this.matchService.createLike(userId, createLikeDto.targetUserId);
  }

  @Post('skip')
  // @UseGuards(FirebaseAuthGuard)
  async skipRecommendation(@Request() req: any, @Body() skipDto: SkipRecommendationDto) {
    const userId = req.user?.uid || 'test-user'; // Placeholder
    await this.matchService.skipRecommendation(userId, skipDto.targetUserId);
    return { ok: true };
  }

  @Get('mutuals')
  // @UseGuards(FirebaseAuthGuard)
  async getMyMatches(@Request() req: any) {
    const userId = req.user?.uid || 'test-user'; // Placeholder
    return this.matchService.getMyMatches(userId);
  }

  @Get('likes-received')
  // @UseGuards(FirebaseAuthGuard)
  async getLikesReceived(@Request() req: any) {
    const userId = req.user?.uid || 'test-user'; // Placeholder
    return this.matchService.getLikesReceived(userId);
  }
}

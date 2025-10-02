import { Controller, Get, Post, Body, Param, Request } from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { MatchService } from './match.service';
import { CreateLikeDto } from './dto/create-like.dto';
import { SkipRecommendationDto } from './dto/skip-recommendation.dto';
import { FirebaseAuthGuard } from '../common/guards/firebase-auth.guard';

@ApiTags('match')
@Controller('v1/match')
@UseGuards(FirebaseAuthGuard)
@ApiBearerAuth('firebase')
export class MatchController {
  constructor(private readonly matchService: MatchService) {}

  @Get('recommendations')
  @ApiOperation({ summary: 'Get user recommendations' })
  async getRecommendations(
    @Request() req: any,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ) {
    const userId = req.user.uid;
    const token = req.headers.authorization?.split(' ')[1];
    return this.matchService.getRecommendations(userId, token, limit || 9);
  }

  @Post('like')
  @ApiOperation({ summary: 'Like a user and check for a mutual match' })
  async createLike(@Request() req: any, @Body() createLikeDto: CreateLikeDto) {
    const userId = req.user.uid;
    return this.matchService.createLike(userId, createLikeDto.targetUserId);
  }

  @Post('skip')
  @ApiOperation({ summary: 'Skip a recommended user' })
  async skipRecommendation(
    @Request() req: any,
    @Body() skipDto: SkipRecommendationDto,
  ) {
    const userId = req.user.uid;
    await this.matchService.skipRecommendation(userId, skipDto.targetUserId);
    return { ok: true };
  }

  @Get('mutuals')
  @ApiOperation({ summary: 'Get my mutual matches' })
  async getMyMatches(@Request() req: any) {
    const userId = req.user.uid;
    return this.matchService.getMyMatches(userId);
  }

  @Get('likes-received')
  @ApiOperation({ summary: 'Get users who liked me' })
  async getLikesReceived(@Request() req: any) {
    const userId = req.user.uid;
    return this.matchService.getLikesReceived(userId);
  }
}

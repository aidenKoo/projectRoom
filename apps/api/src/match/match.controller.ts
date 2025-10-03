import { Controller, Get, Post, Body, Param, UseGuards, Query, ParseIntPipe, Req, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { MatchService } from "./match.service";
import { FirebaseAuthGuard } from '../common/guards/firebase-auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from "@nestjs/swagger";
import { CreateLikeDto } from './dto/create-like.dto';
import { SkipRecommendationDto } from './dto/skip-recommendation.dto';
import { User } from '../users/entities/user.entity';

@ApiTags('match')
@Controller('v1/match')
@UseGuards(FirebaseAuthGuard)
@ApiBearerAuth('firebase')
export class MatchController {
  constructor(
    private readonly matchService: MatchService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  @Get('recommendations')
  @ApiOperation({ summary: 'Get user recommendations' })
  async getRecommendations(
    @Req() req: any,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ) {
    const userId = req.user.uid;
    const token = req.headers.authorization?.split(' ')[1];
    return this.matchService.getRecommendations(userId, token, limit || 9);
  }

  @Post('like')
  @ApiOperation({ summary: 'Like a user and check for a mutual match' })
  async createLike(@Req() req: any, @Body() createLikeDto: CreateLikeDto) {
    const firebaseUid = req.user.uid;
    const user = await this.userRepository.findOne({ where: { firebase_uid: firebaseUid } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const targetUser = await this.userRepository.findOne({ where: { id: createLikeDto.targetUserId } });
    if (!targetUser) {
      throw new NotFoundException('Target user not found');
    }

    return this.matchService.createLike(user.id, targetUser.id);
  }

  @Post('skip')
  @ApiOperation({ summary: 'Skip a recommended user' })
  async skipRecommendation(
    @Req() req: any,
    @Body() skipDto: SkipRecommendationDto,
  ) {
    const userId = req.user.uid;
    await this.matchService.skipRecommendation(userId, skipDto.targetUserId);
    return { ok: true };
  }

  @Get('mutuals')
  @ApiOperation({ summary: 'Get my mutual matches' })
  async getMyMatches(@Req() req: any) {
    const userId = req.user.uid;
    return this.matchService.getMyMatches(userId);
  }

  @Get('likes-received')
  @ApiOperation({ summary: 'Get users who liked me' })
  async getLikesReceived(@Req() req: any) {
    const firebaseUid = req.user.uid;
    const user = await this.userRepository.findOne({ where: { firebase_uid: firebaseUid } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return this.matchService.getLikesReceived(user.id);
  }

  @Post(':matchId/initial-answers')
  @ApiOperation({ summary: 'Save the initial 3-questions-3-answers' })
  async saveInitialAnswers(
    @Req() req: any,
    @Param('matchId') matchId: string,
    @Body() answers: Record<string, string>,
  ) {
    const userId = req.user.uid;
    return this.matchService.saveInitialAnswers(userId, matchId, answers);
  }
}

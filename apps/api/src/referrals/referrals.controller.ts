import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ReferralsService } from './referrals.service';
import { UsersService } from '../users/users.service';
import { CreateReferralDto } from './dto/create-referral.dto';
import { FirebaseAuthGuard } from '../common/guards/firebase-auth.guard';

@ApiTags('referrals')
@Controller('v1/referrals')
@UseGuards(FirebaseAuthGuard)
@ApiBearerAuth('firebase')
export class ReferralsController {
  constructor(
    private readonly referralsService: ReferralsService,
    private readonly usersService: UsersService,
  ) {}

  @Post()
  @ApiOperation({ summary: '추천인 정보 등록 (회원가입 시)' })
  async create(@Request() req, @Body() createReferralDto: CreateReferralDto) {
    if (!createReferralDto.referrerName) {
      return { message: '추천인이 없습니다.' };
    }

    const firebaseUid = req.user.uid;
    const user = await this.usersService.findByFirebaseUid(firebaseUid);
    return this.referralsService.create(user.id, createReferralDto.referrerName);
  }

  @Get('me')
  @ApiOperation({ summary: '내 추천인 정보 조회' })
  async findMine(@Request() req) {
    const firebaseUid = req.user.uid;
    const user = await this.usersService.findByFirebaseUid(firebaseUid);
    return this.referralsService.findByUserId(user.id);
  }

  @Get('stats')
  @ApiOperation({ summary: '추천인별 통계 (관리자)' })
  async getStats() {
    return this.referralsService.getReferrerStats();
  }

  @Get('by-referrer')
  @ApiOperation({ summary: '특정 추천인의 가입자 목록 (관리자)' })
  @ApiQuery({ name: 'name', required: true, description: '추천인 이름' })
  async findByReferrer(@Query('name') name: string) {
    return this.referralsService.findByReferrerName(name);
  }

  @Get('recent')
  @ApiOperation({ summary: '최근 추천인 목록 (관리자)' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async findRecent(@Query('limit') limit?: string) {
    const limitNum = limit ? parseInt(limit, 10) : 50;
    return this.referralsService.findRecent(limitNum);
  }
}

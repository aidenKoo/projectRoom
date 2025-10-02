import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { FeedService } from './feed.service';
import { UsersService } from '../users/users.service';
import { FirebaseAuthGuard } from '../common/guards/firebase-auth.guard';

@ApiTags('feed')
@Controller('v1/feed')
@UseGuards(FirebaseAuthGuard)
@ApiBearerAuth('firebase')
export class FeedController {
  constructor(
    private readonly feedService: FeedService,
    private readonly usersService: UsersService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get personalized feed with matching reasons' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getFeed(@Request() req, @Query('limit') limit?: string): Promise<any[]> {
    const firebaseUid = req.user.uid;
    const user = await this.usersService.findByFirebaseUid(firebaseUid);

    const limitNum = limit ? parseInt(limit, 10) : 20;
    return this.feedService.getFeed(user.id, limitNum);
  }
}

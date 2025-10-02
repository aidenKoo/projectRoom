import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { SwipesService } from './swipes.service';
import { UsersService } from '../users/users.service';
import { FirebaseAuthGuard } from '../common/guards/firebase-auth.guard';
import { IsInt, IsEnum } from 'class-validator';

class CreateSwipeDto {
  @IsInt()
  targetId: number;

  @IsEnum(['like', 'pass', 'superlike'])
  action: 'like' | 'pass' | 'superlike';
}

@ApiTags('swipes')
@Controller('v1/swipes')
@UseGuards(FirebaseAuthGuard)
@ApiBearerAuth('firebase')
export class SwipesController {
  constructor(
    private readonly swipesService: SwipesService,
    private readonly usersService: UsersService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a swipe (like/pass/superlike)' })
  async create(@Request() req, @Body() createSwipeDto: CreateSwipeDto) {
    const firebaseUid = req.user.uid;
    const user = await this.usersService.findByFirebaseUid(firebaseUid);

    return this.swipesService.create(
      user.id,
      createSwipeDto.targetId,
      createSwipeDto.action,
    );
  }
}

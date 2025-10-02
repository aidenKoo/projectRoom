import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { MessagesService } from './messages.service';
import { UsersService } from '../users/users.service';
import { FirebaseAuthGuard } from '../common/guards/firebase-auth.guard';
import { IsString, IsEnum, IsOptional } from 'class-validator';

class CreateMessageDto {
  @IsOptional()
  @IsString()
  body?: string;

  @IsEnum(['text', 'image'])
  type: 'text' | 'image';
}

@ApiTags('messages')
@Controller('v1/messages')
@UseGuards(FirebaseAuthGuard)
@ApiBearerAuth('firebase')
export class MessagesController {
  constructor(
    private readonly messagesService: MessagesService,
    private readonly usersService: UsersService,
  ) {}

  @Get(':matchId')
  @ApiOperation({ summary: 'Get messages for a match' })
  async findAll(
    @Request() req,
    @Param('matchId') matchId: string,
    @Query('limit') limit?: string,
  ) {
    const firebaseUid = req.user.uid;
    const user = await this.usersService.findByFirebaseUid(firebaseUid);

    const limitNum = limit ? parseInt(limit, 10) : 50;
    return this.messagesService.findByMatchId(
      parseInt(matchId, 10),
      user.id,
      limitNum,
    );
  }

  @Post(':matchId')
  @ApiOperation({ summary: 'Send a message in a match' })
  async create(
    @Request() req,
    @Param('matchId') matchId: string,
    @Body() createMessageDto: CreateMessageDto,
  ) {
    const firebaseUid = req.user.uid;
    const user = await this.usersService.findByFirebaseUid(firebaseUid);

    return this.messagesService.create(
      parseInt(matchId, 10),
      user.id,
      createMessageDto.body || '',
      createMessageDto.type,
    );
  }
}

import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  UseGuards,
  Request,
  Param,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ProfilesService } from './profiles.service';
import { UsersService } from '../users/users.service';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { FirebaseAuthGuard } from '../common/guards/firebase-auth.guard';

@ApiTags('profiles')
@Controller('v1/profiles')
@UseGuards(FirebaseAuthGuard)
@ApiBearerAuth('firebase')
export class ProfilesController {
  constructor(
    private readonly profilesService: ProfilesService,
    private readonly usersService: UsersService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create profile for current user' })
  async create(@Request() req, @Body() createProfileDto: CreateProfileDto) {
    const firebaseUid = req.user.uid;
    const user = await this.usersService.findByFirebaseUid(firebaseUid);
    return this.profilesService.create(user.id, createProfileDto);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get my profile' })
  async findMine(@Request() req) {
    const firebaseUid = req.user.uid;
    const user = await this.usersService.findByFirebaseUid(firebaseUid);
    return this.profilesService.findByUserId(user.id);
  }

  @Get(':userId')
  @ApiOperation({ summary: 'Get profile by user ID' })
  async findByUserId(@Param('userId') userId: string) {
    return this.profilesService.findByUserId(parseInt(userId, 10));
  }

  @Patch()
  @ApiOperation({ summary: 'Update my profile' })
  async update(@Request() req, @Body() updateProfileDto: UpdateProfileDto) {
    const firebaseUid = req.user.uid;
    const user = await this.usersService.findByFirebaseUid(firebaseUid);
    return this.profilesService.update(user.id, updateProfileDto);
  }
}

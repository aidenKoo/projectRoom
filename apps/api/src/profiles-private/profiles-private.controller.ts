import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  UseGuards,
  Request,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ProfilesPrivateService } from './profiles-private.service';
import { UsersService } from '../users/users.service';
import { CreateProfilePrivateDto } from './dto/create-profile-private.dto';
import { UpdateProfilePrivateDto } from './dto/update-profile-private.dto';
import { FirebaseAuthGuard } from '../common/guards/firebase-auth.guard';

@ApiTags('profiles-private')
@Controller('v1/profiles/private')
@UseGuards(FirebaseAuthGuard)
@ApiBearerAuth('firebase')
export class ProfilesPrivateController {
  constructor(
    private readonly profilesPrivateService: ProfilesPrivateService,
    private readonly usersService: UsersService,
  ) {}

  @Post()
  @ApiOperation({
    summary: '비공개 프로필 생성/업데이트 (선택 사항)',
    description: '비공개 영역은 "자신 있는 부분만" 작성. 매칭 품질 향상에만 사용되며 공개되지 않음.'
  })
  @ApiResponse({ status: HttpStatus.CREATED, description: '비공개 프로필 생성 성공' })
  async upsert(@Request() req, @Body() createDto: CreateProfilePrivateDto) {
    const firebaseUid = req.user.uid;
    const user = await this.usersService.findByFirebaseUid(firebaseUid);
    return this.profilesPrivateService.upsert(user.id, createDto);
  }

  @Get('me')
  @ApiOperation({ summary: '내 비공개 프로필 조회 (본인만)' })
  @ApiResponse({ status: HttpStatus.OK, description: '비공개 프로필 조회 성공' })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '비공개 프로필 없음' })
  async findMine(@Request() req) {
    const firebaseUid = req.user.uid;
    const user = await this.usersService.findByFirebaseUid(firebaseUid);
    const profile = await this.profilesPrivateService.findByUserId(user.id);

    if (!profile) {
      return { message: '비공개 프로필이 없습니다.' };
    }

    return profile;
  }

  @Patch()
  @ApiOperation({ summary: '비공개 프로필 수정' })
  async update(@Request() req, @Body() updateDto: UpdateProfilePrivateDto) {
    const firebaseUid = req.user.uid;
    const user = await this.usersService.findByFirebaseUid(firebaseUid);
    return this.profilesPrivateService.update(user.id, updateDto);
  }

  @Delete()
  @ApiOperation({ summary: '비공개 프로필 삭제' })
  async remove(@Request() req) {
    const firebaseUid = req.user.uid;
    const user = await this.usersService.findByFirebaseUid(firebaseUid);
    await this.profilesPrivateService.remove(user.id);
    return { message: '비공개 프로필이 삭제되었습니다.' };
  }
}

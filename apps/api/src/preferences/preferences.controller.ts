import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { PreferencesService } from './preferences.service';
import { UsersService } from '../users/users.service';
import { CreatePreferenceDto } from './dto/create-preference.dto';
import { UpdatePreferenceDto } from './dto/update-preference.dto';
import { FirebaseAuthGuard } from '../common/guards/firebase-auth.guard';

@ApiTags('preferences')
@Controller('v1/preferences')
@UseGuards(FirebaseAuthGuard)
@ApiBearerAuth('firebase')
export class PreferencesController {
  constructor(
    private readonly preferencesService: PreferencesService,
    private readonly usersService: UsersService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create or update preferences (upsert)' })
  async create(@Request() req, @Body() createPreferenceDto: CreatePreferenceDto) {
    const firebaseUid = req.user.uid;
    const user = await this.usersService.findByFirebaseUid(firebaseUid);
    return this.preferencesService.upsert(user.id, createPreferenceDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get my preferences' })
  async findMine(@Request() req) {
    const firebaseUid = req.user.uid;
    const user = await this.usersService.findByFirebaseUid(firebaseUid);
    return this.preferencesService.findByUserId(user.id);
  }

  @Patch()
  @ApiOperation({ summary: 'Update my preferences' })
  async update(@Request() req, @Body() updatePreferenceDto: UpdatePreferenceDto) {
    const firebaseUid = req.user.uid;
    const user = await this.usersService.findByFirebaseUid(firebaseUid);
    return this.preferencesService.update(user.id, updatePreferenceDto);
  }

  @Delete()
  @ApiOperation({ summary: 'Delete my preferences' })
  async remove(@Request() req) {
    const firebaseUid = req.user.uid;
    const user = await this.usersService.findByFirebaseUid(firebaseUid);
    await this.preferencesService.remove(user.id);
    return { message: 'Preferences deleted successfully' };
  }
}

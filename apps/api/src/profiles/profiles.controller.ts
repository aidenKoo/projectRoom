import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { ProfilesService } from "./profiles.service";
import { UsersService } from "../users/users.service";
import { CreateProfileDto } from "./dto/create-profile.dto";
import { UpdateProfileDto } from "./dto/update-profile.dto";
import { FirebaseAuthGuard } from "../common/guards/firebase-auth.guard";

@ApiTags("profiles")
@Controller("v1/profiles")
@UseGuards(FirebaseAuthGuard)
@ApiBearerAuth("firebase")
export class ProfilesController {
  constructor(
    private readonly profilesService: ProfilesService,
    private readonly usersService: UsersService,
  ) {}

  @Post()
  @ApiOperation({
    summary: "Create or update profile for current user (upsert)",
  })
  async upsert(
    @Request() req,
    @Body() profileDto: CreateProfileDto | UpdateProfileDto,
  ) {
    const firebaseUid = req.user.uid;
    const user = await this.usersService.findByFirebaseUid(firebaseUid);
    const token = req.headers.authorization?.split(" ")[1];
    return this.profilesService.upsert(user.id, profileDto, token);
  }
}

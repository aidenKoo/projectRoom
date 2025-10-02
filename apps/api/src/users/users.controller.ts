import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { UsersService } from "./users.service";
import { FirebaseAuthGuard } from "../common/guards/firebase-auth.guard";
import { SyncUserDto } from "./dto/sync-user.dto";

@ApiTags("users")
@Controller("v1/users")
@UseGuards(FirebaseAuthGuard)
@ApiBearerAuth("firebase")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post("sync")
  @ApiOperation({ summary: "Sync user from Firebase to database" })
  async sync(@Request() req, @Body() syncUserDto: SyncUserDto) {
    const firebaseUid = req.user.uid;
    return this.usersService.syncUser(firebaseUid, syncUserDto);
  }

  @Get("me")
  @ApiOperation({ summary: "Get current user info" })
  async getMe(@Request() req) {
    const firebaseUid = req.user.uid;
    return this.usersService.findByFirebaseUid(firebaseUid);
  }
}

import {
  Controller,
  Get,
  Param,
  UseGuards,
  Request,
  NotFoundException,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { MatchesService } from "./matches.service";
import { UsersService } from "../users/users.service";
import { FirebaseAuthGuard } from "../common/guards/firebase-auth.guard";

@ApiTags("matches")
@Controller("v1/matches")
@UseGuards(FirebaseAuthGuard)
@ApiBearerAuth("firebase")
export class MatchesController {
  constructor(
    private readonly matchesService: MatchesService,
    private readonly usersService: UsersService,
  ) {}

  @Get()
  @ApiOperation({ summary: "Get all matches for current user" })
  async findAll(@Request() req) {
    const firebaseUid = req.user.uid;
    const user = await this.usersService.findByFirebaseUid(firebaseUid);
    return this.matchesService.findByUserId(user.id);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get match details by ID" })
  async findOne(@Request() req, @Param("id") id: string) {
    const firebaseUid = req.user.uid;
    const user = await this.usersService.findByFirebaseUid(firebaseUid);

    const match = await this.matchesService.findById(parseInt(id, 10), user.id);
    if (!match) {
      throw new NotFoundException("Match not found");
    }

    return match;
  }
}

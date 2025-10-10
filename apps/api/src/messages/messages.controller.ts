import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ParseIntPipe,
  BadRequestException,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { MessagesService } from "./messages.service";
import { UsersService } from "../users/users.service";
import { FirebaseAuthGuard } from "../common/guards/firebase-auth.guard";
import { CreateMessageDto } from "./dto/create-message.dto";

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

@ApiTags("messages")
@Controller("v1/messages")
@UseGuards(FirebaseAuthGuard)
@ApiBearerAuth("firebase")
export class MessagesController {
  constructor(
    private readonly messagesService: MessagesService,
    private readonly usersService: UsersService,
  ) {}

  @Get(":matchId")
  @ApiOperation({ summary: "Get messages for a match" })
  async findAll(
    @Request() req: any,
    @Param("matchId", ParseIntPipe) matchId: number,
    @Query("limit") limit?: string,
  ) {
    const firebaseUid = req.user.uid;
    const user = await this.usersService.findByFirebaseUid(firebaseUid);

    const limitNum = limit ? parseInt(limit, 10) : DEFAULT_LIMIT;
    if (Number.isNaN(limitNum) || limitNum <= 0) {
      throw new BadRequestException("limit must be a positive number");
    }
    if (limitNum > MAX_LIMIT) {
      throw new BadRequestException(`limit must not exceed ${MAX_LIMIT}`);
    }

    return this.messagesService.findByMatchId(matchId, user.id, limitNum);
  }

  @Post(":matchId")
  @ApiOperation({ summary: "Send a message in a match" })
  async create(
    @Request() req: any,
    @Param("matchId", ParseIntPipe) matchId: number,
    @Body() createMessageDto: CreateMessageDto,
  ) {
    const firebaseUid = req.user.uid;
    const user = await this.usersService.findByFirebaseUid(firebaseUid);

    if (createMessageDto.type === "text" && !createMessageDto.body?.trim()) {
      throw new BadRequestException("Text messages must include a body.");
    }

    if (
      createMessageDto.type === "image" &&
      !createMessageDto.imageUrl?.trim()
    ) {
      throw new BadRequestException("Image messages require an imageUrl.");
    }

    return this.messagesService.create({
      matchId,
      senderId: user.id,
      body: createMessageDto.body?.trim() ?? "",
      type: createMessageDto.type,
      imageUrl: createMessageDto.imageUrl?.trim(),
    });
  }
}

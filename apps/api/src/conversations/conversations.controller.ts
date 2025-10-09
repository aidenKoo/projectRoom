import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Request,
  UseGuards,
  BadRequestException,
} from "@nestjs/common";
import { ConversationsService } from "./conversations.service";
import { CreateConversationDto } from "./dto/create-conversation.dto";
import { CreateMessageDto } from "./dto/create-message.dto";
import { FirebaseAuthGuard } from "../common/guards/firebase-auth.guard";

@Controller("conversations")
@UseGuards(FirebaseAuthGuard)
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  @Post()
  create(@Request() req: any, @Body() createDto: CreateConversationDto) {
    const userId = req.user?.uid;
    if (!userId) {
      throw new BadRequestException("인증 정보가 없습니다.");
    }
    return this.conversationsService.create(userId, createDto);
  }

  @Get()
  findMyConversations(@Request() req: any) {
    const userId = req.user?.uid;
    if (!userId) {
      throw new BadRequestException("인증 정보가 없습니다.");
    }
    return this.conversationsService.findMyConversations(userId);
  }

  @Get(":id")
  findOne(@Request() req: any, @Param("id") id: string) {
    const userId = req.user?.uid;
    if (!userId) {
      throw new BadRequestException("인증 정보가 없습니다.");
    }
    return this.conversationsService.findOne(id, userId);
  }

  @Get(":id/messages")
  getMessages(@Request() req: any, @Param("id") id: string) {
    const userId = req.user?.uid;
    if (!userId) {
      throw new BadRequestException("인증 정보가 없습니다.");
    }
    return this.conversationsService.getMessages(id, userId);
  }

  @Post(":id/messages")
  createMessage(
    @Request() req: any,
    @Param("id") id: string,
    @Body() createDto: CreateMessageDto,
  ) {
    const userId = req.user?.uid;
    if (!userId) {
      throw new BadRequestException("인증 정보가 없습니다.");
    }
    return this.conversationsService.createMessage(id, userId, createDto);
  }

  @Patch(":id/read")
  async markAsRead(@Request() req: any, @Param("id") id: string) {
    const userId = req.user?.uid;
    if (!userId) {
      throw new BadRequestException("인증 정보가 없습니다.");
    }
    await this.conversationsService.markAsRead(id, userId);
    return { ok: true };
  }

  @Delete(":id")
  async endConversation(@Request() req: any, @Param("id") id: string) {
    const userId = req.user?.uid;
    if (!userId) {
      throw new BadRequestException("인증 정보가 없습니다.");
    }
    await this.conversationsService.endConversation(id, userId);
    return { ok: true };
  }
}

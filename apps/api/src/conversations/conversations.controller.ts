import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Request,
} from "@nestjs/common";
import { ConversationsService } from "./conversations.service";
import { CreateConversationDto } from "./dto/create-conversation.dto";
import { CreateMessageDto } from "./dto/create-message.dto";

@Controller("conversations")
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  @Post()
  // @UseGuards(FirebaseAuthGuard)
  create(@Request() req: any, @Body() createDto: CreateConversationDto) {
    const userId = req.user?.uid || "test-user"; // Placeholder
    return this.conversationsService.create(userId, createDto);
  }

  @Get()
  // @UseGuards(FirebaseAuthGuard)
  findMyConversations(@Request() req: any) {
    const userId = req.user?.uid || "test-user"; // Placeholder
    return this.conversationsService.findMyConversations(userId);
  }

  @Get(":id")
  // @UseGuards(FirebaseAuthGuard)
  findOne(@Request() req: any, @Param("id") id: string) {
    const userId = req.user?.uid || "test-user"; // Placeholder
    return this.conversationsService.findOne(id, userId);
  }

  @Get(":id/messages")
  // @UseGuards(FirebaseAuthGuard)
  getMessages(@Request() req: any, @Param("id") id: string) {
    const userId = req.user?.uid || "test-user"; // Placeholder
    return this.conversationsService.getMessages(id, userId);
  }

  @Post(":id/messages")
  // @UseGuards(FirebaseAuthGuard)
  createMessage(
    @Request() req: any,
    @Param("id") id: string,
    @Body() createDto: CreateMessageDto,
  ) {
    const userId = req.user?.uid || "test-user"; // Placeholder
    return this.conversationsService.createMessage(id, userId, createDto);
  }

  @Patch(":id/read")
  // @UseGuards(FirebaseAuthGuard)
  async markAsRead(@Request() req: any, @Param("id") id: string) {
    const userId = req.user?.uid || "test-user"; // Placeholder
    await this.conversationsService.markAsRead(id, userId);
    return { ok: true };
  }

  @Delete(":id")
  // @UseGuards(FirebaseAuthGuard)
  async endConversation(@Request() req: any, @Param("id") id: string) {
    const userId = req.user?.uid || "test-user"; // Placeholder
    await this.conversationsService.endConversation(id, userId);
    return { ok: true };
  }
}

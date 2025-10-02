import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConversationsController } from "./conversations.controller";
import { ConversationsService } from "./conversations.service";
import { Conversation } from "./entities/conversation.entity";
import { Message } from "./entities/message.entity";
import { MatchModule } from "../match/match.module";

@Module({
  imports: [TypeOrmModule.forFeature([Conversation, Message]), MatchModule],
  controllers: [ConversationsController],
  providers: [ConversationsService],
  exports: [ConversationsService],
})
export class ConversationsModule {}

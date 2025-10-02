import { Module } from "@nestjs/common";
import { ChatGateway } from "./chat.gateway";
import { ConversationsModule } from "../conversations/conversations.module";

@Module({
  imports: [ConversationsModule],
  providers: [ChatGateway],
  exports: [ChatGateway],
})
export class WebsocketModule {}

import { IsString, Length } from "class-validator";

export class SendMessagePayload {
  @IsString()
  @Length(1, 64)
  conversationId: string;

  @IsString()
  @Length(1, 2000)
  body: string;
}

export class ConversationPayload {
  @IsString()
  @Length(1, 64)
  conversationId: string;
}

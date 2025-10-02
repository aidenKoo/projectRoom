import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { MessagesService } from "./messages.service";
import { MessagesController } from "./messages.controller";
import { Message } from "./entities/message.entity";
import { UsersModule } from "../users/users.module";
import { MatchesModule } from "../matches/matches.module";

@Module({
  imports: [TypeOrmModule.forFeature([Message]), UsersModule, MatchesModule],
  controllers: [MessagesController],
  providers: [MessagesService],
})
export class MessagesModule {}

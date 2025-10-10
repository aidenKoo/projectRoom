import {
  Injectable,
  ForbiddenException,
  BadRequestException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Message } from "./entities/message.entity";
import { MatchesService } from "../matches/matches.service";

interface CreateMessagePayload {
  matchId: number;
  senderId: number;
  body: string;
  type: "text" | "image";
  imageUrl?: string;
}

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Message)
    private messagesRepository: Repository<Message>,
    private matchesService: MatchesService,
  ) {}

  async create(payload: CreateMessagePayload): Promise<Message> {
    const { matchId, senderId, body, type, imageUrl } = payload;

    if (type === "text" && (!body || body.trim().length === 0)) {
      throw new BadRequestException("Text messages must include a body.");
    }

    // Verify user is part of the match
    const match = await this.matchesService.findById(matchId, senderId);
    if (!match) {
      throw new ForbiddenException("You are not part of this match");
    }

    const message = this.messagesRepository.create({
      match_id: matchId,
      sender_id: senderId,
      body: type === "text" ? body.trim() : null,
      type,
      image_url: type === "image" ? (imageUrl ?? null) : null,
    });

    return this.messagesRepository.save(message);
  }

  async findByMatchId(
    matchId: number,
    userId: number,
    limit = 50,
  ): Promise<Message[]> {
    // Verify user is part of the match
    const match = await this.matchesService.findById(matchId, userId);
    if (!match) {
      throw new ForbiddenException("You are not part of this match");
    }

    return this.messagesRepository
      .createQueryBuilder("message")
      .leftJoinAndSelect("message.sender", "sender")
      .where("message.match_id = :matchId", { matchId })
      .orderBy("message.created_at", "DESC")
      .limit(limit)
      .getMany();
  }
}

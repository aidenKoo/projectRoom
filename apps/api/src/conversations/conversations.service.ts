import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Conversation } from "./entities/conversation.entity";
import { Message } from "./entities/message.entity";
import { CreateConversationDto } from "./dto/create-conversation.dto";
import { CreateMessageDto } from "./dto/create-message.dto";
import { MatchService } from "../match/match.service";

@Injectable()
export class ConversationsService {
  constructor(
    @InjectRepository(Conversation)
    private readonly conversationRepository: Repository<Conversation>,
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
    private readonly matchService: MatchService,
  ) {}

  // 대화 생성 (상호 매칭 후)
  async create(
    userId: string,
    createDto: CreateConversationDto,
  ): Promise<Conversation> {
    const existing = await this.conversationRepository.findOne({
      where: { matchId: createDto.matchId },
    });

    if (existing) {
      return existing;
    }

    // matchId로 매칭 정보를 조회하고, 요청한 사용자가 참여자인지 확인
    const match = await this.matchService.findMatchById(
      createDto.matchId,
      userId,
    );

    const conversation = this.conversationRepository.create({
      matchId: createDto.matchId,
      userAId: match.uidA, // 정렬된 ID 그대로 사용
      userBId: match.uidB,
    });

    return this.conversationRepository.save(conversation);
  }

  // 내 대화 목록 조회
  async findMyConversations(userId: string): Promise<Conversation[]> {
    return this.conversationRepository
      .createQueryBuilder("conversation")
      .where(
        "conversation.user_a_id = :userId OR conversation.user_b_id = :userId",
        { userId },
      )
      .andWhere("conversation.is_ended = :isEnded", { isEnded: false })
      .orderBy("conversation.last_message_at", "DESC")
      .getMany();
  }

  // 특정 대화 조회
  async findOne(id: string, userId: string): Promise<Conversation> {
    const conversation = await this.conversationRepository.findOne({
      where: { id },
    });

    if (!conversation) {
      throw new NotFoundException(`Conversation with ID ${id} not found`);
    }

    // 권한 확인
    if (conversation.userAId !== userId && conversation.userBId !== userId) {
      throw new ForbiddenException(
        "You do not have access to this conversation",
      );
    }

    return conversation;
  }

  // 메시지 전송
  async createMessage(
    conversationId: string,
    userId: string,
    createDto: CreateMessageDto,
  ): Promise<Message> {
    const conversation = await this.findOne(conversationId, userId);

    if (conversation.isEnded) {
      throw new ForbiddenException("This conversation has ended");
    }

    const message = this.messageRepository.create({
      conversationId,
      senderUid: userId,
      body: createDto.body,
    });

    const savedMessage = await this.messageRepository.save(message);

    // 대화의 마지막 메시지 시각 업데이트
    conversation.lastMessageAt = new Date();
    await this.conversationRepository.save(conversation);

    return savedMessage;
  }

  // 대화의 메시지 목록 조회
  async getMessages(
    conversationId: string,
    userId: string,
  ): Promise<Message[]> {
    await this.findOne(conversationId, userId); // 권한 확인

    return this.messageRepository.find({
      where: { conversationId },
      order: { createdAt: "ASC" },
    });
  }

  // 메시지 읽음 처리
  async markAsRead(conversationId: string, userId: string): Promise<void> {
    await this.findOne(conversationId, userId); // 권한 확인

    await this.messageRepository
      .createQueryBuilder()
      .update(Message)
      .set({ isRead: true, readAt: new Date() })
      .where("conversation_id = :conversationId", { conversationId })
      .andWhere("sender_uid != :userId", { userId })
      .andWhere("is_read = :isRead", { isRead: false })
      .execute();
  }

  // 대화 종료 (언매치)
  async endConversation(conversationId: string, userId: string): Promise<void> {
    const conversation = await this.findOne(conversationId, userId);
    conversation.isEnded = true;
    await this.conversationRepository.save(conversation);
  }
}

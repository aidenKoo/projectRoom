import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { Logger } from "@nestjs/common";
import * as admin from "firebase-admin";
import { ConversationsService } from "../conversations/conversations.service";
import { CreateMessageDto } from "../conversations/dto/create-message.dto";

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

@WebSocketGateway({
  cors: {
    origin: "*", // 프로덕션에서는 실제 도메인으로 제한
  },
  namespace: "/chat",
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);
  private onlineUsers: Map<string, string> = new Map(); // userId -> socketId

  constructor(private readonly conversationsService: ConversationsService) {}

  async handleConnection(client: AuthenticatedSocket) {
    const userId = await this.extractUserIdFromToken(client);

    if (!userId) {
      this.logger.warn(
        `Client disconnected due to invalid token: ${client.id}`,
      );
      client.disconnect();
      return;
    }

    client.userId = userId;
    this.onlineUsers.set(userId, client.id);

    this.logger.log(`Client connected: ${client.id}, userId: ${userId}`);

    // 사용자가 속한 대화방에 조인
    const conversations =
      await this.conversationsService.findMyConversations(userId);
    conversations.forEach((conv) => {
      client.join(`conversation:${conv.id}`);
    });

    // 온라인 상태 브로드캐스트
    this.server.emit("user:online", { userId });
  }

  handleDisconnect(client: AuthenticatedSocket) {
    const userId = client.userId;
    if (userId) {
      this.onlineUsers.delete(userId);
      this.server.emit("user:offline", { userId });
      this.logger.log(`Client disconnected: ${client.id}, userId: ${userId}`);
    }
  }

  /**
   * 메시지 전송
   */
  @SubscribeMessage("message:send")
  async handleSendMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: { conversationId: string; body: string },
  ) {
    const userId = client.userId;
    if (!userId) {
      return { error: "Unauthorized" };
    }

    try {
      const message = await this.conversationsService.createMessage(
        payload.conversationId,
        userId,
        { body: payload.body } as CreateMessageDto,
      );

      // 대화방의 모든 참여자에게 메시지 전송
      this.server
        .to(`conversation:${payload.conversationId}`)
        .emit("message:new", {
          conversationId: payload.conversationId,
          message,
        });

      return { success: true, message };
    } catch (error) {
      this.logger.error("Failed to send message:", error);
      return { error: error.message };
    }
  }

  /**
   * 타이핑 상태 전송
   */
  @SubscribeMessage("typing:start")
  handleTypingStart(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: { conversationId: string },
  ) {
    const userId = client.userId;
    if (!userId) return;

    client.to(`conversation:${payload.conversationId}`).emit("typing:user", {
      conversationId: payload.conversationId,
      userId,
      isTyping: true,
    });
  }

  @SubscribeMessage("typing:stop")
  handleTypingStop(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: { conversationId: string },
  ) {
    const userId = client.userId;
    if (!userId) return;

    client.to(`conversation:${payload.conversationId}`).emit("typing:user", {
      conversationId: payload.conversationId,
      userId,
      isTyping: false,
    });
  }

  /**
   * 읽음 처리
   */
  @SubscribeMessage("message:read")
  async handleMessageRead(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: { conversationId: string },
  ) {
    const userId = client.userId;
    if (!userId) return;

    try {
      await this.conversationsService.markAsRead(
        payload.conversationId,
        userId,
      );

      // 상대방에게 읽음 알림
      client
        .to(`conversation:${payload.conversationId}`)
        .emit("message:read:ack", {
          conversationId: payload.conversationId,
          userId,
        });

      return { success: true };
    } catch (error) {
      this.logger.error("Failed to mark as read:", error);
      return { error: error.message };
    }
  }

  /**
   * 대화방 입장
   */
  @SubscribeMessage("conversation:join")
  handleJoinConversation(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: { conversationId: string },
  ) {
    client.join(`conversation:${payload.conversationId}`);
    return { success: true };
  }

  /**
   * 대화방 나가기
   */
  @SubscribeMessage("conversation:leave")
  handleLeaveConversation(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: { conversationId: string },
  ) {
    client.leave(`conversation:${payload.conversationId}`);
    return { success: true };
  }

  /**
   * 특정 사용자에게 알림 전송 (헬퍼 메서드)
   */
  sendNotificationToUser(userId: string, event: string, data: any) {
    const socketId = this.onlineUsers.get(userId);
    if (socketId) {
      this.server.to(socketId).emit(event, data);
    }
  }

  /**
   * Token에서 userId 추출 (Firebase Token 검증)
   */
  private async extractUserIdFromToken(client: Socket): Promise<string | null> {
    const token =
      client.handshake.auth?.token ||
      (client.handshake.headers?.authorization as string)?.split(" ")[1];

    if (!token) {
      return null;
    }

    try {
      if (!admin.apps.length) {
        this.logger.warn("Firebase not initialized. Cannot verify token.");
        return null; // 혹은 개발용 임시 ID 반환
      }
      const decodedToken = await admin.auth().verifyIdToken(token);
      return decodedToken.uid;
    } catch (error) {
      this.logger.error(`Token verification failed: ${error.message}`);
      return null;
    }
  }
}

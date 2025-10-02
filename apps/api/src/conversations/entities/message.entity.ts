import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from "typeorm";
import { Conversation } from "./conversation.entity";

@Entity("messages")
@Index(["conversationId", "createdAt"])
export class Message {
  @PrimaryGeneratedColumn("increment", { type: "bigint" })
  id: string;

  @Column({ name: "conversation_id", type: "bigint" })
  conversationId: string;

  @ManyToOne(() => Conversation)
  @JoinColumn({ name: "conversation_id" })
  conversation: Conversation;

  @Column({ name: "sender_uid", type: "varchar", length: 64 })
  senderUid: string;

  @Column({ type: "text", comment: "메시지 본문" })
  body: string;

  @Column({ type: "boolean", default: false, comment: "읽음 여부" })
  isRead: boolean;

  @Column({ type: "datetime", nullable: true, comment: "읽은 시각" })
  readAt?: Date;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;
}

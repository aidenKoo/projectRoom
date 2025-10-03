import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from "typeorm";

@Entity("conversations")
@Index(["matchId"])
export class Conversation {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "match_id", type: "varchar", length: 64 })
  matchId: string;

  @Column({
    name: "user_a_id",
    type: "varchar",
    length: 64,
    comment: "참여자 A (user id)",
  })
  userAId: string;

  @Column({
    name: "user_b_id",
    type: "varchar",
    length: 64,
    comment: "참여자 B (user id)",
  })
  userBId: string;

  @Column({ type: "datetime", nullable: true, comment: "마지막 메시지 시각" })
  lastMessageAt?: Date;

  @Column({
    type: "boolean",
    default: false,
    comment: "대화 종료 여부 (언매치)",
  })
  isEnded: boolean;

  @Column({ type: "json", nullable: true, name: "initial_answers", comment: "3문 3답 답변 내용" })
  initialAnswers?: Record<string, any>;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;
}

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from "typeorm";

@Entity("recommendations")
@Index(["userId", "targetUserId"], { unique: true })
export class Recommendation {
  @PrimaryGeneratedColumn("increment", { type: "bigint" })
  id: string;

  @Column({
    name: "user_id",
    type: "varchar",
    length: 64,
    comment: "추천받는 사용자",
  })
  userId: string;

  @Column({
    name: "target_user_id",
    type: "varchar",
    length: 64,
    comment: "추천된 사용자",
  })
  targetUserId: string;

  @Column({
    type: "decimal",
    precision: 5,
    scale: 4,
    comment: "매칭 점수 (0~1)",
  })
  score: number;

  @Column({ type: "json", nullable: true, comment: "점수 분해 (디버깅용)" })
  scoreBreakdown?: any;

  @Column({
    type: "json",
    nullable: true,
    comment: "Shared Bits 배지 (공통점)",
  })
  sharedBits?: string[];

  @Column({
    type: "varchar",
    length: 255,
    nullable: true,
    comment: "추천 이유 (1줄)",
  })
  reason?: string;

  @Column({ type: "boolean", default: false, comment: "노출 여부" })
  isShown: boolean;

  @Column({ type: "datetime", nullable: true, comment: "노출 시각" })
  shownAt?: Date;

  @Column({ type: "boolean", default: false, comment: "스킵 여부" })
  isSkipped: boolean;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;
}

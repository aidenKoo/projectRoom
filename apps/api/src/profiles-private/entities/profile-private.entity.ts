import {
  Entity,
  Column,
  PrimaryColumn,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import { User } from "../../users/entities/user.entity";

export enum WealthLevel {
  MID = "mid",
  QUITE_HIGH = "quite_high",
  HIGH = "high",
}

@Entity("profiles_private")
export class ProfilePrivate {
  @PrimaryColumn({ type: "bigint", unsigned: true, name: "user_id" })
  userId: number;

  @Column({
    type: "enum",
    enum: WealthLevel,
    nullable: true,
    name: "wealth_level",
    comment: "재산 수준",
  })
  wealthLevel?: WealthLevel;

  @Column({
    type: "tinyint",
    nullable: true,
    name: "look_confidence",
    comment: "외모 자신감 (1~5)",
  })
  lookConfidence?: number;

  @Column({
    type: "tinyint",
    nullable: true,
    name: "body_confidence",
    comment: "몸매 자신감 (1~5)",
  })
  bodyConfidence?: number;

  @Column({
    type: "json",
    nullable: true,
    name: "personality_answers",
    comment: "성격 설문 답변",
  })
  personalityAnswers?: any;

  @Column({
    type: "json",
    nullable: true,
    name: "values_answers",
    comment: "가치관 설문 답변",
  })
  valuesAnswers?: any;

  @CreateDateColumn({ type: "timestamp", name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ type: "timestamp", name: "updated_at" })
  updatedAt: Date;

  @OneToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user: User;
}

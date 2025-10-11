import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

export enum OptionCategory {
  HOBBY = "hobby",
  JOB = "job",
  EDUCATION = "education",
  REGION = "region",
  MBTI = "mbti",
  OTHER = "other",
}

@Entity("survey_options")
export class SurveyOption {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: "enum",
    enum: OptionCategory,
    comment: "옵션 카테고리 (취미/직업/학력 등)",
  })
  category: OptionCategory;

  @Column({ type: "varchar", length: 100, comment: "옵션 값" })
  value: string;

  @Column({
    name: "label_ko",
    type: "varchar",
    length: 100,
    nullable: true,
    comment: "한국어 라벨",
  })
  labelKo?: string;

  @Column({
    name: "label_en",
    type: "varchar",
    length: 100,
    nullable: true,
    comment: "영어 라벨",
  })
  labelEn?: string;

  @Column({ name: "display_order", type: "int", default: 0, comment: "정렬 순서" })
  displayOrder: number;

  @Column({ name: "is_active", type: "boolean", default: true, comment: "활성화 여부" })
  isActive: boolean;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;
}

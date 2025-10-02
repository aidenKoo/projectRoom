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
    type: "varchar",
    length: 100,
    nullable: true,
    comment: "표시 라벨 (다국어 지원용)",
  })
  label?: string;

  @Column({ type: "int", default: 0, comment: "정렬 순서" })
  sortOrder: number;

  @Column({ type: "boolean", default: true, comment: "활성화 여부" })
  isActive: boolean;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;
}

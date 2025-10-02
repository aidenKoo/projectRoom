import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
} from "typeorm";

@Entity("monthly_codes")
@Index("idx_month_active", ["month", "isActive"])
export class MonthlyCode {
  @PrimaryGeneratedColumn("increment")
  id: number;

  @Column({ unique: true, length: 32 })
  code: string;

  @Column({ type: "date", comment: "YYYY-MM-01 형식" })
  month: Date;

  @Column({
    type: "int",
    nullable: true,
    name: "max_uses",
    comment: "NULL = 무제한",
  })
  maxUses: number | null;

  @Column({ type: "int", default: 0, name: "used_count" })
  usedCount: number;

  @Column({ type: "boolean", default: true, name: "is_active" })
  isActive: boolean;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;
}

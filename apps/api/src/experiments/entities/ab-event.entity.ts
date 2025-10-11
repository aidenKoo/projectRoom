import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

export type AbEventType = "exposure" | "conversion";

@Entity("ab_events")
@Index(["experiment", "variant", "event"]) // aggregate by dimension
@Index(["userId", "experiment"]) // dedupe checks if needed
export class AbEvent {
  @PrimaryGeneratedColumn({ type: "bigint", unsigned: true })
  id: number;

  @Column({ type: "bigint", unsigned: true, name: "user_id" })
  userId: number;

  @Column({ type: "varchar", length: 40 })
  experiment: string;

  @Column({ type: "varchar", length: 20 })
  variant: string;

  @Column({ type: "enum", enum: ["exposure", "conversion"] })
  event: AbEventType;

  @Column({ type: "json", nullable: true })
  properties?: Record<string, any> | null;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;
}


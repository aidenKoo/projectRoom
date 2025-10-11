import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from "typeorm";

export type ExperimentChangeType =
  | "config"
  | "override_set"
  | "override_clear";

@Entity("ab_experiment_config_history")
export class AbExperimentConfigHistory {
  @PrimaryGeneratedColumn({ type: "bigint", unsigned: true })
  id: number;

  @Column({ type: "varchar", length: 40 })
  experiment: string;

  @Column({ type: "enum", enum: ["config", "override_set", "override_clear"] })
  changeType: ExperimentChangeType;

  @Column({ type: "json", nullable: true })
  payload?: Record<string, any> | null;

  @Column({ type: "varchar", length: 128, nullable: true })
  actor?: string | null;

  @Column({ type: "varchar", length: 255, nullable: true })
  reason?: string | null;

  @CreateDateColumn({ name: "recorded_at" })
  recordedAt: Date;
}

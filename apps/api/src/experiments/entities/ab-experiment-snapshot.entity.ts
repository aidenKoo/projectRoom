import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from "typeorm";

@Entity("ab_experiment_snapshots")
@Index(["snapshotDate", "experiment"], { unique: true })
export class AbExperimentSnapshot {
  @PrimaryGeneratedColumn({ type: "bigint", unsigned: true })
  id: number;

  @Column({ type: "date", name: "snapshot_date" })
  snapshotDate: string; // YYYY-MM-DD

  @Column({ type: "varchar", length: 40 })
  experiment: string;

  @Column({ type: "int", unsigned: true, default: 0 })
  exposures: number;

  @Column({ type: "int", unsigned: true, default: 0 })
  conversions: number;

  @Column({ type: "decimal", precision: 5, scale: 4, default: 0 })
  conversionRate: number;

  @CreateDateColumn({ name: "captured_at" })
  capturedAt: Date;
}

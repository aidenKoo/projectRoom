import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from "typeorm";

@Entity("ab_assignments")
@Index(["userId", "experiment"], { unique: true })
@Index(["experiment", "variant"]) // for quick counts
export class AbAssignment {
  @PrimaryGeneratedColumn({ type: "bigint", unsigned: true })
  id: number;

  @Column({ type: "bigint", unsigned: true, name: "user_id" })
  userId: number;

  @Column({ type: "varchar", length: 40 })
  experiment: string;

  @Column({ type: "varchar", length: 20 })
  variant: string;

  @CreateDateColumn({ name: "assigned_at" })
  assignedAt: Date;
}


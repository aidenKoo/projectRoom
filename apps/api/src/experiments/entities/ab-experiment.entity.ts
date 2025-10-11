import { Column, CreateDateColumn, Entity, PrimaryColumn, UpdateDateColumn } from "typeorm";

@Entity("ab_experiments")
export class AbExperiment {
  @PrimaryColumn({ type: "varchar", length: 40 })
  experiment: string;

  @Column({ type: "json" })
  config: Record<string, any>;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;
}


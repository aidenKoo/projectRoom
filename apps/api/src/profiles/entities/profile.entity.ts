import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  OneToOne,
} from "typeorm";
import { User } from "../../users/entities/user.entity";

@Entity("profiles")
export class Profile {
  @PrimaryColumn({ type: "bigint", unsigned: true })
  user_id: number;

  @OneToOne(() => User)
  @JoinColumn({ name: "user_id" })
  user: User;

  @Column({ type: "int", nullable: true })
  height_cm: number;

  @Column({ length: 50, nullable: true })
  job_group: string;

  @Column({ length: 50, nullable: true })
  edu_level: string;

  @Column({ length: 50, nullable: true })
  religion: string;

  @Column({ length: 50, nullable: true })
  drink: string;

  @Column({ length: 50, nullable: true })
  smoke: string;

  @Column({ type: "text", nullable: true })
  intro_text: string;

  @Column({ type: "json", nullable: true })
  values_json: any;

  @Column({ type: "int", nullable: true })
  active_time_band: number;

  @Column({ type: "json", nullable: true })
  visibility_flags: any;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}

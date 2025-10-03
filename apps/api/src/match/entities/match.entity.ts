import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from "typeorm";
import { User } from "../../users/entities/user.entity";

@Entity("matches")
@Index(["uidA", "uidB"], { unique: true })
export class Match {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "uid_a", type: "varchar", length: 64 })
  uidA: string;

  @Column({ name: "uid_b", type: "varchar", length: 64 })
  uidB: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: "uid_a" })
  userA: User;

  @ManyToOne(() => User)
  @JoinColumn({ name: "uid_b" })
  userB: User;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;
}

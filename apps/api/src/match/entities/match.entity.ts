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

  @Column({ name: "uid_a", type: "varchar", length: 128 })
  uidA: string;

  @Column({ name: "uid_b", type: "varchar", length: 128 })
  uidB: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: "uid_a", referencedColumnName: "firebase_uid" })
  userA: User;

  @ManyToOne(() => User)
  @JoinColumn({ name: "uid_b", referencedColumnName: "firebase_uid" })
  userB: User;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;
}

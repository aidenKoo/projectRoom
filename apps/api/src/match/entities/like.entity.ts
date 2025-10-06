import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from "typeorm";
import { User } from "../../users/entities/user.entity";

@Entity("likes")
@Unique(["fromUserId", "toUserId"])
@Index(["toUserId", "createdAt"])
export class Like {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "from_uid", type: "varchar", length: 128 })
  fromUserId: string;

  @Column({ name: "to_uid", type: "varchar", length: 128 })
  toUserId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: "from_uid", referencedColumnName: "firebase_uid" })
  fromUser: User;

  @ManyToOne(() => User)
  @JoinColumn({ name: "to_uid", referencedColumnName: "firebase_uid" })
  toUser: User;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;
}

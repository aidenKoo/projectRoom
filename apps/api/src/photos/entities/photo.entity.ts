import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from "typeorm";
import { User } from "../../users/entities/user.entity";

@Entity("photos")
@Index("idx_user_id", ["userId"])
@Index("idx_is_primary", ["userId", "isPrimary"])
export class Photo {
  @PrimaryGeneratedColumn({ type: "bigint", unsigned: true })
  id: number;

  @Column({ type: "bigint", unsigned: true, name: "user_id" })
  userId: number;

  @Column({ type: "varchar", length: 500, name: "object_path" })
  objectPath: string;

  @Column({ type: "varchar", length: 1000, name: "public_url" })
  publicUrl: string;

  @Column({ type: "varchar", length: 50, nullable: true, name: "mime_type" })
  mimeType?: string;

  @Column({ type: "int", nullable: true })
  width?: number;

  @Column({ type: "int", nullable: true })
  height?: number;

  @Column({ type: "bigint", nullable: true })
  bytes?: number;

  @Column({ type: "boolean", default: false, name: "is_primary" })
  isPrimary: boolean;

  @CreateDateColumn({ type: "timestamp", name: "created_at" })
  createdAt: Date;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user: User;
}

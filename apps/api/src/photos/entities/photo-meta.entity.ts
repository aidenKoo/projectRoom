import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { Photo } from "./photo.entity";

export enum PhotoModerationStatus {
  PENDING = "pending",
  APPROVED = "approved",
  REJECTED = "rejected",
  AUTO_FLAGGED = "auto_flagged",
}

@Entity("photo_meta")
@Index(["userId", "status"])
@Index("uniq_user_path", ["userId", "path"], { unique: true })
@Index("idx_hash", ["hash"])
export class PhotoMeta {
  @PrimaryGeneratedColumn({ type: "bigint", unsigned: true })
  id: number;

  @Column({ type: "bigint", unsigned: true, name: "photo_id", unique: true })
  photoId: number;

  @Column({ type: "bigint", unsigned: true, name: "user_id" })
  userId: number;

  @Column({ type: "varchar", length: 255 })
  path: string;

  @Column({ type: "varchar", length: 32, default: "manual" })
  source: string;

  @Column({ type: "int", nullable: true })
  width?: number;

  @Column({ type: "int", nullable: true })
  height?: number;

  @Column({ type: "bigint", nullable: true })
  bytes?: number;

  @Column({ type: "varchar", length: 64, nullable: true })
  hash?: string;

  @Column({ type: "boolean", name: "nsfw", default: false })
  nsfw: boolean;

  @Column({
    type: "enum",
    enum: PhotoModerationStatus,
    default: PhotoModerationStatus.PENDING,
  })
  status: PhotoModerationStatus;

  @Column({ type: "decimal", precision: 5, scale: 4, nullable: true })
  nsfwScore?: number | null;

  @Column({ type: "json", nullable: true })
  labels?: string[] | null;

  @Column({ type: "varchar", length: 255, nullable: true })
  reviewNotes?: string | null;

  @Column({ type: "datetime", nullable: true })
  reviewedAt?: Date | null;

  @Column({ type: "varchar", length: 64, nullable: true })
  reviewedBy?: string | null;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;

  @OneToOne(() => Photo, (photo) => photo.meta, { onDelete: "CASCADE" })
  @JoinColumn({ name: "photo_id" })
  photo: Photo;
}

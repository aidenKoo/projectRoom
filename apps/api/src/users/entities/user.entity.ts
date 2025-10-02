import { Profile } from "../../profiles/entities/profile.entity";
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity("users")
export class User {
  @PrimaryGeneratedColumn({ type: "bigint", unsigned: true })
  id: number;

  @Column({ unique: true, length: 128 })
  @Index()
  firebase_uid: string;

  @Column({ length: 255 })
  email: string;

  @Column({ length: 100, nullable: true })
  display_name: string;

  @Column({ type: "enum", enum: ["M", "F", "N"] })
  gender: "M" | "F" | "N";

  @Column({ type: "int" })
  birth_year: number;

  @Column({ length: 20, nullable: true })
  @Index()
  region_code: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}

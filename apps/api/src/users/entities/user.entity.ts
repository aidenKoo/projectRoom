import { Entity, PrimaryGeneratedColumn, Column, Index, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity("users")
export class User {
  @PrimaryGeneratedColumn({ type: "bigint", unsigned: true })
  id: number;

  @Index({ unique: true })
  @Column({ length: 128 })
  uid: string; // Firebase UID 저장

  @Column({ length: 255, unique: true })
  email: string;

  @Column({ type: 'int', nullable: true, comment: '출생년도' })
  birth_year: number;

  @Column({
    type: 'timestamp',
    nullable: true,
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
    comment: '마지막 활동 시간',
  })
  last_active_at: Date;

  @CreateDateColumn() created_at: Date;
  @UpdateDateColumn() updated_at: Date;
}

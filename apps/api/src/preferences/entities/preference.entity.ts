import {
  Entity,
  Column,
  PrimaryColumn,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('preferences')
export class Preference {
  @PrimaryColumn({ type: 'bigint', unsigned: true, name: 'user_id' })
  userId: number;

  @Column({ type: 'int', nullable: true, name: 'age_min' })
  ageMin?: number;

  @Column({ type: 'int', nullable: true, name: 'age_max' })
  ageMax?: number;

  @Column({ type: 'int', nullable: true, name: 'distance_km' })
  distanceKm?: number;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'religion_ok' })
  religionOk?: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'drink_ok' })
  drinkOk?: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'smoke_ok' })
  smokeOk?: string;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'want_children' })
  wantChildren?: string;

  @Column({ type: 'json', nullable: true, name: 'tags_include' })
  tagsInclude?: string[];

  @Column({ type: 'json', nullable: true, name: 'tags_exclude' })
  tagsExclude?: string[];

  // 선호도 Top N 랭킹 (작업서 기준)
  @Column({ type: 'json', nullable: true, comment: 'Top ≤5 선호도 랭킹 [{rank, type, value}]' })
  items?: Array<{ rank: number; type: string; value: any }>;

  @Column({ type: 'json', nullable: true, comment: '선호도 가중치 배열 (예: [0.45, 0.35, 0.20])' })
  weights?: number[];

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
  updatedAt: Date;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}

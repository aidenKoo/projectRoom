import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('matches')
@Index(['user_a', 'user_b'], { unique: true })
@Index(['user_a', 'status'])
@Index(['user_b', 'status'])
export class Match {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ type: 'bigint', unsigned: true })
  user_a: number;

  @Column({ type: 'bigint', unsigned: true })
  user_b: number;

  @Column({ type: 'enum', enum: ['active', 'closed'], default: 'active' })
  status: 'active' | 'closed';

  @CreateDateColumn()
  created_at: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_a' })
  userA: User;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_b' })
  userB: User;
}

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

@Entity('swipes')
@Index(['actor_id', 'target_id'], { unique: true })
@Index(['actor_id', 'created_at'])
export class Swipe {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ type: 'bigint', unsigned: true })
  actor_id: number;

  @Column({ type: 'bigint', unsigned: true })
  target_id: number;

  @Column({ type: 'enum', enum: ['like', 'pass', 'superlike'] })
  action: 'like' | 'pass' | 'superlike';

  @CreateDateColumn()
  created_at: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'actor_id' })
  actor: User;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'target_id' })
  target: User;
}

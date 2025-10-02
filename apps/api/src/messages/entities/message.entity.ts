import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Match } from '../../matches/entities/match.entity';
import { User } from '../../users/entities/user.entity';

@Entity('messages')
@Index(['match_id', 'created_at'])
export class Message {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: number;

  @Column({ type: 'bigint', unsigned: true })
  match_id: number;

  @Column({ type: 'bigint', unsigned: true })
  sender_id: number;

  @Column({ type: 'text', nullable: true })
  body: string;

  @Column({ type: 'enum', enum: ['text', 'image'], default: 'text' })
  type: 'text' | 'image';

  @CreateDateColumn()
  created_at: Date;

  @ManyToOne(() => Match)
  @JoinColumn({ name: 'match_id' })
  match: Match;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'sender_id' })
  sender: User;
}

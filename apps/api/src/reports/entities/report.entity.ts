import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('reports')
export class Report {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column()
  reporterUserId: string;

  @Column()
  reportedUserId: string;

  @Column('text')
  reason: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'reporterUserId', referencedColumnName: 'uid' })
  reporter: User;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'reportedUserId', referencedColumnName: 'uid' })
  reported: User;
}

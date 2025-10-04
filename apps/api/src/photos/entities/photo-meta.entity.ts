import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('photo_meta')
export class PhotoMeta {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column()
  uid: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'uid', referencedColumnName: 'uid' })
  user: User;

  @Column()
  path: string;

  @Column({ nullable: true })
  width: number;

  @Column({ nullable: true })
  height: number;

  @Column({ nullable: true })
  hash: string;

  @Column({ default: false })
  nsfw: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

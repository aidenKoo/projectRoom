import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('ab_experiments')
export class ABExperiment {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ unique: true, length: 80 })
  name: string;

  @Column('json')
  variants: any;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

import {
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  Column,
} from "typeorm";

export enum AuditAction {
  READ_PRIVATE_PROFILE = 'READ_PRIVATE_PROFILE',
  UPDATE_SENSITIVE_DATA = 'UPDATE_SENSITIVE_DATA',
  DELETE_USER = 'DELETE_USER',
  // ... other actions
}

@Entity("audit_logs")
export class AuditLog {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @CreateDateColumn()
  timestamp: Date;

  @Column()
  accessorId: string; // The ID of the user/admin performing the action

  @Column()
  targetUserId: string; // The ID of the user whose data is being accessed

  @Column({type: 'enum', enum: AuditAction})
  action: AuditAction; // e.g., 'READ_PRIVATE_PROFILE', 'UPDATE_SENSITIVE_DATA'

  @Column({ type: "json", nullable: true })
  details: Record<string, any>; // e.g., IP address, changed fields
}

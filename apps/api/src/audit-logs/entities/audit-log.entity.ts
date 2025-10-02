import {
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  Column,
} from "typeorm";

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

  @Column()
  action: string; // e.g., 'READ_PRIVATE_PROFILE', 'UPDATE_SENSITIVE_DATA'

  @Column({ type: "json", nullable: true })
  details: Record<string, any>; // e.g., IP address, changed fields
}

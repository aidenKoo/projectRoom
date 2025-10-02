import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { AuditLog } from "./entities/audit-log.entity";

export interface CreateLogPayload {
  accessorId: string;
  targetUserId: string;
  action: string;
  details?: Record<string, any>;
}

@Injectable()
export class AuditLogsService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
  ) {}

  async createLog(payload: CreateLogPayload): Promise<AuditLog> {
    const logEntry = this.auditLogRepository.create(payload);
    return this.auditLogRepository.save(logEntry);
  }
}

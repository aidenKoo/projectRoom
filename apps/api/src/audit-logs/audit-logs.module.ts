import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuditLog } from "./entities/audit-log.entity";
import { AuditLogsService } from "./audit-logs.service";

@Module({
  imports: [TypeOrmModule.forFeature([AuditLog])],
  providers: [AuditLogsService],
  exports: [AuditLogsService], // Export the service to be used in other modules
})
export class AuditLogsModule {}

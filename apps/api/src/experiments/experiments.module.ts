import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AbAssignment } from "./entities/ab-assignment.entity";
import { ExperimentsService } from "./experiments.service";
import { ExperimentsController } from "./experiments.controller";
import { UsersModule } from "../users/users.module";
import { AuditLogsModule } from "../audit-logs/audit-logs.module";

@Module({
  imports: [TypeOrmModule.forFeature([AbAssignment]), UsersModule, AuditLogsModule],
  controllers: [ExperimentsController],
  providers: [ExperimentsService],
  exports: [ExperimentsService],
})
export class ExperimentsModule {}

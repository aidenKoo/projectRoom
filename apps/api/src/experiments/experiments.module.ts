import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AbAssignment } from "./entities/ab-assignment.entity";
import { AbEvent } from "./entities/ab-event.entity";
import { AbExperiment } from "./entities/ab-experiment.entity";
import { AbExperimentSnapshot } from "./entities/ab-experiment-snapshot.entity";
import { AbExperimentConfigHistory } from "./entities/ab-experiment-config-history.entity";
import { ExperimentsService } from "./experiments.service";
import { ExperimentsController } from "./experiments.controller";
import { UsersModule } from "../users/users.module";
import { AuditLogsModule } from "../audit-logs/audit-logs.module";
import { CacheModule } from "../common/cache/cache.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AbAssignment,
      AbEvent,
      AbExperiment,
      AbExperimentSnapshot,
      AbExperimentConfigHistory,
    ]),
    UsersModule,
    AuditLogsModule,
    CacheModule,
  ],
  controllers: [ExperimentsController],
  providers: [ExperimentsService],
  exports: [ExperimentsService],
})
export class ExperimentsModule {}

import {
  Controller,
  Get,
  Query,
  Param,
  ParseIntPipe,
  UseGuards,
} from "@nestjs/common";
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
} from "@nestjs/swagger";
import { AuditAction } from "./entities/audit-log.entity";
import { AuditLogsService } from "./audit-logs.service";
import { FirebaseAuthGuard } from "../common/guards/firebase-auth.guard";
import { PermissionsGuard, RequirePermissions } from "../common/guards/permissions.guard";
import { Permission } from "../common/enums/permissions.enum";

@ApiTags("audit-logs")
@Controller("v1/audit-logs")
@UseGuards(FirebaseAuthGuard, PermissionsGuard)
@ApiBearerAuth("firebase")
export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  @Get()
  @RequirePermissions([Permission.READ_AUDIT_LOGS])
  @ApiOperation({ summary: "Get paginated audit logs with filters" })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiQuery({ name: "action", required: false, enum: AuditAction })
  @ApiQuery({ name: "targetUid", required: false, type: String })
  @ApiQuery({ name: "actorUid", required: false, type: String })
  async findAll(
    @Query("page", new ParseIntPipe({ optional: true })) page = 1,
    @Query("limit", new ParseIntPipe({ optional: true })) limit = 50,
    @Query("action") action?: AuditAction,
    @Query("targetUid") targetUid?: string,
    @Query("actorUid") actorUid?: string,
  ) {
    return this.auditLogsService.findAll(
      page,
      limit,
      action,
      targetUid,
      actorUid,
    );
  }

  @Get("user/:uid")
  @RequirePermissions([Permission.READ_AUDIT_LOGS])
  @ApiOperation({ summary: "Get audit logs for a specific target user" })
  async findByTargetUser(@Param("uid") uid: string) {
    return this.auditLogsService.findByTargetUser(uid);
  }

  @Get("actor/:uid")
  @RequirePermissions([Permission.READ_AUDIT_LOGS])
  @ApiOperation({ summary: "Get audit logs for a specific actor" })
  async findByActor(@Param("uid") uid: string) {
    return this.auditLogsService.findByActor(uid);
  }

  @Get("stats")
  @RequirePermissions([Permission.READ_AUDIT_LOGS])
  @ApiOperation({ summary: "Get audit log statistics by date range" })
  @ApiQuery({ name: "startDate", required: false, type: String })
  @ApiQuery({ name: "endDate", required: false, type: String })
  async getStats(
    @Query("startDate") startDate: string,
    @Query("endDate") endDate: string,
  ) {
    const start = startDate
      ? new Date(startDate)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    return this.auditLogsService.getStatsByDateRange(start, end);
  }
}

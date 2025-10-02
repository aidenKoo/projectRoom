import { Controller, Get, Query } from "@nestjs/common";
import { AuditLogsService } from "./audit-logs.service";

@Controller("audit-logs")
// @UseGuards(FirebaseAuthGuard, AdminGuard)
export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  @Get()
  async findAll(
    @Query("page", new ParseIntPipe({ optional: true })) page = 1,
    @Query("limit", new ParseIntPipe({ optional: true })) limit = 50,
    @Query("action") action?: AuditAction,
    @Query("targetUid") targetUid?: string,
  ) {
    return this.auditLogsService.findAll(page, limit, action, targetUid);
  }

  @Get("user/:uid")
  async findByTargetUser(@Param("uid") uid: string) {
    return this.auditLogsService.findByTargetUser(uid);
  }

  @Get("actor/:uid")
  async findByActor(@Param("uid") uid: string) {
    return this.auditLogsService.findByActor(uid);
  }

  @Get("stats")
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

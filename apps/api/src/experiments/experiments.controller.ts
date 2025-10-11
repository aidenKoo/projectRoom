import { Controller, Get, Query, UseGuards, Post, Body, Delete, Param, Request, Headers, BadRequestException, Put } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { ExperimentsService } from "./experiments.service";
import { FirebaseAuthGuard } from "../common/guards/firebase-auth.guard";
import { AdminGuard } from "../common/guards/admin.guard";
import { ForceAssignDto, ListAssignmentsQueryDto } from "./dto/assign.dto";
import { UpdateExperimentConfigDto } from "./dto/config.dto";
import { SetExperimentOverrideDto } from "./dto/override.dto";
import { UsersService } from "../users/users.service";
import { AuditLogsService } from "../audit-logs/audit-logs.service";
import { AuditAction } from "../audit-logs/entities/audit-log.entity";

@ApiTags("experiments")
@Controller()
export class ExperimentsController {
  constructor(
    private readonly experimentsService: ExperimentsService,
    private readonly usersService: UsersService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  // Client: get own assignment for a given experiment
  @Get("v1/experiments/assignment")
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth("firebase")
  @ApiOperation({ summary: "Get current user's assignment for an experiment" })
  async getMyAssignment(
    @Request() req,
    @Query("experiment") experiment: string,
    @Query("variants") variantsQuery?: string | string[],
    @Query("record") record?: string,
    @Query("platform") platform?: string,
  ) {
    const firebaseUid = req.user.uid;
    const user = await this.usersService.findByFirebaseUid(firebaseUid);
    let variants: string[] = ["A", "B"];
    if (variantsQuery) {
      if (Array.isArray(variantsQuery)) variants = variantsQuery as string[];
      else if (typeof variantsQuery === "string") variants = variantsQuery.split(",").map((v) => v.trim()).filter(Boolean);
    }
    const regionCode = (user as any).region_code ?? (user as any).regionCode ?? null;
    const createdAtRaw = (user as any).created_at ?? (user as any).createdAt ?? null;
    const createdAt = createdAtRaw ? new Date(createdAtRaw) : null;
    const context = {
      regionCode,
      createdAt,
      platform: platform ?? null,
    };
    const a = await this.experimentsService.getOrAssign(user.id, experiment, variants, context);
    if (record === "1" || record === "true") {
      await this.experimentsService.recordEvent(user.id, experiment, a.variant, "exposure");
    }
    return { experiment: a.experiment, variant: a.variant };
  }

  // Admin APIs
  @Get("admin/experiments/assignments")
  @UseGuards(FirebaseAuthGuard, AdminGuard)
  @ApiBearerAuth("firebase")
  @ApiOperation({ summary: "List experiment assignments (admin)" })
  async listAssignments(@Query() query: ListAssignmentsQueryDto) {
    return this.experimentsService.list({
      experiment: query.experiment,
      variant: query.variant,
      page: query.page,
      limit: query.limit,
    });
  }

  @Get("admin/experiments/config/:experiment")
  @UseGuards(FirebaseAuthGuard, AdminGuard)
  @ApiBearerAuth("firebase")
  @ApiOperation({ summary: "Get experiment rollout config" })
  async getConfig(@Param("experiment") experiment: string) {
    const config = await this.experimentsService.getConfigRaw(experiment);
    return { experiment, config }; // config can be null
  }

  @Put("admin/experiments/config/:experiment")
  @UseGuards(FirebaseAuthGuard, AdminGuard)
  @ApiBearerAuth("firebase")
  @ApiOperation({ summary: "Upsert experiment rollout config" })
  async updateConfig(
    @Param("experiment") experiment: string,
    @Body() body: UpdateExperimentConfigDto,
    @Request() req,
    @Headers('x-audit-reason') auditReason?: string,
  ) {
    const accessorId = req.user?.uid;
    if (!accessorId) {
      throw new BadRequestException('인증 정보가 없습니다.');
    }
    const reason = auditReason?.trim();
    if (!reason) {
      throw new BadRequestException('민감한 변경 작업 시 X-Audit-Reason 헤더가 필요합니다.');
    }

    const saved = await this.experimentsService.upsertConfig(experiment, body);
    await this.experimentsService.recordHistory({
      experiment,
      changeType: 'config',
      payload: saved,
      actor: accessorId,
      reason,
    });

    await this.auditLogsService.createLog({
      accessorId,
      targetUserId: accessorId,
      action: AuditAction.UPDATE_SENSITIVE_DATA,
      reason,
      details: {
        type: 'experiment_config_upsert',
        experiment,
      },
    });

    return { experiment, config: saved };
  }

  @Get("admin/experiments/variants")
  @UseGuards(FirebaseAuthGuard, AdminGuard)
  @ApiBearerAuth("firebase")
  @ApiOperation({ summary: "Get variant counts for an experiment (admin)" })
  async getVariantCounts(@Query("experiment") experiment: string) {
    const counts = await this.experimentsService.variantCounts(experiment);
    return { experiment, counts };
  }

  @Get("admin/experiments/overrides")
  @UseGuards(FirebaseAuthGuard, AdminGuard)
  @ApiBearerAuth("firebase")
  @ApiOperation({ summary: "List active experiment overrides" })
  async listOverrides() {
    return this.experimentsService.listOverrides();
  }

  @Get("admin/experiments/config/history")
  @UseGuards(FirebaseAuthGuard, AdminGuard)
  @ApiBearerAuth("firebase")
  @ApiOperation({ summary: "Get experiment config history" })
  async getConfigHistory(
    @Query("experiment") experiment?: string,
    @Query("limit") limitParam?: string,
  ) {
    const limit = limitParam ? Number(limitParam) : undefined;
    const history = await this.experimentsService.getConfigHistory(experiment, limit);
    return { history };
  }

  @Get("admin/experiments/overrides/:experiment")
  @UseGuards(FirebaseAuthGuard, AdminGuard)
  @ApiBearerAuth("firebase")
  @ApiOperation({ summary: "Get override for a specific experiment" })
  async getOverride(@Param("experiment") experiment: string) {
    const override = await this.experimentsService.getOverride(experiment);
    return { experiment, override };
  }

  @Post("admin/experiments/overrides")
  @UseGuards(FirebaseAuthGuard, AdminGuard)
  @ApiBearerAuth("firebase")
  @ApiOperation({ summary: "Set experiment override" })
  async setOverride(
    @Body() body: SetExperimentOverrideDto,
    @Request() req,
    @Headers('x-audit-reason') auditReason?: string,
  ) {
    const accessorId = req.user?.uid;
    if (!accessorId) {
      throw new BadRequestException('인증 정보가 없습니다.');
    }
    const reason = auditReason?.trim();
    if (!reason) {
      throw new BadRequestException('민감한 변경 작업 시 X-Audit-Reason 헤더가 필요합니다.');
    }

    const override = await this.experimentsService.setOverride(
      body.experiment,
      body.variant,
      body.ttlSeconds,
    );

    await this.auditLogsService.createLog({
      accessorId,
      targetUserId: accessorId,
      action: AuditAction.UPDATE_SENSITIVE_DATA,
      reason,
      details: {
        type: 'experiment_override_set',
        experiment: override.experiment,
        variant: override.variant,
        ttlSeconds: body.ttlSeconds ?? null,
        expiresAt: override.expiresAt ? override.expiresAt.toISOString() : null,
      },
    });

    await this.experimentsService.recordHistory({
      experiment: override.experiment,
      changeType: 'override_set',
      payload: {
        variant: override.variant,
        ttlSeconds: body.ttlSeconds ?? null,
        expiresAt: override.expiresAt ? override.expiresAt.toISOString() : null,
      },
      actor: accessorId,
      reason,
    });

    return { override };
  }

  @Delete("admin/experiments/overrides/:experiment")
  @UseGuards(FirebaseAuthGuard, AdminGuard)
  @ApiBearerAuth("firebase")
  @ApiOperation({ summary: "Clear experiment override" })
  async clearOverride(
    @Param("experiment") experiment: string,
    @Request() req,
    @Headers('x-audit-reason') auditReason?: string,
  ) {
    const accessorId = req.user?.uid;
    if (!accessorId) {
      throw new BadRequestException('인증 정보가 없습니다.');
    }
    const reason = auditReason?.trim();
    if (!reason) {
      throw new BadRequestException('민감한 변경 작업 시 X-Audit-Reason 헤더가 필요합니다.');
    }

    await this.experimentsService.clearOverride(experiment);

    await this.auditLogsService.createLog({
      accessorId,
      targetUserId: accessorId,
      action: AuditAction.UPDATE_SENSITIVE_DATA,
      reason,
      details: {
        type: 'experiment_override_clear',
        experiment,
      },
    });

    await this.experimentsService.recordHistory({
      experiment,
      changeType: 'override_clear',
      payload: null,
      actor: accessorId,
      reason,
    });

    return { ok: true };
  }

  @Post("admin/experiments/assignments")
  @UseGuards(FirebaseAuthGuard, AdminGuard)
  @ApiBearerAuth("firebase")
  @ApiOperation({ summary: "Force assign a user to a variant (admin)" })
  async forceAssign(
    @Body() body: ForceAssignDto,
    @Request() req,
    @Headers('x-audit-reason') auditReason?: string,
  ) {
    const accessorId = req.user?.uid;
    if (!accessorId) {
      throw new BadRequestException('인증 정보가 없습니다.');
    }
    const reason = auditReason?.trim();
    if (!reason) {
      throw new BadRequestException('민감한 변경 작업 시 X-Audit-Reason 헤더가 필요합니다.');
    }

    const a = await this.experimentsService.forceAssign(
      body.userId,
      body.experiment,
      body.variant,
    );
    await this.auditLogsService.createLog({
      accessorId,
      targetUserId: String(body.userId),
      action: AuditAction.UPDATE_SENSITIVE_DATA,
      reason,
      details: { type: 'experiment_force_assign', experiment: body.experiment, variant: body.variant },
    });
    return a;
  }

  @Delete("admin/experiments/assignments/:id")
  @UseGuards(FirebaseAuthGuard, AdminGuard)
  @ApiBearerAuth("firebase")
  @ApiOperation({ summary: "Delete an assignment (admin)" })
  async remove(
    @Param("id") id: string,
    @Request() req,
    @Headers('x-audit-reason') auditReason?: string,
  ) {
    const accessorId = req.user?.uid;
    if (!accessorId) {
      throw new BadRequestException('인증 정보가 없습니다.');
    }
    const reason = auditReason?.trim();
    if (!reason) {
      throw new BadRequestException('민감한 변경 작업 시 X-Audit-Reason 헤더가 필요합니다.');
    }

    const assignment = await this.experimentsService.findById(Number(id));
    await this.experimentsService.remove(Number(id));
    if (assignment) {
      await this.auditLogsService.createLog({
        accessorId,
        targetUserId: String(assignment.userId),
        action: AuditAction.UPDATE_SENSITIVE_DATA,
        reason,
        details: { type: 'experiment_delete_assignment', experiment: assignment.experiment, variant: assignment.variant, assignmentId: assignment.id },
      });
    }
    return { ok: true };
  }

  // Client: record experiment event (exposure/conversion)
  @Post("v1/experiments/events")
  @UseGuards(FirebaseAuthGuard)
  @ApiBearerAuth("firebase")
  @ApiOperation({ summary: "Record experiment exposure/conversion event" })
  async recordEvent(
    @Request() req,
    @Body() body: { experiment: string; event: "exposure" | "conversion"; variant?: string; properties?: Record<string, any> },
  ) {
    const firebaseUid = req.user.uid;
    const user = await this.usersService.findByFirebaseUid(firebaseUid);
    const saved = await this.experimentsService.recordEvent(
      user.id,
      body.experiment,
      body.variant,
      body.event,
      body.properties,
    );
    return { ok: true, id: saved.id };
  }

  // Admin: stats summary by experiment
  @Get("admin/experiments/stats")
  @UseGuards(FirebaseAuthGuard, AdminGuard)
  @ApiBearerAuth("firebase")
  @ApiOperation({ summary: "Get experiment stats (exposures, conversions, rates)" })
  async getStats(
    @Query("experiment") experiment: string,
    @Query("dateFrom") dateFromParam?: string,
    @Query("dateTo") dateToParam?: string,
  ) {
    const dateFrom = dateFromParam ? new Date(dateFromParam) : undefined;
    const dateTo = dateToParam ? new Date(dateToParam) : undefined;
    return this.experimentsService.getStats(experiment, dateFrom, dateTo);
  }

  @Get("admin/experiments/snapshots")
  @UseGuards(FirebaseAuthGuard, AdminGuard)
  @ApiBearerAuth("firebase")
  @ApiOperation({ summary: "List experiment snapshots" })
  async getSnapshots(
    @Query("experiment") experiment?: string,
    @Query("limit") limitParam?: string,
  ) {
    const limit = limitParam ? Number(limitParam) : undefined;
    const snapshots = await this.experimentsService.getSnapshots(experiment, limit);
    return { snapshots };
  }

  @Post("admin/experiments/snapshots/capture")
  @UseGuards(FirebaseAuthGuard, AdminGuard)
  @ApiBearerAuth("firebase")
  @ApiOperation({ summary: "Capture experiment snapshot for a date" })
  async captureSnapshot(
    @Request() req,
    @Body() body: { date?: string },
    @Headers('x-audit-reason') auditReason?: string,
  ) {
    const accessorId = req.user?.uid;
    if (!accessorId) {
      throw new BadRequestException('인증 정보가 없습니다.');
    }
    const reason = auditReason?.trim();
    if (!reason) {
      throw new BadRequestException('민감한 변경 작업 시 X-Audit-Reason 헤더가 필요합니다.');
    }

    const date = body?.date ? new Date(body.date) : new Date();
    await this.experimentsService.captureSnapshot(date);

    await this.auditLogsService.createLog({
      accessorId,
      targetUserId: accessorId,
      action: AuditAction.UPDATE_SENSITIVE_DATA,
      reason,
      details: {
        type: 'experiment_snapshot_capture',
        date: date.toISOString().split('T')[0],
      },
    });

    return { ok: true };
  }
}

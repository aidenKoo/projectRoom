import { Controller, Get, Query, UseGuards, Post, Body, Delete, Param, Request, Headers, BadRequestException } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { ExperimentsService } from "./experiments.service";
import { FirebaseAuthGuard } from "../common/guards/firebase-auth.guard";
import { AdminGuard } from "../common/guards/admin.guard";
import { ForceAssignDto, ListAssignmentsQueryDto } from "./dto/assign.dto";
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
  ) {
    const firebaseUid = req.user.uid;
    const user = await this.usersService.findByFirebaseUid(firebaseUid);
    let variants: string[] = ["A", "B"];
    if (variantsQuery) {
      if (Array.isArray(variantsQuery)) variants = variantsQuery as string[];
      else if (typeof variantsQuery === "string") variants = variantsQuery.split(",").map((v) => v.trim()).filter(Boolean);
    }
    const a = await this.experimentsService.getOrAssign(user.id, experiment, variants);
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

  @Get("admin/experiments/variants")
  @UseGuards(FirebaseAuthGuard, AdminGuard)
  @ApiBearerAuth("firebase")
  @ApiOperation({ summary: "Get variant counts for an experiment (admin)" })
  async getVariantCounts(@Query("experiment") experiment: string) {
    const counts = await this.experimentsService.variantCounts(experiment);
    return { experiment, counts };
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
}

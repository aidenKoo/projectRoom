import { Controller, Get, Query, UseGuards, Post, Body, Delete, Param, Request } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { ExperimentsService } from "./experiments.service";
import { FirebaseAuthGuard } from "../common/guards/firebase-auth.guard";
import { AdminGuard } from "../common/guards/admin.guard";
import { ForceAssignDto, ListAssignmentsQueryDto } from "./dto/assign.dto";
import { UsersService } from "../users/users.service";

@ApiTags("experiments")
@Controller()
export class ExperimentsController {
  constructor(
    private readonly experimentsService: ExperimentsService,
    private readonly usersService: UsersService,
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
  async forceAssign(@Body() body: ForceAssignDto) {
    const a = await this.experimentsService.forceAssign(
      body.userId,
      body.experiment,
      body.variant,
    );
    return a;
  }

  @Delete("admin/experiments/assignments/:id")
  @UseGuards(FirebaseAuthGuard, AdminGuard)
  @ApiBearerAuth("firebase")
  @ApiOperation({ summary: "Delete an assignment (admin)" })
  async remove(@Param("id") id: string) {
    await this.experimentsService.remove(Number(id));
    return { ok: true };
  }
}

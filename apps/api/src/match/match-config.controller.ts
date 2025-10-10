import { Controller, Get, Param, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { FirebaseAuthGuard } from "../common/guards/firebase-auth.guard";
import { AdminGuard } from "../common/guards/admin.guard";
import {
  getScoringConfig,
  DEFAULT_SCORING_CONFIG,
  EXPERIMENTAL_CONFIGS,
} from "./config/scoring-config";

@ApiTags("match-config")
@Controller("admin/match/config")
@UseGuards(FirebaseAuthGuard, AdminGuard)
@ApiBearerAuth("firebase")
export class MatchConfigController {
  @Get()
  @ApiOperation({ summary: "Get default scoring configuration" })
  getDefaultConfig() {
    return {
      config: DEFAULT_SCORING_CONFIG,
      experiments: Object.keys(EXPERIMENTAL_CONFIGS),
    };
  }

  @Get("experiments")
  @ApiOperation({ summary: "List all experimental configurations" })
  listExperiments() {
    return {
      available: Object.keys(EXPERIMENTAL_CONFIGS),
      configs: EXPERIMENTAL_CONFIGS,
    };
  }

  @Get("experiments/:key")
  @ApiOperation({ summary: "Get specific experimental configuration" })
  getExperimentConfig(@Param("key") key: string) {
    const config = getScoringConfig(key);
    return {
      experimentKey: key,
      config,
      isDefault: !EXPERIMENTAL_CONFIGS[key],
    };
  }
}

import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
} from "@nestjs/swagger";
import { FirebaseAuthGuard } from "../common/guards/firebase-auth.guard";
import { PermissionsGuard, RequirePermissions } from "../common/guards/permissions.guard";
import { Permission } from "../common/enums/permissions.enum";
import { MatchScorerService } from "./match-scorer.service";
import {
  validateScoringConfig,
  calculateScoreStatistics,
  detectScoreAnomalies,
} from "./utils/score-validator";
import { getScoringConfig, EXPERIMENTAL_CONFIGS } from "./config/scoring-config";

@ApiTags("match-benchmark")
@Controller("v1/match/benchmark")
@UseGuards(FirebaseAuthGuard, PermissionsGuard)
@ApiBearerAuth("firebase")
export class MatchBenchmarkController {
  constructor(private readonly scorerService: MatchScorerService) {}

  @Get("config/validate")
  @RequirePermissions([Permission.READ_ANALYTICS])
  @ApiOperation({ summary: "Validate scoring configuration" })
  @ApiQuery({ name: "experimentKey", required: false, type: String })
  async validateConfig(@Query("experimentKey") experimentKey?: string) {
    const config = getScoringConfig(experimentKey);
    const validation = validateScoringConfig(config);

    return {
      experimentKey: experimentKey || "default",
      config,
      validation,
    };
  }

  @Get("config/list")
  @RequirePermissions([Permission.READ_ANALYTICS])
  @ApiOperation({ summary: "List all available scoring configurations" })
  async listConfigs() {
    const configs: Record<string, any> = {
      default: getScoringConfig(),
    };

    for (const key of Object.keys(EXPERIMENTAL_CONFIGS)) {
      configs[key] = getScoringConfig(key);
    }

    return {
      count: Object.keys(configs).length,
      configs,
    };
  }

  @Get("statistics")
  @RequirePermissions([Permission.READ_ANALYTICS])
  @ApiOperation({
    summary: "Get scoring statistics for a user's recommendation queue",
  })
  @ApiQuery({ name: "userId", required: true, type: String })
  @ApiQuery({ name: "sampleSize", required: false, type: Number })
  async getStatistics(
    @Query("userId") userId: string,
    @Query("sampleSize") sampleSize: number = 100,
  ) {
    // Get user's candidates
    const candidates = await this.scorerService.getCandidates(
      userId,
      sampleSize,
    );

    // Calculate scores
    const scores: number[] = [];
    const scoreDetails: any[] = [];

    for (const candidate of candidates) {
      const result = await this.scorerService.calculateScore(
        userId,
        candidate.user.firebase_uid,
      );
      scores.push(result.totalScore);
      scoreDetails.push({
        targetUserId: candidate.user.firebase_uid,
        score: result.totalScore,
        breakdown: result.breakdown,
        sharedBits: result.sharedBits,
      });
    }

    const statistics = calculateScoreStatistics(scores);
    const anomalies = detectScoreAnomalies(scores);

    return {
      userId,
      sampleSize: candidates.length,
      statistics,
      anomalies,
      topMatches: scoreDetails
        .sort((a, b) => b.score - a.score)
        .slice(0, 10),
      bottomMatches: scoreDetails
        .sort((a, b) => a.score - b.score)
        .slice(0, 10),
    };
  }

  @Get("compare")
  @RequirePermissions([Permission.READ_ANALYTICS])
  @ApiOperation({
    summary: "Compare scoring configurations for same user",
  })
  @ApiQuery({ name: "userId", required: true, type: String })
  @ApiQuery({ name: "targetUserId", required: true, type: String })
  @ApiQuery({
    name: "configs",
    required: false,
    type: String,
    description: "Comma-separated config keys",
  })
  async compareConfigs(
    @Query("userId") userId: string,
    @Query("targetUserId") targetUserId: string,
    @Query("configs") configs?: string,
  ) {
    const configKeys = configs
      ? configs.split(",")
      : ["default", ...Object.keys(EXPERIMENTAL_CONFIGS)];

    const results: Record<string, any> = {};

    for (const key of configKeys) {
      const result = await this.scorerService.calculateScore(
        userId,
        targetUserId,
        key === "default" ? undefined : key,
      );

      results[key] = {
        totalScore: result.totalScore,
        breakdown: result.breakdown,
        sharedBits: result.sharedBits,
        reason: result.reason,
      };
    }

    // Calculate variance
    const scores = Object.values(results).map((r: any) => r.totalScore);
    const mean = scores.reduce((sum, s) => sum + s, 0) / scores.length;
    const variance =
      scores.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) /
      scores.length;

    return {
      userId,
      targetUserId,
      results,
      analysis: {
        mean,
        variance,
        stdDev: Math.sqrt(variance),
        maxDiff: Math.max(...scores) - Math.min(...scores),
        recommendation:
          variance < 0.01
            ? "Configs produce very similar scores"
            : variance > 0.05
              ? "Configs produce significantly different scores"
              : "Configs produce moderately different scores",
      },
    };
  }

  @Get("performance")
  @RequirePermissions([Permission.READ_ANALYTICS])
  @ApiOperation({ summary: "Measure scoring performance" })
  @ApiQuery({ name: "userId", required: true, type: String })
  @ApiQuery({ name: "iterations", required: false, type: Number })
  async measurePerformance(
    @Query("userId") userId: string,
    @Query("iterations") iterations: number = 50,
  ) {
    const candidates = await this.scorerService.getCandidates(
      userId,
      Math.min(iterations, 100),
    );

    if (candidates.length === 0) {
      return {
        error: "No candidates available for benchmarking",
      };
    }

    const timings: number[] = [];

    for (const candidate of candidates) {
      const start = performance.now();
      await this.scorerService.calculateScore(
        userId,
        candidate.user.firebase_uid,
      );
      const end = performance.now();
      timings.push(end - start);
    }

    const sorted = [...timings].sort((a, b) => a - b);
    const sum = timings.reduce((s, t) => s + t, 0);

    return {
      userId,
      iterations: timings.length,
      timing: {
        mean: sum / timings.length,
        median: sorted[Math.floor(sorted.length / 2)],
        min: sorted[0],
        max: sorted[sorted.length - 1],
        p95: sorted[Math.floor(sorted.length * 0.95)],
        p99: sorted[Math.floor(sorted.length * 0.99)],
      },
      throughput: {
        scoresPerSecond: 1000 / (sum / timings.length),
        estimatedTimeFor1000: ((sum / timings.length) * 1000) / 1000,
      },
      recommendation:
        sum / timings.length < 50
          ? "Performance is excellent (< 50ms per score)"
          : sum / timings.length < 100
            ? "Performance is good (< 100ms per score)"
            : "Performance may need optimization (> 100ms per score)",
    };
  }
}

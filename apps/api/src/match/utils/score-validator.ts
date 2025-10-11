/**
 * Score Validation Utilities
 * Ensures score calculations are within valid ranges and meet business rules
 */

import { ScoringConfig } from "../config/scoring-config";

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface ScoreBreakdown {
  similarity: number;
  weight: number;
  score: number;
}

/**
 * Validate scoring configuration
 */
export function validateScoringConfig(
  config: ScoringConfig,
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Range checks
  if (config.maxTotalScore <= config.minTotalScore) {
    errors.push(
      "maxTotalScore must be greater than minTotalScore",
    );
  }

  if (config.ageBoundarySimilarity < 0 || config.ageBoundarySimilarity > 1) {
    errors.push("ageBoundarySimilarity must be between 0 and 1");
  }

  if (config.heightBoundarySimilarity < 0 || config.heightBoundarySimilarity > 1) {
    errors.push("heightBoundarySimilarity must be between 0 and 1");
  }

  if (config.mbtiBaseScore < 0 || config.mbtiBaseScore > config.mbtiMaxScore) {
    errors.push("mbtiBaseScore must be between 0 and mbtiMaxScore");
  }

  if (config.regionNonMatchScore < 0 || config.regionNonMatchScore > 1) {
    errors.push("regionNonMatchScore must be between 0 and 1");
  }

  // Boost validation
  if (config.lookConfidenceBoost < 1) {
    errors.push("lookConfidenceBoost must be >= 1 (no negative boost)");
  }

  if (config.bodyConfidenceBoost < 1) {
    errors.push("bodyConfidenceBoost must be >= 1 (no negative boost)");
  }

  if (config.recencyBoostMultiplier < 1) {
    errors.push("recencyBoostMultiplier must be >= 1");
  }

  if (config.activeUserBoostMultiplier < 1) {
    errors.push("activeUserBoostMultiplier must be >= 1");
  }

  // Penalty validation
  if (config.penaltyPerMissingField < 0 || config.penaltyPerMissingField > 1) {
    errors.push("penaltyPerMissingField must be between 0 and 1");
  }

  if (config.penaltyPerMissingField > 0.99) {
    warnings.push("penaltyPerMissingField is very close to 1 (minimal penalty)");
  }

  // Threshold checks
  if (config.lookConfidenceThreshold < 1 || config.lookConfidenceThreshold > 5) {
    warnings.push("lookConfidenceThreshold typically ranges from 1-5");
  }

  if (config.bodyConfidenceThreshold < 1 || config.bodyConfidenceThreshold > 5) {
    warnings.push("bodyConfidenceThreshold typically ranges from 1-5");
  }

  // Boost warnings
  if (config.lookConfidenceBoost > 1.3) {
    warnings.push(
      "lookConfidenceBoost > 1.3 may over-prioritize appearance",
    );
  }

  if (config.recencyBoostMultiplier > 1.5) {
    warnings.push(
      "recencyBoostMultiplier > 1.5 may over-prioritize new users",
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate calculated score result
 */
export function validateScoreResult(
  totalScore: number,
  breakdown: Record<string, any>,
  config: ScoringConfig,
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Score range check
  if (totalScore < config.minTotalScore || totalScore > config.maxTotalScore) {
    errors.push(
      `Total score ${totalScore} is outside valid range [${config.minTotalScore}, ${config.maxTotalScore}]`,
    );
  }

  // Check for NaN or Infinity
  if (!isFinite(totalScore)) {
    errors.push("Total score is NaN or Infinity");
  }

  // Validate breakdown components
  for (const [key, value] of Object.entries(breakdown)) {
    if (typeof value === "object" && value !== null) {
      if ("similarity" in value && !isFinite(value.similarity)) {
        errors.push(`Breakdown ${key}: similarity is not finite`);
      }
      if ("weight" in value && !isFinite(value.weight)) {
        errors.push(`Breakdown ${key}: weight is not finite`);
      }
      if ("score" in value && !isFinite(value.score)) {
        errors.push(`Breakdown ${key}: score is not finite`);
      }

      // Check ranges
      if ("similarity" in value && (value.similarity < 0 || value.similarity > 1)) {
        warnings.push(`Breakdown ${key}: similarity ${value.similarity} outside [0,1]`);
      }
    }
  }

  // Warning for very low scores
  if (totalScore < 0.1) {
    warnings.push("Total score is very low (< 0.1) - poor match quality");
  }

  // Warning for perfect scores (suspicious)
  if (totalScore === 1.0 && Object.keys(breakdown).length > 5) {
    warnings.push("Perfect score with many factors - verify calculation");
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Calculate expected score bounds given preferences
 */
export function calculateScoreBounds(
  weights: number[],
  config: ScoringConfig,
): { min: number; max: number } {
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);

  // Minimum: no matches, max penalties
  let minScore = 0 * totalWeight;

  // Apply worst case penalties
  const maxPenaltyFields = 4;
  const penaltyMultiplier = Math.pow(
    config.penaltyPerMissingField,
    maxPenaltyFields,
  );
  minScore *= penaltyMultiplier;

  // Maximum: perfect matches, all boosts
  let maxScore = 1.0 * totalWeight;

  // Apply best case boosts
  maxScore *= config.lookConfidenceBoost;
  maxScore *= config.bodyConfidenceBoost;
  if (config.enableRecencyBoost) {
    maxScore *= config.recencyBoostMultiplier;
  }
  if (config.enableActivityBoost) {
    maxScore *= config.activeUserBoostMultiplier;
  }

  // Normalize
  maxScore = Math.min(maxScore, config.maxTotalScore);

  return { min: minScore, max: maxScore };
}

/**
 * Detect anomalies in score distribution
 */
export function detectScoreAnomalies(
  scores: number[],
): { hasAnomalies: boolean; issues: string[] } {
  const issues: string[] = [];

  if (scores.length === 0) {
    return { hasAnomalies: false, issues };
  }

  // Check for constant scores (suspicious)
  const uniqueScores = new Set(scores);
  if (uniqueScores.size === 1) {
    issues.push("All scores are identical - check scoring logic");
  }

  // Calculate statistics
  const mean = scores.reduce((sum, s) => sum + s, 0) / scores.length;
  const variance =
    scores.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / scores.length;
  const stdDev = Math.sqrt(variance);

  // Check for very low variance (not enough differentiation)
  if (stdDev < 0.05) {
    issues.push(
      `Very low score variance (${stdDev.toFixed(3)}) - scores not well differentiated`,
    );
  }

  // Check for bimodal distribution (potential bug)
  const sorted = [...scores].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  const quartile1 = sorted[Math.floor(sorted.length * 0.25)];
  const quartile3 = sorted[Math.floor(sorted.length * 0.75)];

  if (Math.abs(median - mean) > stdDev) {
    issues.push("Skewed distribution detected - check for outliers");
  }

  // Check for clustering at boundaries
  const atMin = scores.filter((s) => s < 0.1).length;
  const atMax = scores.filter((s) => s > 0.9).length;

  if (atMin / scores.length > 0.3) {
    issues.push("30%+ scores are very low (< 0.1) - matching criteria may be too strict");
  }

  if (atMax / scores.length > 0.3) {
    issues.push("30%+ scores are very high (> 0.9) - matching criteria may be too lenient");
  }

  return {
    hasAnomalies: issues.length > 0,
    issues,
  };
}

/**
 * Generate score statistics
 */
export function calculateScoreStatistics(scores: number[]): {
  count: number;
  mean: number;
  median: number;
  stdDev: number;
  min: number;
  max: number;
  p25: number;
  p75: number;
  p95: number;
} {
  if (scores.length === 0) {
    return {
      count: 0,
      mean: 0,
      median: 0,
      stdDev: 0,
      min: 0,
      max: 0,
      p25: 0,
      p75: 0,
      p95: 0,
    };
  }

  const sorted = [...scores].sort((a, b) => a - b);
  const mean = scores.reduce((sum, s) => sum + s, 0) / scores.length;
  const variance =
    scores.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / scores.length;

  return {
    count: scores.length,
    mean,
    median: sorted[Math.floor(sorted.length * 0.5)],
    stdDev: Math.sqrt(variance),
    min: sorted[0],
    max: sorted[sorted.length - 1],
    p25: sorted[Math.floor(sorted.length * 0.25)],
    p75: sorted[Math.floor(sorted.length * 0.75)],
    p95: sorted[Math.floor(sorted.length * 0.95)],
  };
}

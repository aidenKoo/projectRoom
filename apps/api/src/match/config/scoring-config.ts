/**
 * Matching Score Configuration
 * Centralized configuration for all scoring parameters
 * Allows easy A/B testing and tuning
 */

export interface ScoringConfig {
  // Weight normalization
  maxTotalScore: number;
  minTotalScore: number;

  // Similarity thresholds
  ageBoundaryTolerance: number; // 나이 경계값 유사도
  ageBoundarySimilarity: number;
  heightTolerance: number; // 키 허용 범위 (cm)
  heightBoundarySimilarity: number;

  // MBTI scoring
  mbtiBaseScore: number; // 기본 점수
  mbtiMaxScore: number; // 최대 점수

  // Region fallback
  regionNonMatchScore: number; // 지역 불일치 시 기본 점수

  // Confidence boosts
  lookConfidenceThreshold: number;
  lookConfidenceBoost: number;
  bodyConfidenceThreshold: number;
  bodyConfidenceBoost: number;

  // Information completeness
  penaltyPerMissingField: number; // 정보 누락 패널티 (0.95 = 5% 감점)

  // Time-based decay
  enableRecencyBoost: boolean;
  recencyBoostDays: number; // 최근 가입자 부스트 기간
  recencyBoostMultiplier: number;

  // Activity boost
  enableActivityBoost: boolean;
  activeUserBoostMultiplier: number; // 활성 사용자 부스트

  // Distance penalty (향후 GPS 연동 시)
  enableDistancePenalty: boolean;
  maxDistanceKm: number;
  distancePenaltyRate: number; // km당 감점율
}

export const DEFAULT_SCORING_CONFIG: ScoringConfig = {
  maxTotalScore: 1.0,
  minTotalScore: 0.0,

  ageBoundaryTolerance: 1,
  ageBoundarySimilarity: 0.8,
  heightTolerance: 5,
  heightBoundarySimilarity: 0.8,

  mbtiBaseScore: 0.2,
  mbtiMaxScore: 1.0,

  regionNonMatchScore: 0.3,

  lookConfidenceThreshold: 4,
  lookConfidenceBoost: 1.05,
  bodyConfidenceThreshold: 4,
  bodyConfidenceBoost: 1.05,

  penaltyPerMissingField: 0.95,

  enableRecencyBoost: false,
  recencyBoostDays: 7,
  recencyBoostMultiplier: 1.1,

  enableActivityBoost: false,
  activeUserBoostMultiplier: 1.08,

  enableDistancePenalty: false,
  maxDistanceKm: 50,
  distancePenaltyRate: 0.01,
};

/**
 * Experimental configurations for A/B testing
 */
export const EXPERIMENTAL_CONFIGS: Record<string, Partial<ScoringConfig>> = {
  // 외모 중시 실험
  appearanceFocus: {
    lookConfidenceBoost: 1.15,
    bodyConfidenceBoost: 1.15,
    penaltyPerMissingField: 0.98,
  },

  // 호환성 중시 실험
  compatibilityFocus: {
    mbtiMaxScore: 1.2,
    lookConfidenceBoost: 1.02,
    bodyConfidenceBoost: 1.02,
  },

  // 최근 가입자 우선 실험
  recencyBoost: {
    enableRecencyBoost: true,
    recencyBoostMultiplier: 1.2,
  },

  // 활성 사용자 우선 실험
  activityBoost: {
    enableActivityBoost: true,
    activeUserBoostMultiplier: 1.15,
  },

  // 엄격한 정보 완성도 요구
  strictCompleteness: {
    penaltyPerMissingField: 0.90,
  },

  // 관대한 매칭
  relaxedMatching: {
    ageBoundarySimilarity: 0.9,
    heightBoundarySimilarity: 0.9,
    regionNonMatchScore: 0.5,
    penaltyPerMissingField: 0.98,
  },
};

/**
 * Get scoring configuration with optional experiment override
 */
export function getScoringConfig(
  experimentKey?: string,
): ScoringConfig {
  const baseConfig = { ...DEFAULT_SCORING_CONFIG };

  if (experimentKey && EXPERIMENTAL_CONFIGS[experimentKey]) {
    return {
      ...baseConfig,
      ...EXPERIMENTAL_CONFIGS[experimentKey],
    };
  }

  return baseConfig;
}

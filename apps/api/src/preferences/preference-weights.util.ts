/**
 * 선호도 Top N 랭킹에 따른 가중치 자동 계산
 * 작업서 기준: 선택 수가 적을수록 각 항목 가중치 증가
 */
export function calculateWeights(itemCount: number): number[] {
  const weightMap: Record<number, number[]> = {
    1: [1.0],
    2: [0.6, 0.4],
    3: [0.45, 0.35, 0.2],
    4: [0.35, 0.3, 0.2, 0.15],
    5: [0.3, 0.25, 0.2, 0.15, 0.1],
  };

  if (itemCount < 1 || itemCount > 5) {
    throw new Error("선호도는 1~5개까지 선택 가능합니다.");
  }

  return weightMap[itemCount];
}

/**
 * 선호도 items 검증 (rank는 1부터 시작, 중복 금지)
 */
export function validatePreferenceItems(
  items: Array<{ rank: number; type: string; value: any }>,
): { valid: boolean; error?: string } {
  if (!items || items.length === 0) {
    return { valid: false, error: "선호도는 최소 1개 이상 선택해야 합니다." };
  }

  if (items.length > 5) {
    return { valid: false, error: "선호도는 최대 5개까지 선택 가능합니다." };
  }

  // rank 중복 체크
  const ranks = items.map((item) => item.rank);
  const uniqueRanks = new Set(ranks);
  if (ranks.length !== uniqueRanks.size) {
    return {
      valid: false,
      error: "동일한 우선순위(rank)는 사용할 수 없습니다.",
    };
  }

  // rank 범위 체크 (1~5)
  for (const item of items) {
    if (item.rank < 1 || item.rank > 5) {
      return { valid: false, error: "rank는 1~5 사이여야 합니다." };
    }
  }

  // rank 연속성 체크 (1부터 시작하고 순차적이어야 함)
  const sortedRanks = ranks.sort((a, b) => a - b);
  for (let i = 0; i < sortedRanks.length; i++) {
    if (sortedRanks[i] !== i + 1) {
      return {
        valid: false,
        error: "rank는 1부터 순차적으로 지정해야 합니다.",
      };
    }
  }

  return { valid: true };
}

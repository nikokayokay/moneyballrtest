export interface DifficultyContext {
  opponentStrength?: number;
  parkFactor?: number;
  leverage?: number;
}

export function contextualDifficultyMultiplier(context: DifficultyContext) {
  const opponent = context.opponentStrength ?? 1;
  const park = context.parkFactor ?? 1;
  const leverage = context.leverage ?? 1;
  return Number(((opponent * 0.46) + (park * 0.24) + (leverage * 0.3)).toFixed(3));
}

export function adjustImpactScore(score: number, context: DifficultyContext) {
  return Math.round(Math.max(0, Math.min(100, score * contextualDifficultyMultiplier(context))));
}

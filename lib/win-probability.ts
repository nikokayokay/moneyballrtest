export interface WinProbabilityInput {
  homeScore: number | null;
  awayScore: number | null;
  inning?: string | null;
  outs?: number | null;
}

function inningNumber(inning?: string | null) {
  const parsed = Number(String(inning || "1").replace(/\D/g, ""));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

export function estimateWinProbability(input: WinProbabilityInput) {
  const homeScore = input.homeScore ?? 0;
  const awayScore = input.awayScore ?? 0;
  const scoreDiff = homeScore - awayScore;
  const inning = inningNumber(input.inning);
  const gameProgress = Math.min(1, Math.max(0.1, (inning + (input.outs || 0) / 3) / 9));
  const pressure = scoreDiff * (1.15 + gameProgress * 1.35);
  const homeProbability = Math.round(Math.max(3, Math.min(97, 50 + Math.tanh(pressure / 5) * 47)));
  return {
    homeProbability,
    awayProbability: 100 - homeProbability,
    leverageHint: Math.abs(scoreDiff) <= 1 && inning >= 7 ? "high leverage" : Math.abs(scoreDiff) >= 5 ? "low leverage" : "normal leverage",
  };
}

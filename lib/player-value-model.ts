import { adjustImpactScore, type DifficultyContext } from "./contextual-difficulty";

export function playerValueScore(input: {
  offense?: number;
  defense?: number;
  baserunning?: number;
  pitching?: number;
  context?: DifficultyContext;
}) {
  const raw = (input.offense || 0) * 0.42
    + (input.pitching || 0) * 0.42
    + (input.defense || 45) * 0.1
    + (input.baserunning || 45) * 0.06;
  return input.context ? adjustImpactScore(raw, input.context) : Math.round(Math.max(0, Math.min(100, raw)));
}

export function valueTier(score: number) {
  if (score >= 85) return "MVP-level value";
  if (score >= 72) return "All-Star value";
  if (score >= 58) return "Regular value";
  return "Depth value";
}

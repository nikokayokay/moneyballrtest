import { estimateBasePressure, scoreDifferential, type GameContext } from "./game-context";

export function calculateLeverageIndex(context: GameContext) {
  const inning = context.inning ?? 1;
  const outs = context.outs ?? 0;
  const diff = Math.abs(scoreDifferential(context));
  const basePressure = estimateBasePressure(context);
  const late = inning >= 7 ? 1.35 : inning >= 5 ? 1.12 : 0.92;
  const close = diff <= 1 ? 1.45 : diff <= 3 ? 1.1 : diff <= 5 ? 0.82 : 0.52;
  const outsPressure = 1 + outs * 0.08;
  return Number(Math.max(0.2, late * close * outsPressure * (1 + basePressure * 0.18)).toFixed(2));
}

export function clutchLabel(leverageIndex: number) {
  if (leverageIndex >= 1.8) return "Elite clutch spot";
  if (leverageIndex >= 1.25) return "High leverage";
  if (leverageIndex <= 0.7) return "Low leverage";
  return "Standard leverage";
}

export function boostImpactByLeverage(score: number, context: GameContext) {
  const li = calculateLeverageIndex(context);
  const boost = li >= 1 ? 1 + Math.min(0.35, (li - 1) * 0.18) : Math.max(0.72, li);
  return Math.round(Math.max(0, Math.min(100, score * boost)));
}

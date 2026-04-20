import type { Pitch, PlayerProfile } from "@/src/lib/mlb";
import type { PropEvaluation, PropEvaluationInput } from "@/src/types/analytics";

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function readMetric(profile: PlayerProfile, label: string) {
  const found = [...profile.standardStats, ...profile.advancedStats].find(([metric]) => metric === label)?.[1];
  if (!found || found === "Unavailable") return null;
  const parsed = Number(String(found).replace(/[^0-9.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function average(values: number[]) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
}

function recentDamageRate(pitches: Pitch[]) {
  const damage = pitches.filter((pitch) => pitch.result === "hit" || pitch.result === "home_run" || pitch.result === "in_play");
  if (!damage.length) return null;
  return average(damage.map((pitch) => pitch.xba ?? 0.25));
}

export function evaluateProp({ player, pitches, propLine, opponent, context }: PropEvaluationInput): PropEvaluation {
  const xwoba = readMetric(player, "xwOBA");
  const barrelPct = readMetric(player, "Barrel%");
  const hardHitPct = readMetric(player, "HardHit%");
  const recentOps = Number(String(player.windows.find(([label]) => label === "Last 15")?.[1] || "").replace(/[^0-9.-]/g, "")) || null;
  const expectedGap = player.expectedActual.find((item) => item.label === "wOBA" || item.label === "BA");
  const recentDamage = recentDamageRate(pitches.slice(-80));
  const parkFactor = context?.parkFactor ?? 1;
  const opponentStress = context?.recentOpponentForm ?? 0;
  const pitchMixPressure = context?.opponentPitchMix?.reduce((sum, pitch) => sum + pitch.usage, 0) || 0;

  const baseline = [
    xwoba !== null ? ((xwoba - 0.29) / 0.12) * 28 : 14,
    barrelPct !== null ? (barrelPct / 18) * 16 : 8,
    hardHitPct !== null ? (hardHitPct / 55) * 16 : 8,
    recentOps !== null ? ((recentOps - 0.64) / 0.42) * 20 : 10,
    recentDamage !== null ? ((recentDamage - 0.18) / 0.2) * 12 : 6,
    expectedGap?.delta !== null && expectedGap?.delta !== undefined ? (expectedGap.delta < 0 ? 10 : -6) : 0,
    (parkFactor - 1) * 10,
    opponentStress * -4,
    pitchMixPressure ? Math.min(6, pitchMixPressure / 25) : 0,
  ].reduce((sum, value) => sum + value, 0);

  const hitProbability = clamp(38 + baseline, 3, 97);
  const edgeVsLine = Number((hitProbability - (propLine * 100)).toFixed(1));
  const confidenceScore = clamp(Math.round((player.confidenceEngine.percent * 0.45) + (player.confidence.score * 0.35) + ((pitches.length > 300 ? 20 : pitches.length / 15))), 8, 99);
  const riskTier: PropEvaluation["riskTier"] =
    confidenceScore >= 82 && edgeVsLine >= 10 ? "A" :
    confidenceScore >= 70 && edgeVsLine >= 5 ? "B" :
    confidenceScore >= 55 ? "C" :
    confidenceScore >= 40 ? "D" : "F";

  return {
    hitProbability: Number(hitProbability.toFixed(1)),
    edgeVsLine,
    confidenceScore,
    riskTier,
    explanation: `${player.identity.fullName} projects against ${opponent} using expected quality of contact, recent form, pitch exposure, and sample confidence.`,
  };
}

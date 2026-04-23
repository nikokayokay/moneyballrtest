import type { TrendSignal } from "./trend-detection";

export interface DecisionInsight {
  whyItMatters: string;
  whatToWatch: string;
  priority: number;
}

export function generateDecisionInsight(input: {
  name: string;
  trend?: TrendSignal;
  archetype?: string;
  percentile?: number;
  context?: string;
}): DecisionInsight {
  const trendLabel = input.trend?.label || "stable signal";
  const percentile = input.percentile ?? 50;
  const why = percentile >= 80
    ? `${input.name} is separating from the field with a ${trendLabel.toLowerCase()}.`
    : percentile <= 30
      ? `${input.name} needs context; the surface signal is lagging the baseline.`
      : `${input.name} is holding a useful ${input.archetype || "balanced"} profile.`;
  const watch = input.trend?.direction === "up"
    ? "Watch whether the recent spike survives the next sample."
    : input.trend?.direction === "down"
      ? "Watch for approach or command stabilization."
      : "Watch matchup quality and role stability.";
  return {
    whyItMatters: why,
    whatToWatch: input.context ? `${watch} ${input.context}` : watch,
    priority: Math.round((percentile + (input.trend?.intensity || 30)) / 2),
  };
}

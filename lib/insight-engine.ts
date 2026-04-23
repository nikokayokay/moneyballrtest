import type { GameStateTag } from "./game-context";

export type SignalKind = "clutch" | "streak" | "anomaly" | "standard";

export interface SignalInsightInput {
  name: string;
  keyStat: string;
  statLine: string;
  score: number;
  signalKind?: SignalKind;
  contextTag?: GameStateTag;
  team?: string;
}

export interface SignalInsight {
  whyItMatters: string;
  whatChanged: string;
  whatToWatch: string;
  priority: number;
}

export function classifySignal(input: Pick<SignalInsightInput, "keyStat" | "statLine" | "score" | "contextTag">): SignalKind {
  const text = `${input.keyStat} ${input.statLine}`.toLowerCase();
  if (input.contextTag === "clutch" || text.includes("walk-off")) return "clutch";
  if (text.includes("hr") || text.includes("sb") || text.includes("3b") || input.score >= 88) return "anomaly";
  if (text.includes("3 h") || text.includes("4 h") || text.includes("9 k") || text.includes("10 k")) return "streak";
  return "standard";
}

export function generateSignalInsight(input: SignalInsightInput): SignalInsight {
  const signalKind = input.signalKind || classifySignal(input);
  const whyByKind: Record<SignalKind, string> = {
    clutch: `${input.name} produced in a leverage pocket, so the box score carries extra game-shaping weight.`,
    anomaly: `${input.name} created an outlier event profile that can move leaderboards faster than volume stats.`,
    streak: `${input.name} is showing repeatable momentum, not just a single-event spike.`,
    standard: `${input.name} added useful production without forcing a noisy read.`,
  };
  const watchByKind: Record<SignalKind, string> = {
    clutch: "Watch whether the late-game role keeps creating high-leverage chances.",
    anomaly: "Watch if the damage profile repeats in the next two games.",
    streak: "Watch rolling contact and plate discipline before upgrading the trend.",
    standard: "Watch context before over-weighting the line.",
  };
  return {
    whyItMatters: whyByKind[signalKind],
    whatChanged: `${input.keyStat} pushed the current impact score to ${input.score}.`,
    whatToWatch: watchByKind[signalKind],
    priority: Math.round(Math.max(1, Math.min(100, input.score + (signalKind === "clutch" ? 8 : signalKind === "anomaly" ? 4 : 0)))),
  };
}

export function conciseInsight(input: SignalInsightInput) {
  const insight = generateSignalInsight(input);
  return `${insight.whatChanged} ${insight.whatToWatch}`;
}

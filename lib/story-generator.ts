import type { TrendSignal } from "./trend-detection";

export function generateDataStory(input: {
  name: string;
  trend: TrendSignal;
  projection?: { median: number; low: number; high: number };
  context?: string;
}) {
  const lead = input.trend.direction === "up"
    ? `${input.name} is trending upward with real acceleration.`
    : input.trend.direction === "down"
      ? `${input.name} is losing momentum relative to baseline.`
      : `${input.name} is holding a stable current shape.`;
  const projection = input.projection ? ` Near-term range: ${input.projection.low}-${input.projection.high}, median ${input.projection.median}.` : "";
  return `${lead}${projection}${input.context ? ` ${input.context}` : ""}`;
}

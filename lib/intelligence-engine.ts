import { classifyPlayerArchetype } from "./archetypes";
import { metricConfidence } from "./confidence-scoring";
import { adjustContext, type ContextInput } from "./context-engine";
import { generateSignalInsight, type SignalInsight } from "./insight-engine";
import { detectTrend, type TrendSignal } from "./trend-detection";

export interface IntelligenceInput {
  id: string | number;
  name: string;
  team?: string;
  position?: string;
  baseline: number;
  recent: number[];
  sampleSize: number;
  sourceConfidence?: number;
  context?: ContextInput;
  hitting?: Parameters<typeof classifyPlayerArchetype>[0]["hitting"];
  pitching?: Parameters<typeof classifyPlayerArchetype>[0]["pitching"];
}

export interface IntelligenceSignal {
  id: string | number;
  name: string;
  team?: string;
  position?: string;
  signalStrength: number;
  confidence: number;
  trend: TrendSignal;
  archetype: string;
  insight: SignalInsight;
}

export function buildIntelligenceSignal(input: IntelligenceInput): IntelligenceSignal {
  const trend = detectTrend(input.recent, input.baseline);
  const confidence = metricConfidence({ sampleSize: input.sampleSize, sourceConfidence: input.sourceConfidence });
  const archetype = classifyPlayerArchetype({ hitting: input.hitting, pitching: input.pitching });
  const rawStrength = Math.round(Math.max(0, Math.min(100, input.baseline * 60 + trend.intensity * 0.4 + confidence * 0.24)));
  const contextual = input.context ? adjustContext(rawStrength, input.context).adjustedScore : rawStrength;
  const insight = generateSignalInsight({
    name: input.name,
    keyStat: String(Math.round(contextual)),
    statLine: `${trend.label} · ${archetype}`,
    score: contextual,
    team: input.team,
  });
  return {
    id: input.id,
    name: input.name,
    team: input.team,
    position: input.position,
    signalStrength: contextual,
    confidence,
    trend,
    archetype,
    insight,
  };
}

import type { Pitch, PlayerProfile } from "@/src/lib/mlb";

export type SwingProfile = {
  chasePct: number | null;
  zoneSwingPct: number | null;
  contactPct: number | null;
};

export type ContactQualityPoint = {
  label: string;
  averageExitVelocity: number | null;
  barrelRate: number | null;
};

export type VolatilityProfile = {
  variance: number | null;
  consistencyScore: number;
  label: string;
};

export type PitchTypePerformance = {
  pitchType: string;
  pitchesSeen: number;
  swingPct: number | null;
  whiffPct: number | null;
  damageRate: number | null;
  averageExitVelocity: number | null;
};

export type PredictiveSignal = {
  nextPitchType: string | null;
  nextPitchProbability: number | null;
  damageProbability: number | null;
  swingProbability: number | null;
};

export type ExploitSignal = {
  level: "strong" | "watch" | "neutral";
  headline: string;
  detail: string;
};

export type MoneyballSignal = {
  label: "undervalued" | "overperforming" | "neutral";
  detail: string;
};

export type PropContext = {
  parkFactor?: number | null;
  opponentPitchMix?: Array<{ pitchType: string; usage: number }>;
  opponentPitcherHand?: "L" | "R" | null;
  recentOpponentForm?: number | null;
};

export type PropEvaluationInput = {
  player: PlayerProfile;
  pitches: Pitch[];
  propLine: number;
  opponent: string;
  context?: PropContext;
};

export type PropEvaluation = {
  hitProbability: number;
  edgeVsLine: number;
  confidenceScore: number;
  riskTier: "A" | "B" | "C" | "D" | "F";
  explanation: string;
};

export type PlayerAnalytics = {
  swingProfile: SwingProfile;
  volatility: VolatilityProfile;
  pitchTypePerformance: PitchTypePerformance[];
  exploit: ExploitSignal;
  contactQualityTimeline: ContactQualityPoint[];
  predictive: PredictiveSignal;
  moneyball: MoneyballSignal;
  propModel: PropEvaluation;
};

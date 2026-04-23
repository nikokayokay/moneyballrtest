export type GameStateTag = "neutral" | "high leverage" | "garbage time" | "clutch";

export interface GameContext {
  inning?: number;
  outs?: number;
  homeScore?: number;
  awayScore?: number;
  battingTeamIsHome?: boolean;
  baseState?: {
    first?: boolean;
    second?: boolean;
    third?: boolean;
  };
}

export interface ContextualStat<T = unknown> {
  value: T;
  context: GameContext;
  tag: GameStateTag;
  scoreDifferential: number;
  clutchFactor: number;
}

export function scoreDifferential(context: GameContext) {
  const home = context.homeScore ?? 0;
  const away = context.awayScore ?? 0;
  const differential = home - away;
  return context.battingTeamIsHome ? differential : -differential;
}

export function estimateBasePressure(context: GameContext) {
  const bases = context.baseState;
  if (!bases) return 0;
  return Number(Boolean(bases.first)) + Number(Boolean(bases.second)) * 1.35 + Number(Boolean(bases.third)) * 1.7;
}

export function tagGameContext(context: GameContext): GameStateTag {
  const inning = context.inning ?? 1;
  const diff = Math.abs(scoreDifferential(context));
  const basePressure = estimateBasePressure(context);
  if (inning >= 7 && diff <= 2 && basePressure >= 1.35) return "clutch";
  if (inning >= 6 && diff <= 3) return "high leverage";
  if (inning >= 7 && diff >= 6) return "garbage time";
  return "neutral";
}

export function clutchFactor(context: GameContext) {
  const tag = tagGameContext(context);
  if (tag === "clutch") return 1.35;
  if (tag === "high leverage") return 1.18;
  if (tag === "garbage time") return 0.72;
  return 1;
}

export function attachGameContext<T>(value: T, context: GameContext): ContextualStat<T> {
  return {
    value,
    context,
    tag: tagGameContext(context),
    scoreDifferential: scoreDifferential(context),
    clutchFactor: clutchFactor(context),
  };
}

export function contextAdjustedSignal(score: number, context: GameContext) {
  return Math.round(Math.max(0, Math.min(100, score * clutchFactor(context))));
}

import { compareRollingToSeason, type GameLogValue } from "./rolling-windows";

export interface ProjectionRange {
  low: number;
  median: number;
  high: number;
  confidence: number;
}

export function projectNextGames(values: GameLogValue[], games = 5): ProjectionRange {
  const rolling = compareRollingToSeason(values, Math.min(5, values.length || 1));
  const blend = rolling.season * 0.55 + rolling.latest * 0.45;
  const volatility = values.length
    ? Math.sqrt(values.reduce((sum, item) => sum + Math.pow(item.value - rolling.season, 2), 0) / values.length)
    : 0.1;
  const confidence = Math.round(Math.max(35, Math.min(92, 85 - volatility * 60 + Math.min(10, values.length))));
  return {
    low: Number((blend * games - volatility * games * 0.8).toFixed(2)),
    median: Number((blend * games).toFixed(2)),
    high: Number((blend * games + volatility * games * 0.8).toFixed(2)),
    confidence,
  };
}

export function regressProjection(currentRate: number, leagueRate: number, sampleSize: number) {
  const weight = Math.min(0.82, sampleSize / (sampleSize + 120));
  return Number((currentRate * weight + leagueRate * (1 - weight)).toFixed(3));
}

export function projectSeasonEnd(currentTotal: number, remainingGames: number, projectedRate: number): ProjectionRange {
  const median = currentTotal + remainingGames * projectedRate;
  const spread = Math.max(1, Math.sqrt(Math.max(1, remainingGames)) * projectedRate * 1.8);
  return {
    low: Number((median - spread).toFixed(1)),
    median: Number(median.toFixed(1)),
    high: Number((median + spread).toFixed(1)),
    confidence: Math.round(Math.max(40, Math.min(88, 80 - spread))),
  };
}

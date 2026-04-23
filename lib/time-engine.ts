import { compareRollingToSeason, rollingAverage, type GameLogValue } from "./rolling-windows";
import { getSnapshots, rewindSnapshot, storeSnapshot, type TimeWindow } from "./temporal-data";

export type TimeSeriesPoint = GameLogValue;

export function computeTimeAwareStats(values: TimeSeriesPoint[], window: TimeWindow = "last7") {
  const size = window === "last7" ? 5 : window === "last30" ? 10 : 30;
  return {
    window,
    rolling: rollingAverage(values, size),
    comparison: compareRollingToSeason(values, size),
  };
}

export function persistTrendSnapshot<T>(entityId: string | number, data: T) {
  return storeSnapshot(entityId, data);
}

export function readTrendHistory<T>(entityId: string | number, window: TimeWindow) {
  return getSnapshots<T>(entityId, window);
}

export function rewindTrend<T>(entityId: string | number, at: string) {
  return rewindSnapshot<T>(entityId, at);
}

export interface BaselineStat {
  average: number;
  stdev: number;
}

export function computeLeagueBaselines<T extends Record<string, number>>(rows: T[], fields: Array<keyof T>) {
  return fields.reduce<Record<string, BaselineStat>>((acc, field) => {
    const values = rows.map((row) => Number(row[field])).filter(Number.isFinite);
    const average = values.reduce((sum, value) => sum + value, 0) / Math.max(1, values.length);
    const variance = values.reduce((sum, value) => sum + Math.pow(value - average, 2), 0) / Math.max(1, values.length);
    acc[String(field)] = { average, stdev: Math.sqrt(variance) };
    return acc;
  }, {});
}

export function percentileRank(value: number, values: number[], lowerIsBetter = false) {
  const sorted = values.filter(Number.isFinite).sort((a, b) => lowerIsBetter ? b - a : a - b);
  if (!sorted.length) return 50;
  const below = sorted.filter((entry) => entry <= value).length;
  return Math.round((below / sorted.length) * 100);
}

export function aboveBelowAverage(value: number, baseline?: BaselineStat) {
  if (!baseline) return { label: "No baseline", delta: 0, tone: "neutral" as const };
  const delta = value - baseline.average;
  return {
    label: delta >= 0 ? "Above average" : "Below average",
    delta,
    tone: delta >= 0 ? "positive" as const : "negative" as const,
  };
}

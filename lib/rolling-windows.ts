export interface GameLogValue {
  date: string;
  value: number;
}

export function rollingAverage(values: GameLogValue[], windowSize: number) {
  return values.map((item, index) => {
    const window = values.slice(Math.max(0, index - windowSize + 1), index + 1);
    const value = window.reduce((sum, entry) => sum + entry.value, 0) / Math.max(1, window.length);
    return { ...item, rolling: Number(value.toFixed(3)), windowSize };
  });
}

export function compareRollingToSeason(values: GameLogValue[], windowSize = 5) {
  const season = values.reduce((sum, item) => sum + item.value, 0) / Math.max(1, values.length);
  const rolling = rollingAverage(values, windowSize);
  const latest = rolling.at(-1)?.rolling ?? season;
  const delta = latest - season;
  return {
    season: Number(season.toFixed(3)),
    latest: Number(latest.toFixed(3)),
    delta: Number(delta.toFixed(3)),
    direction: delta > 0.02 ? "accelerating" as const : delta < -0.02 ? "declining" as const : "stable" as const,
    points: rolling,
  };
}

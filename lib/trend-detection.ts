export interface TrendSignal {
  label: "Hot streak" | "Cold streak" | "Breakout watch" | "Stable";
  direction: "up" | "down" | "flat";
  intensity: number;
}

export function detectTrend(recent: number[], seasonAverage: number): TrendSignal {
  const recentAverage = recent.reduce((sum, value) => sum + value, 0) / Math.max(1, recent.length);
  const delta = recentAverage - seasonAverage;
  const intensity = Math.round(Math.min(100, Math.abs(delta) / Math.max(0.001, Math.abs(seasonAverage)) * 100));
  if (delta > Math.abs(seasonAverage) * 0.18) return { label: intensity >= 35 ? "Breakout watch" : "Hot streak", direction: "up", intensity };
  if (delta < -Math.abs(seasonAverage) * 0.18) return { label: "Cold streak", direction: "down", intensity };
  return { label: "Stable", direction: "flat", intensity: Math.max(10, intensity) };
}

export function trendArrow(signal: TrendSignal) {
  if (signal.direction === "up") return "up";
  if (signal.direction === "down") return "down";
  return "flat";
}

export interface DevelopmentPoint {
  date: string;
  level: string;
  score: number;
}

export function buildDevelopmentCurve(points: DevelopmentPoint[]) {
  const ordered = [...points].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  return ordered.map((point, index) => {
    const previous = ordered[index - 1];
    const delta = previous ? point.score - previous.score : 0;
    return { ...point, delta, state: delta >= 6 ? "breakout" as const : delta <= -5 ? "stagnation" as const : "progressing" as const };
  });
}

export function classifyDevelopmentTrajectory(points: DevelopmentPoint[]) {
  const curve = buildDevelopmentCurve(points);
  const recent = curve.slice(-3);
  const delta = recent.reduce((sum, point) => sum + point.delta, 0);
  if (delta >= 10) return "breakout";
  if (delta <= -8) return "stagnating";
  return "steady growth";
}

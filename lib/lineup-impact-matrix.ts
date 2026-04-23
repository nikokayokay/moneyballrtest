export interface LineupImpactInput {
  id: string | number;
  name: string;
  team?: string;
  withPlayerRuns?: number;
  withoutPlayerRuns?: number;
  plateAppearances?: number;
  impactScore?: number;
}

export interface LineupImpactCell extends LineupImpactInput {
  delta: number;
  normalizedImpact: number;
  label: "drives lineup" | "neutral" | "drag risk";
}

export function buildLineupImpactMatrix(players: LineupImpactInput[]): LineupImpactCell[] {
  return players
    .map((player) => {
      const withRuns = player.withPlayerRuns ?? player.impactScore ?? 50;
      const withoutRuns = player.withoutPlayerRuns ?? 45;
      const delta = withRuns - withoutRuns;
      const sample = Math.min(1, Math.max(0.35, (player.plateAppearances || 30) / 120));
      const normalizedImpact = Math.round(Math.max(0, Math.min(100, 50 + delta * 3.5 * sample)));
      const label: LineupImpactCell["label"] = normalizedImpact >= 62 ? "drives lineup" : normalizedImpact <= 42 ? "drag risk" : "neutral";
      return {
        ...player,
        delta,
        normalizedImpact,
        label,
      };
    })
    .sort((a, b) => b.normalizedImpact - a.normalizedImpact);
}

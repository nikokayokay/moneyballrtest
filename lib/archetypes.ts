export type HitterArchetype = "Power bat" | "Contact bat" | "OBP engine" | "Balanced hitter";
export type PitcherArchetype = "Strikeout arm" | "Control arm" | "Groundball profile" | "Balanced pitcher";

export function classifyHitter(stats: { ops?: number; hr?: number; kRate?: number; bbRate?: number; avg?: number }): HitterArchetype {
  if ((stats.hr || 0) >= 20 || (stats.ops || 0) >= 0.86) return "Power bat";
  if ((stats.avg || 0) >= 0.285 && (stats.kRate || 30) <= 18) return "Contact bat";
  if ((stats.bbRate || 0) >= 11) return "OBP engine";
  return "Balanced hitter";
}

export function classifyPitcher(stats: { k9?: number; bb9?: number; groundBallRate?: number; era?: number }): PitcherArchetype {
  if ((stats.k9 || 0) >= 10.5) return "Strikeout arm";
  if ((stats.bb9 || 9) <= 2.5) return "Control arm";
  if ((stats.groundBallRate || 0) >= 48) return "Groundball profile";
  return "Balanced pitcher";
}

export function classifyPlayerArchetype(input: { hitting?: Parameters<typeof classifyHitter>[0]; pitching?: Parameters<typeof classifyPitcher>[0] }) {
  if (input.pitching) return classifyPitcher(input.pitching);
  if (input.hitting) return classifyHitter(input.hitting);
  return "Balanced hitter";
}

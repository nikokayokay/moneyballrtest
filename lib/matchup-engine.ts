export interface MatchupInput {
  hitter: { name: string; handedness?: string; ops?: number; kRate?: number };
  pitcher: { name: string; throws?: string; era?: number; k9?: number; bb9?: number };
}

export function analyzeMatchup(input: MatchupInput) {
  const platoon = input.hitter.handedness && input.pitcher.throws && input.hitter.handedness !== input.pitcher.throws ? 8 : -2;
  const contact = Math.max(-12, 18 - (input.hitter.kRate || 24));
  const pitcherPressure = (input.pitcher.era || 4.2) > 4.5 ? 10 : (input.pitcher.k9 || 8) >= 10 ? -8 : 2;
  const score = Math.round(Math.max(0, Math.min(100, 50 + platoon + contact + pitcherPressure + ((input.hitter.ops || 0.72) - 0.72) * 55)));
  return {
    score,
    label: score >= 65 ? "Favorable matchup" : score <= 42 ? "Tough matchup" : "Neutral matchup",
    note: `${input.hitter.name} vs ${input.pitcher.name}: ${score >= 65 ? "advantage leans hitter" : score <= 42 ? "pitcher profile suppresses upside" : "context is balanced"}.`,
  };
}

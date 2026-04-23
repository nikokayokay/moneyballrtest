export type TeamArchetype = "power-heavy" | "pitching-driven" | "speed-pressure" | "balanced contender" | "rebuild profile";

export function classifyTeamIdentity(input: {
  opsRank?: number;
  hrRank?: number;
  eraRank?: number;
  sbRank?: number;
  winPct?: number;
}): TeamArchetype {
  if ((input.winPct || 0) < 0.43) return "rebuild profile";
  if ((input.eraRank || 99) <= 8 && (input.opsRank || 99) > 12) return "pitching-driven";
  if ((input.hrRank || 99) <= 8 || (input.opsRank || 99) <= 8) return "power-heavy";
  if ((input.sbRank || 99) <= 6) return "speed-pressure";
  return "balanced contender";
}

export function teamIdentitySummary(archetype: TeamArchetype) {
  const copy: Record<TeamArchetype, string> = {
    "power-heavy": "Wins through damage, slug, and crooked-inning pressure.",
    "pitching-driven": "Run prevention carries the profile; offense only needs enough.",
    "speed-pressure": "Creates stress with pace, steals, and extra-base pressure.",
    "balanced contender": "No single dependency; production is spread across phases.",
    "rebuild profile": "Development and future value matter more than current margin.",
  };
  return copy[archetype];
}

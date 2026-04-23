import type { MiLBLevel, MiLBPlayer, ProspectTier } from "./milb-types";

const LEVEL_FACTORS: Record<MiLBLevel, number> = {
  AAA: 1,
  AA: 0.9,
  "A+": 0.78,
  A: 0.68,
};

const AVERAGE_AGE_BY_LEVEL: Record<MiLBLevel, number> = {
  AAA: 25.2,
  AA: 23.8,
  "A+": 22.4,
  A: 21.1,
};

const RANK_WEIGHT_BY_TIER: Record<ProspectTier, number> = {
  elite: 24,
  top100: 18,
  orgTop10: 11,
  unranked: 2,
};

export function classifyProspectScore(score: number): MiLBPlayer["prospect"]["label"] {
  if (score >= 85) return "MLB Ready";
  if (score >= 70) return "Rising";
  if (score >= 50) return "Development";
  return "Depth";
}

export function classifyProspectTier(rank?: number): ProspectTier {
  if (!rank) return "unranked";
  if (rank <= 25) return "elite";
  if (rank <= 100) return "top100";
  if (rank <= 300) return "orgTop10";
  return "unranked";
}

export function ageContextScore(age: number, level: MiLBLevel) {
  const average = AVERAGE_AGE_BY_LEVEL[level];
  const delta = average - age;
  return Math.max(-8, Math.min(14, delta * 5));
}

export function performanceScore(player: Pick<MiLBPlayer, "stats" | "affiliate">) {
  const levelFactor = LEVEL_FACTORS[player.affiliate.level];
  if (player.stats.hitting) {
    const { ops, hr, sb, kRate = 24, bbRate = 8 } = player.stats.hitting;
    const opsSignal = ((ops || 0.65) - 0.64) * 92;
    const powerSpeed = Math.min(18, (hr || 0) * 0.9 + (sb || 0) * 0.45);
    const discipline = Math.max(-10, Math.min(12, (bbRate - 8) * 1.4 - Math.max(0, kRate - 26) * 0.8));
    return Math.max(0, Math.min(48, (opsSignal + powerSpeed + discipline) * levelFactor));
  }
  if (player.stats.pitching) {
    const { era, whip, k9, bb9 } = player.stats.pitching;
    const runPrevention = Math.max(-8, 24 - (era || 5) * 3.1 - (whip || 1.4) * 4.2);
    const dominance = (k9 || 7) * 2.1 - (bb9 || 4) * 2.4;
    return Math.max(0, Math.min(48, (runPrevention + dominance) * levelFactor));
  }
  return 12 * levelFactor;
}

export function calculateProspectScore(input: {
  age: number;
  level: MiLBLevel;
  stats: MiLBPlayer["stats"];
  rank?: number;
  trendScore?: number;
}) {
  const tier = classifyProspectTier(input.rank);
  const base = 28;
  const age = ageContextScore(input.age, input.level);
  const ranked = input.rank ? Math.max(4, RANK_WEIGHT_BY_TIER[tier] - input.rank * 0.06) : RANK_WEIGHT_BY_TIER[tier];
  const trend = input.trendScore ?? 4;
  const performance = performanceScore({
    affiliate: { level: input.level, teamId: 0, teamName: "", league: "" },
    stats: input.stats,
  });
  const score = Math.round(Math.max(0, Math.min(100, base + age + ranked + trend + performance)));
  return {
    score,
    tier,
    label: classifyProspectScore(score),
  };
}

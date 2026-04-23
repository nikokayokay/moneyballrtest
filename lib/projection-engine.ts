import type { MiLBPlayer } from "./milb-types";

export function estimateReadiness(player: MiLBPlayer) {
  const levelBoost = player.affiliate.level === "AAA" ? 18 : player.affiliate.level === "AA" ? 10 : player.affiliate.level === "A+" ? 4 : 0;
  const agePenalty = player.bio.age > 26 ? -6 : player.bio.age < 22 ? 4 : 0;
  const score = Math.round(Math.max(0, Math.min(100, player.prospect.score + levelBoost + agePenalty)));
  return {
    score,
    label: score >= 86 ? "Next MLB candidate" : score >= 72 ? "Call-up watch" : score >= 55 ? "Development track" : "Depth track",
  };
}

export function nextMlbPlayer(players: MiLBPlayer[]) {
  return [...players].sort((a, b) => estimateReadiness(b).score - estimateReadiness(a).score)[0] || null;
}

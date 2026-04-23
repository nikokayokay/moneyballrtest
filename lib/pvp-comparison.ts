import { buildSkillProfile, skillProfileScore, type SkillProfileInput } from "./skill-profile-radar";

export interface PvpPlayerInput {
  id: string | number;
  name: string;
  team?: string;
  score: number;
  trendScore?: number;
  skills?: SkillProfileInput;
}

export interface PvpComparisonResult {
  players: Array<PvpPlayerInput & { profileScore: number }>;
  leader: PvpPlayerInput | null;
  summary: string;
}

export function comparePlayersPvp(players: PvpPlayerInput[]): PvpComparisonResult {
  const enriched = players
    .map((player) => {
      const profile = buildSkillProfile(player.skills || {});
      return { ...player, profileScore: skillProfileScore(profile) };
    })
    .sort((a, b) => (b.score + (b.trendScore || 0) + b.profileScore * 0.25) - (a.score + (a.trendScore || 0) + a.profileScore * 0.25));
  const leader = enriched[0] || null;
  return {
    players: enriched,
    leader,
    summary: leader ? `${leader.name} owns the strongest current blend of impact, trend, and skill profile.` : "Select players to build a comparison.",
  };
}

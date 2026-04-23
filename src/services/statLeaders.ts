import { DATA_TTL, cachedJson } from "@/src/data/cache";
import { toNumber } from "@/src/data/derivedMetrics";
import type { LeaderboardCard, LeaderboardCategory, LeaderboardEntry } from "@/src/data/schemas";

type StatsResponse = {
  stats?: Array<{
    splits?: Array<{
      stat?: Record<string, unknown>;
      team?: { id?: number; name?: string };
      player?: { id?: number; fullName?: string };
      position?: { abbreviation?: string };
    }>;
  }>;
};

const SEASON = new Date().getFullYear();

const CATEGORY_CONFIG: Array<{
  id: LeaderboardCategory;
  title: string;
  statLabel: string;
  group: "hitting" | "pitching";
  field: string;
  minField: string;
  minValue: number;
  lowerIsBetter?: boolean;
}> = [
  { id: "homeRuns", title: "HR leaders", statLabel: "HR", group: "hitting", field: "homeRuns", minField: "plateAppearances", minValue: 20 },
  { id: "ops", title: "OPS leaders", statLabel: "OPS", group: "hitting", field: "ops", minField: "plateAppearances", minValue: 20 },
  { id: "avg", title: "AVG leaders", statLabel: "AVG", group: "hitting", field: "avg", minField: "plateAppearances", minValue: 20 },
  { id: "stolenBases", title: "SB leaders", statLabel: "SB", group: "hitting", field: "stolenBases", minField: "plateAppearances", minValue: 20 },
  { id: "era", title: "ERA leaders", statLabel: "ERA", group: "pitching", field: "era", minField: "inningsPitched", minValue: 4, lowerIsBetter: true },
  { id: "strikeOuts", title: "Strikeout leaders", statLabel: "SO", group: "pitching", field: "strikeOuts", minField: "inningsPitched", minValue: 4 },
];

function headshotUrl(playerId: number) {
  return `https://img.mlbstatic.com/mlb-photos/image/upload/w_320,q_auto:best/v1/people/${playerId}/headshot/67/current`;
}

function statValue(stat: Record<string, unknown>, field: string) {
  const raw = stat[field];
  const numeric = toNumber(raw);
  if (numeric === null) return null;
  return {
    numeric,
    label: field === "ops" || field === "avg" ? numeric.toFixed(3).replace(/^0/, "") : field === "era" ? numeric.toFixed(2) : String(Math.round(numeric)),
  };
}

function minQualified(stat: Record<string, unknown>, field: string, min: number) {
  const value = toNumber(stat[field]);
  if (field === "inningsPitched") return value !== null && value >= min;
  return value !== null && value >= min;
}

async function fetchGroup(group: "hitting" | "pitching") {
  return cachedJson<StatsResponse>(
    `https://statsapi.mlb.com/api/v1/stats?stats=season&group=${group}&playerPool=ALL&season=${SEASON}&sportIds=1&limit=1200`,
    DATA_TTL.nearLive,
  );
}

export async function fetchStatLeaderCards(): Promise<LeaderboardCard[]> {
  const [hitting, pitching] = await Promise.all([fetchGroup("hitting"), fetchGroup("pitching")]);
  const data = { hitting, pitching };
  const updatedAt = new Date().toISOString();

  return CATEGORY_CONFIG.map((category) => {
    const splits = data[category.group].stats?.[0]?.splits || [];
    const entries: LeaderboardEntry[] = splits
      .flatMap((split) => {
        const stat = split.stat || {};
        const value = statValue(stat, category.field);
        const playerId = split.player?.id || 0;
        if (!value || !playerId || !minQualified(stat, category.minField, category.minValue)) return [];
        const trend: LeaderboardEntry["trend"] = value.numeric >= (category.lowerIsBetter ? 3.25 : category.field === "homeRuns" ? 8 : 0.850) ? "hot" : "stable";
        const entry: LeaderboardEntry = {
          playerId,
          playerName: split.player?.fullName || "MLB Player",
          teamId: split.team?.id || null,
          team: split.team?.name || "MLB",
          position: split.position?.abbreviation || (category.group === "pitching" ? "P" : "MLB"),
          statLabel: category.statLabel,
          statValue: value.label,
          numericValue: value.numeric,
          rank: 0,
          trend,
          last7Context: category.group === "pitching" ? "Recent workload checked every refresh" : "Recent production checked every refresh",
          headshotUrl: headshotUrl(playerId),
        };
        return [entry];
      })
      .sort((a, b) => category.lowerIsBetter ? a.numericValue - b.numericValue : b.numericValue - a.numericValue)
      .slice(0, 5)
      .map((entry, index) => ({ ...entry, rank: index + 1 }));

    return {
      id: category.id,
      title: category.title,
      statLabel: category.statLabel,
      entries,
      href: `/leaderboards?stat=${category.id}`,
      updatedAt,
    };
  });
}

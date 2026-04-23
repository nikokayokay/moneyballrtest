import { DATA_TTL, cachedJson } from "@/src/data/cache";
import type { NormalizedGame, NormalizedTeam } from "@/src/data/schemas";
import { currentMlbDate } from "@/src/lib/live";
import { fetchPlayerProfile, fetchRosterDirectory } from "@/src/lib/mlb";
import { fetchStatLeaderCards } from "@/src/services/statLeaders";

export const DATA_STRATEGY = {
  mode: "hybrid-client-api-facade",
  primarySources: {
    mlbStatsApi: "Identity, rosters, schedules, season stats, game logs, live game feeds.",
    baseballSavant: "Pitch-level and Statcast-style context where available.",
    derivedMetrics: "Moneyballr composite scores, wOBA approximations, trend classifications, rolling summaries.",
  },
  freshness: {
    liveGames: "10-15 seconds while games are live",
    leaderboards: "5 minutes",
    staticRosterIdentity: "24 hours",
  },
};

type ScheduleResponse = {
  dates?: Array<{
    games?: Array<{
      gamePk?: number;
      status?: { detailedState?: string };
      teams?: {
        away?: { team?: { name?: string }; score?: number };
        home?: { team?: { name?: string }; score?: number };
      };
      linescore?: { currentInningOrdinal?: string; outs?: number };
    }>;
  }>;
};

function classifyGame(status?: string): NormalizedGame["state"] {
  const lower = String(status || "").toLowerCase();
  if (lower.includes("progress")) return "LIVE";
  if (lower.includes("final")) return "FINAL";
  if (lower.includes("scheduled") || lower.includes("preview") || lower.includes("pre-game")) return "UPCOMING";
  return "NO_GAME";
}

export async function getPlayers() {
  return fetchRosterDirectory();
}

export async function getPlayer(playerId: number, refresh = false) {
  return fetchPlayerProfile(playerId, refresh);
}

export async function getTeams(): Promise<NormalizedTeam[]> {
  const players = await fetchRosterDirectory();
  const teams = new Map<number, NormalizedTeam>();
  players.forEach((player) => {
    if (!player.teamId) return;
    teams.set(player.teamId, {
      id: player.teamId,
      name: player.team,
      abbreviation: player.teamAbbr,
      logoUrl: `https://www.mlbstatic.com/team-logos/${player.teamId}.svg`,
    });
  });
  return [...teams.values()].sort((a, b) => a.abbreviation.localeCompare(b.abbreviation));
}

export async function getGames(date = currentMlbDate()): Promise<NormalizedGame[]> {
  const data = await cachedJson<ScheduleResponse>(
    `https://statsapi.mlb.com/api/v1/schedule?sportId=1&hydrate=linescore&date=${date}`,
    DATA_TTL.live,
  );
  return (data.dates?.flatMap((item) => item.games || []) || []).map((game) => ({
    id: game.gamePk || 0,
    state: classifyGame(game.status?.detailedState),
    awayTeam: game.teams?.away?.team?.name || "Away",
    homeTeam: game.teams?.home?.team?.name || "Home",
    awayScore: game.teams?.away?.score ?? null,
    homeScore: game.teams?.home?.score ?? null,
    inning: game.linescore?.currentInningOrdinal || null,
    outs: game.linescore?.outs ?? null,
  }));
}

export async function getLeaderboards() {
  return fetchStatLeaderCards();
}

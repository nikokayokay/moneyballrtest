import { cachedJson, clearDataCache } from "@/src/data/cache";
import type { HomePerformer } from "@/src/data/home-discovery";
import { fetchImpactPlayers, type SpherePlayer } from "@/src/services/impactPlayers";
import { fetchPlayerOriginClusters, type OriginCluster as PlayerOriginCluster } from "@/src/services/playerOrigins";
import { fetchStatLeaderCards } from "@/src/services/statLeaders";
import type { LeaderboardCard } from "@/src/data/schemas";
import { validateStandings, validateTopPerformers, type ValidatedStandingTeam } from "@/lib/data-validator";
import { normalizeCountry } from "@/lib/country-flags";
import { attachGameContext, contextAdjustedSignal, type GameContext } from "@/lib/game-context";
import { classifySignal, generateSignalInsight } from "@/lib/insight-engine";
import { buildIntelligenceSignal, type IntelligenceSignal } from "@/lib/intelligence-engine";

export const DATA_ENGINE_TTL = {
  live: 15_000,
  completed: 120_000,
  standings: 120_000,
};

export const DATA_REFRESH_INTERVALS = {
  liveGames: 15_000,
  completedGames: 120_000,
  standings: 120_000,
  leaderboards: 120_000,
};

const MLB_API = "https://statsapi.mlb.com/api/v1";
const SEASON = new Date().getFullYear();

type StandingsResponse = {
  records?: Array<{
    league?: { name?: string };
    division?: { name?: string };
    teamRecords?: StandingTeamRecord[];
  }>;
};

type StandingTeamRecord = {
  team?: { id?: number; name?: string; abbreviation?: string };
  wins?: number;
  losses?: number;
  gamesBack?: string;
  streak?: { streakCode?: string };
  records?: {
    splitRecords?: Array<{ type?: string; wins?: number; losses?: number }>;
  };
};

type ScheduleResponse = {
  dates?: Array<{
    date?: string;
    games?: MlbScheduleGame[];
  }>;
};

type MlbScheduleGame = {
  gamePk: number;
  gameDate?: string;
  status?: { abstractGameState?: string; detailedState?: string };
  teams?: {
    away?: { team?: { id?: number; name?: string; abbreviation?: string }; score?: number };
    home?: { team?: { id?: number; name?: string; abbreviation?: string }; score?: number };
  };
  linescore?: {
    currentInningOrdinal?: string;
    inningState?: string;
    outs?: number;
  };
  boxscore?: {
    teams?: {
      away?: BoxscoreTeam;
      home?: BoxscoreTeam;
    };
  };
};

type BoxscoreResponse = {
  teams?: {
    away?: BoxscoreTeam;
    home?: BoxscoreTeam;
  };
};

type BoxscoreTeam = {
  team?: { id?: number; name?: string; abbreviation?: string };
  players?: Record<string, BoxscorePlayer>;
};

type BoxscorePlayer = {
  person?: { id?: number; fullName?: string };
  position?: { abbreviation?: string };
  stats?: {
    batting?: Record<string, unknown>;
    pitching?: Record<string, unknown>;
  };
};

type PeopleResponse = {
  people?: Array<{
    id?: number;
    birthCountry?: string;
  }>;
};

export type PerformerFeed = {
  performers: HomePerformer[];
  sourceDate: string;
  isToday: boolean;
  label: string;
};

export type MlbGameSnapshot = {
  id: number;
  state: "LIVE" | "FINAL" | "UPCOMING";
  awayTeam: string;
  homeTeam: string;
  awayScore: number | null;
  homeScore: number | null;
  inning: string | null;
  outs: number | null;
};

export type IntelligenceLensKey =
  | "stats"
  | "lineups"
  | "dashboard"
  | "trend-shift"
  | "profiles"
  | "showcase"
  | "matchup-matrix"
  | "contact-quality"
  | "draft-prospects"
  | "tier-list"
  | "last-x-games"
  | "pvp"
  | "contracts"
  | "lab"
  | "feedback";

export type IntelligenceLensData = {
  lens: IntelligenceLensKey;
  players: SpherePlayer[];
  standings: ValidatedStandingTeam[];
  games: MlbGameSnapshot[];
  signals: IntelligenceSignal[];
  refreshedAt: string;
};

function numberFrom(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function headshotUrl(playerId: number) {
  return `https://img.mlbstatic.com/mlb-photos/image/upload/w_320,q_auto:best/v1/people/${playerId}/headshot/67/current`;
}

function teamLogo(teamId: number | null) {
  return teamId ? `https://www.mlbstatic.com/team-logos/${teamId}.svg` : "";
}

function gameState(game: MlbScheduleGame): MlbGameSnapshot["state"] {
  const detailed = `${game.status?.abstractGameState || ""} ${game.status?.detailedState || ""}`.toLowerCase();
  if (detailed.includes("live") || detailed.includes("progress") || detailed.includes("delayed")) return "LIVE";
  if (detailed.includes("final") || detailed.includes("completed")) return "FINAL";
  return "UPCOMING";
}

function lastTenLabel(teamRecord: StandingTeamRecord) {
  const lastTen = teamRecord.records?.splitRecords?.find((record) => record.type === "lastTen");
  return lastTen ? `${lastTen.wins || 0}-${lastTen.losses || 0}` : "0-0";
}

async function withValidationRetry<T>(cachePrefix: string, load: () => Promise<T>, validate: (value: T) => { ok: boolean }) {
  const first = await load();
  if (validate(first).ok) return first;
  clearDataCache(cachePrefix);
  const second = await load();
  validate(second);
  return second;
}

export async function getStandings(): Promise<ValidatedStandingTeam[]> {
  const url = `${MLB_API}/standings?leagueId=103,104&season=${SEASON}&standingsTypes=regularSeason&hydrate=team`;

  return withValidationRetry(
    url,
    async () => {
      const response = await cachedJson<StandingsResponse>(url, DATA_ENGINE_TTL.standings);
      return (response.records || []).flatMap((record) =>
        (record.teamRecords || []).map((teamRecord) => {
          const teamId = teamRecord.team?.id || 0;
          return {
            teamId,
            teamName: teamRecord.team?.name || "MLB Team",
            abbreviation: teamRecord.team?.abbreviation || teamRecord.team?.name?.slice(0, 3).toUpperCase() || "MLB",
            league: record.league?.name || "MLB",
            division: record.division?.name || "MLB",
            wins: teamRecord.wins || 0,
            losses: teamRecord.losses || 0,
            gamesBack: teamRecord.gamesBack || "-",
            lastTen: lastTenLabel(teamRecord),
            streak: teamRecord.streak?.streakCode || "-",
            logoUrl: teamLogo(teamId),
          };
        }),
      );
    },
    validateStandings,
  );
}

export async function getTodayGames(date = new Date()): Promise<MlbGameSnapshot[]> {
  const mlbDate = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
  const url = `${MLB_API}/schedule?sportId=1&date=${mlbDate}&hydrate=team,linescore,boxscore`;
  const response = await cachedJson<ScheduleResponse>(url, DATA_ENGINE_TTL.live);

  return (response.dates || []).flatMap((day) =>
    (day.games || []).map((game) => ({
      id: game.gamePk,
      state: gameState(game),
      awayTeam: game.teams?.away?.team?.abbreviation || game.teams?.away?.team?.name || "Away",
      homeTeam: game.teams?.home?.team?.abbreviation || game.teams?.home?.team?.name || "Home",
      awayScore: game.teams?.away?.score ?? null,
      homeScore: game.teams?.home?.score ?? null,
      inning: game.linescore?.currentInningOrdinal
        ? `${game.linescore.inningState || ""} ${game.linescore.currentInningOrdinal}`.trim()
        : null,
      outs: game.linescore?.outs ?? null,
    })),
  );
}

async function countriesForPlayers(playerIds: number[]) {
  if (!playerIds.length) return new Map<number, string>();
  const url = `${MLB_API}/people?personIds=${playerIds.join(",")}`;
  const response = await cachedJson<PeopleResponse>(url, DATA_ENGINE_TTL.completed);
  return new Map((response.people || []).map((person) => [person.id || 0, normalizeCountry(person.birthCountry)]));
}

function battingLine(stat: Record<string, unknown>) {
  const atBats = numberFrom(stat.atBats);
  const hits = numberFrom(stat.hits);
  const homeRuns = numberFrom(stat.homeRuns);
  const rbi = numberFrom(stat.rbi);
  const doubles = numberFrom(stat.doubles);
  const triples = numberFrom(stat.triples);
  const walks = numberFrom(stat.baseOnBalls);
  const stolenBases = numberFrom(stat.stolenBases);
  const extras = [
    homeRuns ? `${homeRuns} HR` : null,
    triples ? `${triples} 3B` : null,
    doubles ? `${doubles} 2B` : null,
    stolenBases ? `${stolenBases} SB` : null,
    rbi ? `${rbi} RBI` : null,
    walks ? `${walks} BB` : null,
  ].filter(Boolean);
  return `${hits}-${atBats}${extras.length ? `, ${extras.join(", ")}` : ""}`;
}

function pitchingLine(stat: Record<string, unknown>) {
  const innings = String(stat.inningsPitched || "0");
  const strikeouts = numberFrom(stat.strikeOuts);
  const earnedRuns = numberFrom(stat.earnedRuns);
  const hits = numberFrom(stat.hits);
  const walks = numberFrom(stat.baseOnBalls);
  return `${innings} IP, ${earnedRuns} ER, ${strikeouts} K${hits ? `, ${hits} H` : ""}${walks ? `, ${walks} BB` : ""}`;
}

function battingImpact(stat: Record<string, unknown>) {
  return (
    numberFrom(stat.homeRuns) * 18 +
    numberFrom(stat.hits) * 5 +
    numberFrom(stat.rbi) * 4 +
    numberFrom(stat.runs) * 3 +
    numberFrom(stat.stolenBases) * 4 +
    numberFrom(stat.baseOnBalls) * 2
  );
}

function pitchingImpact(stat: Record<string, unknown>) {
  return (
    numberFrom(stat.strikeOuts) * 4 +
    numberFrom(stat.inningsPitched) * 3 -
    numberFrom(stat.earnedRuns) * 5
  );
}

function keyStat(stat: Record<string, unknown>, role: "batting" | "pitching") {
  if (role === "pitching") return `${numberFrom(stat.strikeOuts)} K`;
  const hr = numberFrom(stat.homeRuns);
  const sb = numberFrom(stat.stolenBases);
  if (hr && sb) return "HR + SB";
  if (hr) return `${hr} HR`;
  if (numberFrom(stat.hits) >= 3) return `${numberFrom(stat.hits)} H`;
  if (sb) return `${sb} SB`;
  if (numberFrom(stat.rbi)) return `${numberFrom(stat.rbi)} RBI`;
  return `${numberFrom(stat.hits)} H`;
}

function gameContextForTeam(game: MlbScheduleGame | undefined, teamId: number | null): GameContext {
  const homeId = game?.teams?.home?.team?.id;
  const inning = Number(String(game?.linescore?.currentInningOrdinal || "1").replace(/\D/g, "")) || 1;
  return {
    inning,
    outs: game?.linescore?.outs ?? 0,
    awayScore: game?.teams?.away?.score,
    homeScore: game?.teams?.home?.score,
    battingTeamIsHome: Boolean(teamId && homeId && teamId === homeId),
  };
}

function extractPerformersFromTeams(teams: BoxscoreTeam[], game?: MlbScheduleGame): Array<HomePerformer & { rawScore: number }> {
  const performers: Array<HomePerformer & { rawScore: number }> = [];

  teams.forEach((team) => {
    Object.values(team.players || {}).forEach((player) => {
      const id = player.person?.id || 0;
      if (!id || !player.person?.fullName) return;

      const batting = player.stats?.batting || {};
      const pitching = player.stats?.pitching || {};
      const battingScore = battingImpact(batting);
      const pitchingScore = pitchingImpact(pitching);
      const role = pitchingScore > battingScore ? "pitching" : "batting";
      const rawScore = Math.max(battingScore, pitchingScore);
      if (rawScore <= 0) return;
      const teamId = team.team?.id || null;
      const context = gameContextForTeam(game, teamId);
      const contextual = attachGameContext(rawScore, context);
      const impactScore = contextAdjustedSignal(Math.round(Math.max(1, Math.min(100, 45 + rawScore))), context);
      const playerKeyStat = keyStat(role === "pitching" ? pitching : batting, role);
      const playerStatLine = role === "pitching" ? pitchingLine(pitching) : battingLine(batting);
      const signalType = classifySignal({
        keyStat: playerKeyStat,
        statLine: playerStatLine,
        score: impactScore,
        contextTag: contextual.tag,
      });
      const insight = generateSignalInsight({
        name: player.person.fullName,
        keyStat: playerKeyStat,
        statLine: playerStatLine,
        score: impactScore,
        signalKind: signalType,
        contextTag: contextual.tag,
        team: team.team?.abbreviation || team.team?.name || "MLB",
      });

      performers.push({
        playerId: id,
        name: player.person.fullName,
        team: team.team?.abbreviation || team.team?.name || "MLB",
        teamId,
        position: player.position?.abbreviation,
        country: "Unknown",
        headshotUrl: headshotUrl(id),
        keyStat: playerKeyStat,
        statLine: playerStatLine,
        impactScore,
        signalType,
        contextTag: contextual.tag,
        clutchFactor: contextual.clutchFactor,
        insight,
        deeperStats: role === "pitching"
          ? [["IP", String(pitching.inningsPitched || "0")], ["K", String(pitching.strikeOuts || "0")], ["ER", String(pitching.earnedRuns || "0")]]
          : [["H", String(batting.hits || "0")], ["RBI", String(batting.rbi || "0")], ["TB", String(batting.totalBases || "0")]],
        href: `/player/${id}`,
        rawScore: impactScore,
      });
    });
  });

  return performers;
}

async function hydratePerformerCountries(performers: Array<HomePerformer & { rawScore: number }>) {
  const ranked = performers
    .sort((a, b) => b.rawScore - a.rawScore)
    .slice(0, 24);
  const countryMap = await countriesForPlayers(ranked.map((player) => Number(player.playerId)));
  return ranked
    .map(({ rawScore: _rawScore, ...player }) => ({
      ...player,
      country: countryMap.get(Number(player.playerId)) || "Unknown",
    }));
}

function mlbDateKey(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

async function fetchPerformersForDate(dateKey: string, ttl = DATA_ENGINE_TTL.completed) {
  const url = `${MLB_API}/schedule?sportId=1&date=${dateKey}&hydrate=team,linescore`;
  const response = await cachedJson<ScheduleResponse>(url, ttl);
  const games = (response.dates || []).flatMap((day) => day.games || []);
  return fetchPerformersForGames(games, ttl);
}

async function fetchPerformersForGames(games: MlbScheduleGame[], ttl = DATA_ENGINE_TTL.completed) {
  const playableGames = games.filter((game) => {
    const status = `${game.status?.abstractGameState || ""} ${game.status?.detailedState || ""}`.toLowerCase();
    return game.gamePk && !status.includes("scheduled") && !status.includes("preview") && !status.includes("pre-game");
  });
  if (!playableGames.length) return [];

  const boxscores = await Promise.allSettled(
    playableGames.map((game) => cachedJson<BoxscoreResponse>(`${MLB_API}/game/${game.gamePk}/boxscore`, ttl)),
  );

  return boxscores.flatMap((result, index) => {
    if (result.status !== "fulfilled") return [];
    const teams = [result.value.teams?.away, result.value.teams?.home].filter(Boolean) as BoxscoreTeam[];
    return extractPerformersFromTeams(teams, playableGames[index]);
  });
}

export type SignalFilter = {
  team?: string;
  position?: string;
  timeframe?: "game" | "day";
  signalType?: HomePerformer["signalType"];
};

export async function getTopSignals(selectedDate = new Date(), filters: SignalFilter = {}) {
  const feed = await getPerformerFeed(selectedDate);
  const filtered = feed.performers
    .filter((player) => !filters.team || player.team === filters.team)
    .filter((player) => !filters.position || player.position === filters.position)
    .filter((player) => !filters.signalType || player.signalType === filters.signalType)
    .map((player, index) => ({
      ...player,
      impactScore: Math.max(1, Math.round(player.impactScore - index * 0.6)),
    }))
    .sort((a, b) => (b.insight?.priority || b.impactScore) - (a.insight?.priority || a.impactScore));
  return { ...feed, performers: filtered };
}

async function fetchPerformersForRange(startKey: string, endKey: string) {
  const url = `${MLB_API}/schedule?sportId=1&startDate=${startKey}&endDate=${endKey}&hydrate=team,linescore,boxscore`;
  const response = await cachedJson<ScheduleResponse>(url, DATA_ENGINE_TTL.completed);
  const days = (response.dates || []).slice().reverse();

  for (const day of days) {
    const dateKey = day.date;
    if (!dateKey) continue;
    const performers = await fetchPerformersForGames(day.games || [], DATA_ENGINE_TTL.completed);
    if (performers.length) return { dateKey, performers };
  }

  return null;
}

async function findNearestPerformerDate(anchorDate: Date) {
  const anchorKey = mlbDateKey(anchorDate);
  const selectedPerformers = await fetchPerformersForDate(anchorKey, DATA_ENGINE_TTL.live);
  if (selectedPerformers.length) return { dateKey: anchorKey, performers: selectedPerformers, offset: 0 };

  const yesterday = new Date(anchorDate);
  yesterday.setDate(anchorDate.getDate() - 1);
  const yesterdayKey = mlbDateKey(yesterday);
  const yesterdayPerformers = await fetchPerformersForDate(yesterdayKey, DATA_ENGINE_TTL.completed);
  if (yesterdayPerformers.length) return { dateKey: yesterdayKey, performers: yesterdayPerformers, offset: 1 };

  for (let windowStart = 2; windowStart < 420; windowStart += 32) {
    const end = new Date(anchorDate);
    end.setDate(anchorDate.getDate() - windowStart);
    const start = new Date(anchorDate);
    start.setDate(anchorDate.getDate() - windowStart - 31);
    const found = await fetchPerformersForRange(mlbDateKey(start), mlbDateKey(end));
    if (found) return { ...found, offset: windowStart };
  }

  return { dateKey: mlbDateKey(anchorDate), performers: [], offset: 0 };
}

export async function getTodayTopPerformers(): Promise<HomePerformer[]> {
  const feed = await getPerformerFeed();
  return feed.performers;
}

export async function getPerformerFeed(selectedDate = new Date()): Promise<PerformerFeed> {
  const selectedKey = mlbDateKey(selectedDate);
  const cacheKey = `${MLB_API}/schedule?sportId=1&date=${selectedKey}&hydrate=team,linescore,boxscore`;

  return withValidationRetry(
    cacheKey,
    async () => {
      const nearest = await findNearestPerformerDate(selectedDate);
      if (nearest.performers.length) {
        const hydrated = await hydratePerformerCountries(nearest.performers);
        return {
          performers: hydrated,
          sourceDate: nearest.dateKey,
          isToday: nearest.offset === 0 && selectedKey === mlbDateKey(new Date()),
          label: nearest.offset === 0 ? `Official - ${nearest.dateKey}` : `No boxscore on ${selectedKey}; showing ${nearest.dateKey}`,
        };
      }

      return {
        performers: [],
        sourceDate: selectedKey,
        isToday: false,
        label: `No official MLB boxscore found before ${selectedKey}`,
      };
    },
    (feed) => validateTopPerformers(feed.performers),
  );
}

export async function getLeaderboards(): Promise<LeaderboardCard[]> {
  return fetchStatLeaderCards();
}

export async function getImpactPlayers(limit = 48): Promise<SpherePlayer[]> {
  return fetchImpactPlayers(limit);
}

export async function getPlayerOriginClusters(): Promise<PlayerOriginCluster[]> {
  return fetchPlayerOriginClusters();
}

export async function getIntelligenceLensData(lens: IntelligenceLensKey): Promise<IntelligenceLensData> {
  const [players, standings, games] = await Promise.all([
    getImpactPlayers(72),
    getStandings(),
    getTodayGames(),
  ]);
  const signals = players.slice(0, 36).map((player) => {
    const baseline = player.woba || 0.315;
    const recent = [player.last7Woba || baseline, baseline, Math.max(0.22, baseline - 0.018)];
    return buildIntelligenceSignal({
      id: player.id,
      name: player.title,
      team: player.team,
      baseline,
      recent,
      sampleSize: player.last7Woba ? 28 : 12,
      sourceConfidence: player.last7Woba ? 0.78 : 0.58,
      hitting: {
        ops: baseline * 2.15,
        bbRate: player.trend === "hot" ? 11 : 8,
        kRate: player.trend === "cold" ? 28 : 21,
      },
    });
  });

  return {
    lens,
    players,
    standings,
    games,
    signals,
    refreshedAt: new Date().toISOString(),
  };
}

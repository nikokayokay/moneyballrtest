import { nationalTeamLabel, normalizeCountry } from "@/lib/country-flags";

export type PlayerSearchItem = {
  playerId: number;
  fullName: string;
  team: string;
  teamAbbr: string;
  teamId: number | null;
  position: string;
  positionType: string;
  jerseyNumber: string | null;
  active: boolean;
  status: string;
  headshotUrl: string;
};

export type ValidationMessage = {
  level: "ok" | "warn" | "error";
  text: string;
};

export type SourceStatus = {
  identity: string;
  season: string;
  logs: string;
  splits: string;
  statcast: string;
  live: string;
};

export type LiveStateTag = "LIVE" | "FINAL" | "UPCOMING" | "NO_GAME";

export type GameLogEntry = {
  date: string;
  opponent: string;
  isHome: boolean;
  result: string;
  statLine: string;
  impact: string;
  raw: Record<string, unknown>;
};

export type Pitch = {
  x: number;
  y: number;
  pitchType: string;
  result: "ball" | "called_strike" | "swinging_strike" | "foul" | "in_play" | "hit" | "home_run";
  velocity?: number;
  inning?: number;
  timestamp?: string;
  batterSide?: string;
  pitcherHand?: string;
  count?: string;
  description?: string;
  gamePk?: number;
  gameDate?: string;
  opponent?: string;
  abNumber?: number;
  launchSpeed?: number;
  launchAngle?: number;
  xba?: number;
  isBarrel?: boolean;
  isInZone?: boolean;
};

export type PlayerProfile = {
  identity: {
    playerId: number;
    fullName: string;
    team: string;
    teamId: number | null;
    jerseyNumber: string | null;
    position: string;
    bats: string | null;
    throws: string | null;
    height: string | null;
    weight: number | null;
    age: number | null;
    battingOrder: string | null;
    debutDate: string | null;
    status: string;
    headshotUrl: string;
    country: string | null;
    nationalTeam: string | null;
  };
  type: "hitter" | "pitcher";
  sample: {
    tier: "full_sample" | "partial_sample" | "projection";
    confidence: "HIGH" | "MEDIUM" | "LOW";
    mode: "Observed" | "Blended" | "Projection-based";
    badgeLabel: string;
    reason: string;
    note: string;
    sampleLabel: string;
    reliability: number;
  };
  confidence: {
    score: number;
    comparisonScore: number;
    trend: "HOT" | "COLD" | "NEUTRAL";
    dataConfidence: "HIGH" | "MEDIUM" | "LOW";
    insight: string;
  };
  archetype: string;
  confidenceEngine: {
    percent: number;
    label: "Unstable Sample" | "Stabilizing" | "Reliable";
    explanation: string;
  };
  trendData: Array<{
    label: string;
    woba: number | null;
    hardHit: number | null;
    kRate: number | null;
  }>;
  zoneIntelligence: {
    sampleLabel: string;
    cells: Array<{
      label: string;
      swingPct: number | null;
      whiffPct: number | null;
      damage: number | null;
    }>;
  };
  expectedActual: Array<{
    label: string;
    expected: number | null;
    actual: number | null;
    delta: number | null;
  }>;
  decisionInsight: string;
  sources: SourceStatus;
  validation: ValidationMessage[];
  standardStats: Array<[string, string]>;
  advancedStats: Array<[string, string]>;
  splits: Array<[string, string]>;
  windows: Array<[string, string]>;
  recentFormSummary: string;
  recentGames: GameLogEntry[];
  allGames: GameLogEntry[];
  liveGame: {
    state: LiveStateTag;
    status: string;
    opponent: string;
    line: Array<[string, string]>;
    note: string;
    inning: string | null;
    isToday: boolean;
    updatedAt: string;
  };
  pitchMix: Array<{
    pitchType: string;
    usage: string;
    avgVelo: string;
    hMov: string;
    vMov: string;
  }>;
  fetchedAt: string;
};

type MlbPerson = {
  id: number;
  fullName: string;
  active: boolean;
  currentAge?: number;
  currentTeam?: { id: number; name: string };
  primaryNumber?: string;
  primaryPosition?: { abbreviation?: string; type?: string };
  batSide?: { code?: string };
  pitchHand?: { code?: string };
  height?: string;
  weight?: number;
  mlbDebutDate?: string;
  nameSlug?: string;
  birthCountry?: string;
};

const SEASON = new Date().getFullYear();
const rosterCache = new Map<string, Promise<PlayerSearchItem[]>>();
const jsonCache = new Map<string, Promise<unknown>>();
const textCache = new Map<string, Promise<string>>();

const TEAM_LOOKUP: Record<number, string> = {
  109: "ARI", 110: "BAL", 111: "BOS", 112: "CHC", 113: "CIN", 114: "CLE", 115: "COL", 116: "DET", 117: "HOU", 118: "KC",
  119: "LAD", 120: "WSH", 121: "NYM", 133: "ATH", 134: "PIT", 135: "SD", 136: "SEA", 137: "SF", 138: "STL", 139: "TB",
  140: "TEX", 141: "TOR", 142: "MIN", 143: "PHI", 144: "ATL", 145: "CWS", 146: "MIA", 147: "NYY", 158: "MIL"
};

const clamp = (value: number, min = 0, max = 100) => Math.max(min, Math.min(max, value));
const first = (...values: Array<number | null>) => values.find((value) => Number.isFinite(value)) ?? null;
const blend = (value: number | null, baseline: number, reliability: number) => Number.isFinite(value) ? baseline + (((value as number) - baseline) * reliability) : baseline;
const scale = (value: number | null, min: number, max: number, inverse = false) => {
  if (!Number.isFinite(value)) return null;
  const score = value! <= min ? 0 : value! >= max ? 100 : ((value! - min) / (max - min)) * 100;
  return inverse ? 100 - score : score;
};
const weighted = (items: Array<{ weight: number; score: number | null }>) => {
  const valid = items.filter((item) => Number.isFinite(item.score) && Number.isFinite(item.weight));
  const total = valid.reduce((sum, item) => sum + item.weight, 0);
  return total ? valid.reduce((sum, item) => sum + ((item.score as number) * item.weight), 0) / total : null;
};
const average = (values: Array<number | null>) => {
  const valid = values.filter((value): value is number => Number.isFinite(value));
  return valid.length ? valid.reduce((sum, value) => sum + value, 0) / valid.length : null;
};
const stdev = (values: Array<number | null>) => {
  const valid = values.filter((value): value is number => Number.isFinite(value));
  if (valid.length < 2) return null;
  const mean = valid.reduce((sum, value) => sum + value, 0) / valid.length;
  const variance = valid.reduce((sum, value) => sum + ((value - mean) ** 2), 0) / valid.length;
  return Math.sqrt(variance);
};
const safeDateLabel = (value: string) => new Date(`${value}T12:00:00`).toLocaleDateString([], { month: "short", day: "numeric" });

const WOBA_WEIGHTS = {
  unintentionalBb: 0.69,
  hbp: 0.72,
  single: 0.88,
  double: 1.247,
  triple: 1.578,
  homeRun: 2.031,
};

function currentMlbDate(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

function classifyGameState(status?: string | null): LiveStateTag {
  const normalized = String(status || "").toLowerCase();
  if (normalized.includes("in progress") || normalized.includes("warmup") || normalized.includes("delayed")) return "LIVE";
  if (normalized.includes("final") || normalized.includes("completed")) return "FINAL";
  if (normalized.includes("scheduled") || normalized.includes("pre-game") || normalized.includes("preview")) return "UPCOMING";
  return "NO_GAME";
}

function headshotUrl(playerId: number) {
  return `https://img.mlbstatic.com/mlb-photos/image/upload/w_320,q_auto:best/v1/people/${playerId}/headshot/67/current`;
}

function num(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(String(value).replace(/%/g, "").replace(/,/g, "").trim());
  return Number.isFinite(parsed) ? parsed : null;
}

function fmt(value: unknown, digits: number | null = null) {
  if (value === null || value === undefined || value === "") return "Unavailable";
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return String(value);
  return digits === null ? String(parsed) : parsed.toFixed(digits);
}

function pct(value: unknown, digits = 1) {
  const parsed = num(value);
  return Number.isFinite(parsed) ? `${(parsed as number).toFixed(digits)}%` : "Unavailable";
}

function sampleProfile(type: "hitter" | "pitcher", season: Record<string, unknown>) {
  const size = type === "pitcher"
    ? parseIpToOuts(String(season.inningsPitched || "0.0")) / 3
    : num(season.plateAppearances);
  const cutoffs = type === "pitcher" ? { partial: 20, full: 80 } : { partial: 50, full: 300 };
  const tier = Number.isFinite(size) && size! >= cutoffs.full ? "full_sample" : Number.isFinite(size) && size! >= cutoffs.partial ? "partial_sample" : "projection";
  const reliability = tier === "full_sample" ? 1 : tier === "partial_sample" ? 0.4 : Number.isFinite(size) && size! > 0 ? 0.18 : 0.08;
  return {
    tier,
    confidence: tier === "full_sample" ? "HIGH" : tier === "partial_sample" ? "MEDIUM" : "LOW",
    mode: tier === "full_sample" ? "Observed" : tier === "partial_sample" ? "Blended" : "Projection-based",
    badgeLabel: tier === "full_sample" ? "Stable MLB Data" : tier === "partial_sample" ? "Limited Data" : "Projected",
    reason: tier === "full_sample" ? "Qualified MLB sample with stable major-league data." : tier === "partial_sample" ? "Partial MLB sample is blended with league baseline." : "No meaningful MLB sample yet, so neutral baseline logic is used.",
    note: tier === "full_sample" ? "Advanced metrics receive full weight." : tier === "partial_sample" ? "Small-sample spikes are softened to avoid misleading comparisons." : "Profile stays live, but outputs are conservative and clearly labeled.",
    sampleLabel: type === "pitcher" ? `${fmt(size, 1)} IP` : `${fmt(size, 0)} PA`,
    reliability,
  } as const;
}

function parseIpToOuts(ip: string) {
  const [whole = "0", part = "0"] = ip.split(".");
  return (Number(whole) * 3) + Number(part);
}

async function fetchJson<T>(url: string, bust = false): Promise<T> {
  const key = bust ? `${url}:${Date.now()}` : url;
  if (!bust && jsonCache.has(key)) return jsonCache.get(key) as Promise<T>;
  const request = fetch(url, { cache: "no-store" }).then(async (response) => {
    if (!response.ok) throw new Error(`Request failed ${response.status}: ${url}`);
    return response.json() as Promise<T>;
  });
  if (!bust) jsonCache.set(key, request);
  return request;
}

async function fetchText(url: string, bust = false) {
  const key = bust ? `${url}:${Date.now()}` : url;
  if (!bust && textCache.has(key)) return textCache.get(key)!;
  const request = fetch(url, { cache: "no-store" }).then(async (response) => {
    if (!response.ok) throw new Error(`Request failed ${response.status}: ${url}`);
    return response.text();
  });
  if (!bust) textCache.set(key, request);
  return request;
}

async function fetchTeams() {
  const data = await fetchJson<{ teams: Array<{ id: number; name: string; abbreviation?: string; teamCode?: string }> }>("https://statsapi.mlb.com/api/v1/teams?sportId=1");
  return (data.teams || []).filter((team) => !team.name.includes("All-Stars"));
}

export async function fetchRosterDirectory(): Promise<PlayerSearchItem[]> {
  const cacheKey = "active-roster";
  if (rosterCache.has(cacheKey)) return rosterCache.get(cacheKey)!;
  const request = (async () => {
    const teams = await fetchTeams();
    const teamRosters = await Promise.all(
      teams.map(async (team) => {
        const data = await fetchJson<{ roster: Array<{ person?: { id?: number; fullName?: string; active?: boolean }; position?: { abbreviation?: string; type?: string }; jerseyNumber?: string; status?: { description?: string } }> }>(
          `https://statsapi.mlb.com/api/v1/teams/${team.id}/roster?rosterType=active`,
        );
        return (data.roster || []).map((entry) => ({
          playerId: entry.person?.id || 0,
          fullName: entry.person?.fullName || "Unknown Player",
          team: team.name,
          teamAbbr: team.abbreviation || team.teamCode?.toUpperCase() || TEAM_LOOKUP[team.id] || "MLB",
          teamId: team.id,
          position: entry.position?.abbreviation || "MLB",
          positionType: entry.position?.type || "Active Roster",
          jerseyNumber: entry.jerseyNumber || null,
          active: true,
          status: entry.status?.description || "Active",
          headshotUrl: headshotUrl(entry.person?.id || 0),
        })).filter((player) => player.playerId);
      }),
    );
    return teamRosters.flat().sort((a, b) => a.fullName.localeCompare(b.fullName));
  })();
  rosterCache.set(cacheKey, request);
  return request;
}

export function filterRoster(players: PlayerSearchItem[], query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return [];
  return players
    .map((player) => {
      const haystack = `${player.fullName} ${player.team} ${player.teamAbbr} ${player.position}`.toLowerCase();
      const parts = player.fullName.toLowerCase().split(" ");
      const exactPrefix = player.fullName.toLowerCase().startsWith(normalized) ? 100 : 0;
      const wordPrefix = parts.some((part) => part.startsWith(normalized)) ? 60 : 0;
      const includes = haystack.includes(normalized) ? 30 : 0;
      return { player, score: exactPrefix + wordPrefix + includes };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.player.fullName.localeCompare(b.player.fullName))
    .slice(0, 12)
    .map((item) => item.player);
}

function parseSavantMeta(html: string) {
  const meta = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i)?.[1] || "";
  const pick = (label: string) => num(meta.match(new RegExp(`${label}:\\s*([\\.\\d-]+)`, "i"))?.[1] || null);
  return {
    avgExitVelocity: pick("Avg Exit Velocity"),
    hardHit: pick("Hard Hit %"),
    barrel: pick("Barrel %"),
    wOBA: pick("wOBA"),
    xwOBA: pick("xwOBA"),
  };
}

async function fetchPerson(playerId: number, bust = false) {
  const data = await fetchJson<{ people: MlbPerson[] }>(`https://statsapi.mlb.com/api/v1/people/${playerId}?hydrate=currentTeam`, bust);
  return data.people?.[0] || null;
}

async function fetchSeasonPack(playerId: number, group: "hitting" | "pitching", bust = false) {
  const data = await fetchJson<{ stats: Array<{ type?: { displayName?: string }; splits?: Array<{ stat: Record<string, unknown>; player?: { id?: number }; team?: { id?: number } }> }> }>(
    `https://statsapi.mlb.com/api/v1/people/${playerId}/stats?stats=season,seasonAdvanced&group=${group}&season=${SEASON}`,
    bust,
  );
  const seasonMeta = (data.stats || []).find((item) => item.type?.displayName === "season")?.splits?.[0] || null;
  const advancedMeta = (data.stats || []).find((item) => item.type?.displayName === "seasonAdvanced")?.splits?.[0] || null;
  return { season: seasonMeta?.stat || {}, seasonMeta, advanced: advancedMeta?.stat || {} };
}

async function fetchLogs(playerId: number, group: "hitting" | "pitching", bust = false) {
  const data = await fetchJson<{ stats: Array<{ splits?: Array<Record<string, unknown>> }> }>(
    `https://statsapi.mlb.com/api/v1/people/${playerId}/stats?stats=gameLog&group=${group}&season=${SEASON}`,
    bust,
  );
  return ((data.stats || [])[0] || {}).splits || [];
}

async function fetchSplits(playerId: number, group: "hitting" | "pitching", bust = false) {
  const data = await fetchJson<{ stats: Array<{ splits?: Array<{ split?: { code?: string }; stat?: Record<string, unknown> }> }> }>(
    `https://statsapi.mlb.com/api/v1/people/${playerId}/stats?stats=statSplits&group=${group}&season=${SEASON}&sitCodes=vr,vl,h,a`,
    bust,
  );
  const byCode = new Map((((data.stats || [])[0] || {}).splits || []).map((item) => [item.split?.code, item.stat]));
  return { vsR: byCode.get("vr"), vsL: byCode.get("vl"), home: byCode.get("h"), away: byCode.get("a") };
}

async function fetchWindow(playerId: number, group: "hitting" | "pitching", days: number, bust = false) {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - days + 1);
  const params = new URLSearchParams({
    stats: "byDateRange",
    group,
    season: String(SEASON),
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
  });
  const data = await fetchJson<{ stats: Array<{ splits?: Array<{ stat?: Record<string, unknown> }> }> }>(
    `https://statsapi.mlb.com/api/v1/people/${playerId}/stats?${params.toString()}`,
    bust,
  );
  return (((data.stats || [])[0] || {}).splits || [])[0]?.stat || null;
}

async function fetchTodayGame(teamId: number | null, bust = false) {
  if (!teamId) return null;
  const today = currentMlbDate();
  const data = await fetchJson<{ dates?: Array<{ games?: Array<any> }> }>(`https://statsapi.mlb.com/api/v1/schedule?sportId=1&date=${today}`, bust);
  const games = data.dates?.[0]?.games || [];
  return games.find((game) => game.teams?.home?.team?.id === teamId || game.teams?.away?.team?.id === teamId) || null;
}

function buildValidation(person: MlbPerson, seasonMeta: { player?: { id?: number }; team?: { id?: number } } | null, matches: PlayerSearchItem[]) {
  const messages: ValidationMessage[] = [];
  if (seasonMeta?.player?.id && seasonMeta.player.id !== person.id) messages.push({ level: "error", text: "Source mismatch detected between identity and season stat payload." });
  if (person.currentTeam?.id && seasonMeta?.team?.id && person.currentTeam.id !== seasonMeta.team.id) messages.push({ level: "warn", text: "Current team and season stat team differ. This can happen after a recent transaction." });
  if (matches.filter((item) => item.fullName === person.fullName).length > 1) messages.push({ level: "warn", text: "Multiple active players share this name. Profile is pinned to the explicit MLB player ID." });
  if (!messages.length) messages.push({ level: "ok", text: "Player ID, team mapping, and season stat payload alignment passed validation." });
  return messages;
}

function buildGameLogs(type: "hitter" | "pitcher", logs: Array<any>): GameLogEntry[] {
  return [...logs].sort((a, b) => String(b.date || "").localeCompare(String(a.date || ""))).map((log) => {
    const stat = log.stat || {};
    return {
      date: log.date || "",
      opponent: log.opponent?.name || "Unavailable",
      isHome: Boolean(log.isHome),
      result: `${log.isHome ? "vs" : "@"} ${log.opponent?.name || "Opponent"}`,
      statLine: type === "pitcher"
        ? `${stat.inningsPitched || "0.0"} IP, ${stat.earnedRuns ?? "0"} ER, ${stat.strikeOuts ?? "0"} K, ${stat.baseOnBalls ?? "0"} BB`
        : `${stat.atBats ?? "0"} AB, ${stat.hits ?? "0"} H, ${stat.homeRuns ?? "0"} HR, ${stat.rbi ?? "0"} RBI`,
      impact: type === "pitcher" ? fmt(stat.gameScore) : fmt(stat.ops),
      raw: stat,
    };
  });
}

function computeGameWoba(stat: Record<string, unknown>) {
  const doubles = Number(stat.doubles || 0);
  const triples = Number(stat.triples || 0);
  const homeRuns = Number(stat.homeRuns || 0);
  const hits = Number(stat.hits || 0);
  const singles = Math.max(0, hits - doubles - triples - homeRuns);
  const ubb = Math.max(0, Number(stat.baseOnBalls || 0) - Number(stat.intentionalWalks || 0));
  const hbp = Number(stat.hitByPitch || 0);
  const ab = Number(stat.atBats || 0);
  const sf = Number(stat.sacFlies || 0);
  const denominator = ab + ubb + hbp + sf;
  if (!denominator) return null;
  const numerator =
    (ubb * WOBA_WEIGHTS.unintentionalBb) +
    (hbp * WOBA_WEIGHTS.hbp) +
    (singles * WOBA_WEIGHTS.single) +
    (doubles * WOBA_WEIGHTS.double) +
    (triples * WOBA_WEIGHTS.triple) +
    (homeRuns * WOBA_WEIGHTS.homeRun);
  return numerator / denominator;
}

function buildArchetype(type: "hitter" | "pitcher", season: Record<string, unknown>, advanced: Record<string, unknown>, savant: Record<string, unknown>) {
  if (type === "pitcher") {
    const whiff = num(advanced.whiffPercentage) ? (num(advanced.whiffPercentage)! * 100) : num(savant.whiffPct);
    const bb9 = num(season.walksPer9Inn);
    const velo = num(savant.avgVelo);
    if (Number.isFinite(whiff) && whiff! > 30 && Number.isFinite(velo) && velo! >= 95) return "Power Whiff Starter";
    if (Number.isFinite(bb9) && bb9! <= 2) return "Command-Driven Starter";
    if (Number.isFinite(whiff) && whiff! > 27) return "Bat-Missing Starter";
    return "Contact Management Arm";
  }
  const obp = num(season.obp);
  const iso = num(advanced.iso);
  const kRate = num(advanced.strikeoutsPerPlateAppearance) ? num(advanced.strikeoutsPerPlateAppearance)! * 100 : null;
  const bbRate = num(advanced.walksPerPlateAppearance) ? num(advanced.walksPerPlateAppearance)! * 100 : null;
  const hardHit = num(savant.hardHit);
  if (Number.isFinite(iso) && iso! >= 0.23 && Number.isFinite(kRate) && kRate! >= 27 && Number.isFinite(bbRate) && bbRate! >= 10) return "Three True Outcomes";
  if (Number.isFinite(iso) && iso! >= 0.22 && Number.isFinite(hardHit) && hardHit! >= 45) return "Power-Driven Slugger";
  if (Number.isFinite(obp) && obp! >= 0.36 && Number.isFinite(kRate) && kRate! <= 20) return "High OBP Contact Bat";
  if (Number.isFinite(bbRate) && bbRate! >= 12) return "Patient On-Base Bat";
  if (Number.isFinite(kRate) && kRate! <= 18) return "Bat-to-Ball Contact Bat";
  return "Volatile Power Bat";
}

function buildConfidenceEngine(type: "hitter" | "pitcher", sample: PlayerProfile["sample"], logs: Array<any>) {
  const recent = logs.slice(0, 10);
  const varianceSource = recent.map((log) => {
    const stat = log.stat || {};
    return type === "pitcher" ? num(stat.era) : computeGameWoba(stat);
  });
  const variance = stdev(varianceSource);
  const variancePenalty = Number.isFinite(variance) ? clamp(variance! * (type === "pitcher" ? 8 : 40), 0, 30) : 18;
  const stabilityBoost = Math.round(sample.reliability * 55);
  const sampleBoost = sample.tier === "full_sample" ? 30 : sample.tier === "partial_sample" ? 14 : 4;
  const percent = Math.round(clamp(stabilityBoost + sampleBoost - variancePenalty, 8, 99));
  const label: PlayerProfile["confidenceEngine"]["label"] = percent < 45 ? "Unstable Sample" : percent < 72 ? "Stabilizing" : "Reliable";
  return {
    percent,
    label,
    explanation: `${sample.sampleLabel} of MLB data, rolling variance ${variance === null ? "unavailable" : variance.toFixed(3)}, and ${sample.tier.replace("_", " ")} weighting combine into this confidence score.`,
  };
}

async function fetchRecentPitchContext(playerId: number, type: "hitter" | "pitcher", logs: Array<any>, bust = false) {
  const recentLogs = logs.slice(0, 10);
  const gamePks = recentLogs.map((log) => log.game?.gamePk).filter(Boolean);
  const feeds = await Promise.all(gamePks.map((gamePk) => fetchJson<any>(`https://statsapi.mlb.com/api/v1.1/game/${gamePk}/feed/live`, bust).catch(() => null)));
  const trend = recentLogs.map((log) => ({
    label: safeDateLabel(log.date),
    woba: computeGameWoba(log.stat || {}),
    hardHit: null as number | null,
    kRate: null as number | null,
  }));
  const gameMap = new Map(recentLogs.map((log, index) => [String(log.game?.gamePk || index), trend[index]]));
  const zoneBuckets = new Map<string, { pitches: number; swings: number; whiffs: number; damageTotal: number; damageCount: number }>();
  const ensureZone = (zone: string) => {
    if (!zoneBuckets.has(zone)) zoneBuckets.set(zone, { pitches: 0, swings: 0, whiffs: 0, damageTotal: 0, damageCount: 0 });
    return zoneBuckets.get(zone)!;
  };

  feeds.forEach((feed, feedIndex) => {
    const gamePk = String(recentLogs[feedIndex]?.game?.gamePk || feedIndex);
    let hardHitCount = 0;
    let bbeCount = 0;
    let plateAppearances = 0;
    let strikeouts = 0;
    (feed?.liveData?.plays?.allPlays || []).forEach((play: any) => {
      const matches = type === "pitcher" ? play.matchup?.pitcher?.id === playerId : play.matchup?.batter?.id === playerId;
      if (!matches) return;
      plateAppearances += 1;
      const resultType = play.result?.eventType || "";
      if (resultType === "strikeout" || resultType === "strikeout_double_play") strikeouts += 1;
      const playEvents = play.playEvents || [];
      playEvents.forEach((event: any) => {
        if (!event.isPitch || !event.pitchData) return;
        const zoneNumber = Number(event.pitchData.zone || 0);
        const zone = zoneNumber >= 1 && zoneNumber <= 9 ? String(zoneNumber) : "Shadow";
        const bucket = ensureZone(zone);
        bucket.pitches += 1;
        const description = String(event.details?.description || event.details?.call?.description || "").toLowerCase();
        const isSwing = description.includes("swing") || description.includes("foul") || description.includes("in play");
        const isWhiff = description.includes("swinging strike");
        if (isSwing) bucket.swings += 1;
        if (isWhiff) bucket.whiffs += 1;
        const hitData = event.hitData;
        if (Number.isFinite(hitData?.launchSpeed)) {
          bbeCount += 1;
          if (hitData.launchSpeed >= 95) hardHitCount += 1;
        }
      });
      const lastEvent = playEvents[playEvents.length - 1];
      const totalBases =
        resultType === "single" ? 1 :
        resultType === "double" ? 2 :
        resultType === "triple" ? 3 :
        resultType === "home_run" ? 4 : 0;
      const zoneNumber = Number(lastEvent?.pitchData?.zone || 0);
      const zone = zoneNumber >= 1 && zoneNumber <= 9 ? String(zoneNumber) : "Shadow";
      if (totalBases > 0) {
        const bucket = ensureZone(zone);
        bucket.damageTotal += totalBases;
        bucket.damageCount += 1;
      }
    });
    const point = gameMap.get(gamePk);
    if (point) {
      point.hardHit = bbeCount ? (hardHitCount / bbeCount) * 100 : null;
      point.kRate = plateAppearances ? (strikeouts / plateAppearances) * 100 : null;
    }
  });

  const cells = ["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((label) => {
    const bucket = ensureZone(label);
    return {
      label,
      swingPct: bucket.pitches ? (bucket.swings / bucket.pitches) * 100 : null,
      whiffPct: bucket.swings ? (bucket.whiffs / bucket.swings) * 100 : null,
      damage: bucket.damageCount ? (bucket.damageTotal / bucket.damageCount) : null,
    };
  });

  return {
    trend,
    zone: {
      sampleLabel: `${recentLogs.length} recent MLB games`,
      cells,
    },
  };
}

function buildExpectedActual(type: "hitter" | "pitcher", season: Record<string, unknown>, savant: Record<string, unknown>) {
  return type === "pitcher"
    ? [
      { label: "ERA", expected: num(savant.xERA), actual: num(season.era), delta: delta(num(season.era), num(savant.xERA)) },
      { label: "wOBAA", expected: num(savant.xwOBA), actual: num(savant.wOBA), delta: delta(num(savant.wOBA), num(savant.xwOBA)) },
      { label: "BAA", expected: num(savant.xBA), actual: num(season.avg), delta: delta(num(season.avg), num(savant.xBA)) },
    ]
    : [
      { label: "BA", expected: num(savant.xBA), actual: num(season.avg), delta: delta(num(season.avg), num(savant.xBA)) },
      { label: "SLG", expected: num(savant.xSLG), actual: num(season.slg), delta: delta(num(season.slg), num(savant.xSLG)) },
      { label: "wOBA", expected: num(savant.xwOBA), actual: num(savant.wOBA), delta: delta(num(savant.wOBA), num(savant.xwOBA)) },
    ];
}

function delta(actual: number | null, expected: number | null) {
  return Number.isFinite(actual) && Number.isFinite(expected) ? (actual! - expected!) : null;
}

function buildDecisionInsight(type: "hitter" | "pitcher", season: Record<string, unknown>, advanced: Record<string, unknown>, savant: Record<string, unknown>) {
  if (type === "pitcher") {
    const eraGap = delta(num(season.era), num(savant.xERA));
    const whiff = num(advanced.whiffPercentage) ? num(advanced.whiffPercentage)! * 100 : null;
    const bb9 = num(season.walksPer9Inn);
    if (Number.isFinite(eraGap) && eraGap! < -0.5) return "Run prevention is beating expected indicators, which can regress if contact quality catches up.";
    if (Number.isFinite(eraGap) && eraGap! > 0.5) return "Expected run prevention is better than results, making this a possible rebound arm if command holds.";
    if (Number.isFinite(whiff) && whiff! > 30) return "Bat-missing ability is carrying the profile and gives this arm real swing-and-miss margin.";
    if (Number.isFinite(bb9) && bb9! > 3.5) return "The shape is playable, but walk pressure is putting too many innings under stress.";
    return "The profile looks playable, but results depend on whether the current command baseline holds.";
  }
  const wobaGap = delta(num(savant.wOBA), num(savant.xwOBA));
  const hardHit = num(savant.hardHit);
  const hr = num(season.homeRuns);
  const games = num(season.gamesPlayed);
  const hrPerGame = Number.isFinite(hr) && Number.isFinite(games) && games ? hr! / games! : null;
  const kRate = num(advanced.strikeoutsPerPlateAppearance) ? num(advanced.strikeoutsPerPlateAppearance)! * 100 : null;
  if (Number.isFinite(wobaGap) && wobaGap! > 0.030) return "Results are outrunning expected contact quality, so some offensive pullback risk remains.";
  if (Number.isFinite(wobaGap) && wobaGap! < -0.030 && Number.isFinite(hardHit) && hardHit! >= 42) return "Quality of contact is better than the results line, making this a buy-low offensive profile.";
  if (Number.isFinite(hrPerGame) && hrPerGame! >= 0.3 && Number.isFinite(hardHit) && hardHit! >= 45) return "Impact contact is driving real slug, not just noise, because the damage profile supports the home run pace.";
  if (Number.isFinite(kRate) && kRate! >= 30) return "The power remains dangerous, but the strikeout rate is creating volatility against better pitch sequences.";
  return "The offensive profile is stable enough to trust, but the edge depends on whether contact quality continues to hold.";
}

async function fetchPitchMix(playerId: number, logs: Array<any>, bust = false) {
  const gamePks = logs.slice(0, 3).map((log) => log.game?.gamePk).filter(Boolean);
  if (!gamePks.length) return [];
  const feeds = await Promise.all(gamePks.map((gamePk) => fetchJson<any>(`https://statsapi.mlb.com/api/v1.1/game/${gamePk}/feed/live`, bust).catch(() => null)));
  const buckets = new Map<string, { count: number; velo: number[]; h: number[]; v: number[] }>();
  feeds.forEach((feed) => {
    (feed?.liveData?.plays?.allPlays || []).forEach((play: any) => {
      if (play.matchup?.pitcher?.id !== playerId) return;
      (play.playEvents || []).forEach((event: any) => {
        if (!event.isPitch || !event.pitchData) return;
        const key = event.details?.type?.description || event.details?.type?.code || "Unknown";
        if (!buckets.has(key)) buckets.set(key, { count: 0, velo: [], h: [], v: [] });
        const bucket = buckets.get(key)!;
        bucket.count += 1;
        if (Number.isFinite(event.pitchData.startSpeed)) bucket.velo.push(event.pitchData.startSpeed);
        if (Number.isFinite(event.pitchData.breaks?.breakHorizontal)) bucket.h.push(event.pitchData.breaks.breakHorizontal);
        if (Number.isFinite(event.pitchData.breaks?.breakVertical)) bucket.v.push(event.pitchData.breaks.breakVertical);
      });
    });
  });
  const total = [...buckets.values()].reduce((sum, bucket) => sum + bucket.count, 0);
  return [...buckets.entries()].map(([pitchType, bucket]) => ({
    pitchType,
    usage: pct(total ? (bucket.count / total) * 100 : null),
    avgVelo: bucket.velo.length ? fmt(bucket.velo.reduce((sum, value) => sum + value, 0) / bucket.velo.length, 1) : "Unavailable",
    hMov: bucket.h.length ? fmt(bucket.h.reduce((sum, value) => sum + value, 0) / bucket.h.length, 1) : "Unavailable",
    vMov: bucket.v.length ? fmt(bucket.v.reduce((sum, value) => sum + value, 0) / bucket.v.length, 1) : "Unavailable",
  })).sort((a, b) => Number(b.usage.replace("%", "")) - Number(a.usage.replace("%", "")));
}

function normalizePitchResult(event: Record<string, unknown>): Pitch["result"] {
  const pitchCall = String(event.pitch_call || "").toLowerCase();
  const result = String(event.result || event.events || "").toLowerCase();
  const description = String(event.description || event.des || "").toLowerCase();
  if (result.includes("home run") || result.includes("home_run")) return "home_run";
  if (["single", "double", "triple"].includes(result)) return "hit";
  if (pitchCall === "foul") return "foul";
  if (pitchCall === "called_strike") return "called_strike";
  if (pitchCall === "swinging_strike" || pitchCall === "swinging_strike_blocked" || description.includes("swinging strike")) return "swinging_strike";
  if (pitchCall.includes("ball") || description.includes("ball")) return "ball";
  if (pitchCall === "in_play" || description.includes("in play") || result.includes("field_out") || result.includes("force_out")) return "in_play";
  return "in_play";
}

function mapGamefeedPitch(row: Record<string, unknown>): Pitch {
  const plateX = num(row.plate_x) ?? num(row.px) ?? 0;
  const zoneTop = num(row.sz_top) ?? 3.5;
  const zoneBottom = num(row.sz_bot) ?? 1.5;
  const plateZ = num(row.plate_z) ?? num(row.pz) ?? ((zoneTop + zoneBottom) / 2);
  const shadowTop = zoneTop + 0.7;
  const shadowBottom = zoneBottom - 0.7;
  const verticalSpan = Math.max(0.75, shadowTop - shadowBottom);
  const x = Math.max(-1, Math.min(1, plateX / 1.4));
  const y = Math.max(0, Math.min(1, (plateZ - shadowBottom) / verticalSpan));

  return {
    x,
    y,
    pitchType: String(row.pitch_type || row.pitch_name || "UNK"),
    result: normalizePitchResult(row),
    velocity: num(row.start_speed) ?? undefined,
    inning: num(row.inning) ?? undefined,
    timestamp: typeof row.game_date === "string" ? `${row.game_date}#${String(row.cap_index || row.pitch_number || "")}` : undefined,
    batterSide: typeof row.stand === "string" ? row.stand : undefined,
    pitcherHand: typeof row.p_throws === "string" ? row.p_throws : undefined,
    count: typeof row.balls_and_strikes === "string" ? row.balls_and_strikes : undefined,
    description: typeof row.description === "string" ? row.description : typeof row.des === "string" ? row.des : undefined,
    gamePk: num(row.game_pk) ?? undefined,
    gameDate: typeof row.game_date === "string" ? row.game_date : undefined,
    opponent: typeof row.team_fielding === "string" ? row.team_fielding : undefined,
    abNumber: num(row.ab_number) ?? undefined,
    launchSpeed: num(row.launch_speed) ?? num(row.hit_speed) ?? undefined,
    launchAngle: num(row.launch_angle) ?? undefined,
    xba: num(row.xba) ?? undefined,
    isBarrel: row.is_barrel === 1 || row.is_barrel === "1",
    isInZone: typeof row.isInZone === "boolean" ? row.isInZone : typeof row.savantIsInZone === "boolean" ? row.savantIsInZone : undefined,
  };
}

export async function fetchPlayerPitchData(playerId: number, bust = false): Promise<Pitch[]> {
  const person = await fetchPerson(playerId, bust);
  if (!person || person.primaryPosition?.type === "Pitcher") return [];

  const logs = await fetchLogs(playerId, "hitting", bust);
  const gamePks = [...new Set(logs.map((log) => Number((log as any).game?.gamePk)).filter(Number.isFinite))] as number[];
  if (!gamePks.length) return [];

  const feeds = await Promise.all(
    gamePks.map((gamePk) =>
      fetchJson<any>(`https://baseballsavant.mlb.com/gf?game_pk=${gamePk}`, bust).catch(() => null),
    ),
  );

  const pitches = feeds.flatMap((feed) => {
    const rows = [...(feed?.team_home || []), ...(feed?.team_away || [])];
    return rows
      .filter((row) => row?.type === "pitch" && Number(row?.batter) === playerId)
      .map((row) => mapGamefeedPitch(row));
  });

  return pitches.sort((a, b) => String(a.timestamp || "").localeCompare(String(b.timestamp || "")));
}

export async function fetchPlayerProfile(playerId: number, bust = false): Promise<PlayerProfile> {
  const person = await fetchPerson(playerId, bust);
  if (!person) throw new Error("Player not found");
  const type: "hitter" | "pitcher" = person.primaryPosition?.type === "Pitcher" ? "pitcher" : "hitter";
  const group = type === "pitcher" ? "pitching" : "hitting";
  const [seasonPack, logs, splits, last7, last15, last30, savant, game, roster] = await Promise.all([
    fetchSeasonPack(playerId, group, bust),
    fetchLogs(playerId, group, bust),
    fetchSplits(playerId, group, bust),
    fetchWindow(playerId, group, 7, bust).catch(() => null),
    fetchWindow(playerId, group, 15, bust).catch(() => null),
    fetchWindow(playerId, group, 30, bust).catch(() => null),
    person.nameSlug ? fetchText(`https://baseballsavant.mlb.com/savant-player/${person.nameSlug}`, bust).then(parseSavantMeta).catch(() => ({})) : Promise.resolve({}),
    fetchTodayGame(person.currentTeam?.id || null, bust),
    fetchRosterDirectory().catch(() => []),
  ]);

  const sample = sampleProfile(type, seasonPack.season);
  const recentPitching = type === "pitcher" ? recentPitcherSummary(logs) : null;
  const recentHitting = type === "hitter" ? recentHitterSummary(logs) : null;
  const rawScore = type === "pitcher"
    ? Math.round(clamp(weighted([
      { weight: 0.3, score: scale(blend(num(seasonPack.season.era), 4.1, sample.reliability), 2.2, 5.8, true) },
      { weight: 0.22, score: scale(blend(first(num(seasonPack.season.strikeoutWalkRatio), num(seasonPack.advanced.strikesoutsToWalks)), 2.6, sample.reliability), 1.2, 6.2) },
      { weight: 0.16, score: scale(blend(num((savant as any).xERA), 4.05, sample.reliability), 2.2, 5.8, true) },
      { weight: 0.16, score: scale(blend(num(seasonPack.advanced.whiffPercentage) ? num(seasonPack.advanced.whiffPercentage)! * 100 : null, 24, sample.reliability), 18, 38) },
      { weight: 0.16, score: scale(blend(recentPitching?.era ?? null, 4.1, sample.reliability), 2.2, 5.8, true) },
    ]) || 50))
    : Math.round(clamp(weighted([
      { weight: 0.28, score: scale(blend(num(seasonPack.season.obp), 0.315, sample.reliability), 0.27, 0.45) },
      { weight: 0.22, score: scale(blend(num(seasonPack.season.ops), 0.72, sample.reliability), 0.6, 1.1) },
      { weight: 0.2, score: scale(blend(num((savant as any).xwOBA), 0.32, sample.reliability), 0.28, 0.43) },
      { weight: 0.14, score: scale(blend(num((savant as any).hardHit), 38, sample.reliability), 28, 56) },
      { weight: 0.08, score: scale(blend(num(seasonPack.advanced.strikeoutsPerPlateAppearance) ? num(seasonPack.advanced.strikeoutsPerPlateAppearance)! * 100 : null, 22, sample.reliability), 10, 34, true) },
      { weight: 0.08, score: scale(blend(recentHitting?.ops ?? null, 0.72, sample.reliability), 0.6, 1.1) },
    ]) || 50));
  const score = rawScore;
  const comparisonScore = Math.round(clamp(50 + ((rawScore - 50) * (0.30 + (sample.reliability * 0.70)))));
  const trend = score >= 67 ? "HOT" : score <= 45 ? "COLD" : "NEUTRAL";

  const sortedLogs = [...logs].sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));
  const recentGames = buildGameLogs(type, sortedLogs.slice(0, Math.min(10, sortedLogs.length)));
  const allGames = buildGameLogs(type, sortedLogs);
  const feed = game?.gamePk ? await fetchJson<any>(`https://statsapi.mlb.com/api/v1.1/game/${game.gamePk}/feed/live`, bust).catch(() => null) : null;
  const liveState = classifyGameState(feed?.gameData?.status?.detailedState || game?.status?.detailedState || null);
  const pitchContext = await fetchRecentPitchContext(person.id, type, logs, bust).catch(() => ({
    trend: logs.slice(0, 10).map((log: any) => ({
      label: safeDateLabel(log.date),
      woba: computeGameWoba(log.stat || {}),
      hardHit: null,
      kRate: type === "hitter" && Number(log.stat?.plateAppearances) ? (Number(log.stat?.strikeOuts || 0) / Number(log.stat?.plateAppearances || 1)) * 100 : null,
    })),
    zone: {
      sampleLabel: `${Math.min(logs.length, 10)} recent MLB games`,
      cells: ["1","2","3","4","5","6","7","8","9"].map((label) => ({ label, swingPct: null, whiffPct: null, damage: null })),
    },
  }));
  const playerKey = `ID${person.id}`;
  const statBlock = type === "pitcher"
    ? feed?.liveData?.boxscore?.teams?.home?.players?.[playerKey]?.stats?.pitching || feed?.liveData?.boxscore?.teams?.away?.players?.[playerKey]?.stats?.pitching || {}
    : feed?.liveData?.boxscore?.teams?.home?.players?.[playerKey]?.stats?.batting || feed?.liveData?.boxscore?.teams?.away?.players?.[playerKey]?.stats?.batting || {};
  const battingOrder = feed?.liveData?.boxscore?.teams?.home?.players?.[playerKey]?.battingOrder || feed?.liveData?.boxscore?.teams?.away?.players?.[playerKey]?.battingOrder || null;
  const liveLine = type === "pitcher"
    ? [["IP", fmt(statBlock.inningsPitched)], ["ER", fmt(statBlock.earnedRuns)], ["K", fmt(statBlock.strikeOuts)], ["BB", fmt(statBlock.baseOnBalls)]]
    : [["AB", fmt(statBlock.atBats)], ["H", fmt(statBlock.hits)], ["R", fmt(statBlock.runs)], ["RBI", fmt(statBlock.rbi)]];
  const inning = feed?.liveData?.linescore?.currentInningOrdinal && feed?.liveData?.linescore?.inningHalf
    ? `${feed.liveData.linescore.inningHalf} ${feed.liveData.linescore.currentInningOrdinal}`
    : null;

  const standardStats: Array<[string, string]> = type === "pitcher"
    ? [
      ["GS", fmt(seasonPack.season.gamesStarted)], ["G", fmt(seasonPack.season.gamesPlayed)], ["IP", fmt(seasonPack.season.inningsPitched)],
      ["ERA", fmt(seasonPack.season.era)], ["WHIP", fmt(seasonPack.season.whip)], ["H", fmt(seasonPack.season.hits)],
      ["ER", fmt(seasonPack.season.earnedRuns)], ["HR", fmt(seasonPack.season.homeRuns)], ["BB", fmt(seasonPack.season.baseOnBalls)],
      ["SO", fmt(seasonPack.season.strikeOuts)], ["K/9", fmt(seasonPack.season.strikeoutsPer9Inn)], ["BB/9", fmt(seasonPack.season.walksPer9Inn)],
      ["HR/9", fmt(seasonPack.season.homeRunsPer9)], ["K/BB", fmt(seasonPack.season.strikeoutWalkRatio)],
    ]
    : [
      ["G", fmt(seasonPack.season.gamesPlayed)], ["PA", fmt(seasonPack.season.plateAppearances)], ["AB", fmt(seasonPack.season.atBats)],
      ["R", fmt(seasonPack.season.runs)], ["H", fmt(seasonPack.season.hits)],
      ["1B", singles(seasonPack.season)], ["2B", fmt(seasonPack.season.doubles)], ["3B", fmt(seasonPack.season.triples)],
      ["HR", fmt(seasonPack.season.homeRuns)], ["RBI", fmt(seasonPack.season.rbi)], ["BB", fmt(seasonPack.season.baseOnBalls)],
      ["IBB", fmt(seasonPack.season.intentionalWalks)], ["SO", fmt(seasonPack.season.strikeOuts)], ["HBP", fmt(seasonPack.season.hitByPitch)],
      ["SB", fmt(seasonPack.season.stolenBases)], ["CS", fmt(seasonPack.season.caughtStealing)], ["AVG", fmt(seasonPack.season.avg)],
      ["OBP", fmt(seasonPack.season.obp)], ["SLG", fmt(seasonPack.season.slg)], ["OPS", fmt(seasonPack.season.ops)],
    ];

  const advancedStats: Array<[string, string]> = type === "pitcher"
    ? [
      ["FIP", fmt(seasonPack.advanced.fip)], ["xFIP", fmt((savant as any).xFIP)], ["ERA+", fmt(seasonPack.season.eraPlus)], ["WAR", fmt((savant as any).war)],
      ["xERA", fmt((savant as any).xERA)], ["xBA Allowed", fmt((savant as any).xBA)], ["xwOBA Allowed", fmt((savant as any).xwOBA)],
      ["Whiff%", num(seasonPack.advanced.whiffPercentage) ? pct(num(seasonPack.advanced.whiffPercentage)! * 100) : "Unavailable"],
      ["Chase%", pct((savant as any).chasePct)], ["CSW%", pct((savant as any).cswPct)], ["Avg Velo", fmt((savant as any).avgVelo)],
    ]
    : [
      ["OPS+", fmt(seasonPack.season.opsPlus)], ["ISO", fmt(seasonPack.advanced.iso)], ["BABIP", fmt(seasonPack.season.babip || seasonPack.advanced.babip)], ["wOBA", fmt((savant as any).wOBA)],
      ["wRC+", fmt((savant as any).wRCPlus)], ["WAR", fmt((savant as any).war)], ["xBA", fmt((savant as any).xBA)], ["xSLG", fmt((savant as any).xSLG)],
      ["xwOBA", fmt((savant as any).xwOBA)], ["Barrel%", pct((savant as any).barrel)], ["HardHit%", pct((savant as any).hardHit)], ["Exit Velo", fmt((savant as any).avgExitVelocity)],
      ["Chase%", pct((savant as any).chasePct)], ["Whiff%", pct((savant as any).whiffPct)],
      ["K%", num(seasonPack.advanced.strikeoutsPerPlateAppearance) ? pct(num(seasonPack.advanced.strikeoutsPerPlateAppearance)! * 100) : "Unavailable"],
      ["BB%", num(seasonPack.advanced.walksPerPlateAppearance) ? pct(num(seasonPack.advanced.walksPerPlateAppearance)! * 100) : "Unavailable"],
    ];

  const splitStats: Array<[string, string]> = type === "pitcher"
    ? [
      ["vs RHB", splits.vsR ? `ERA ${fmt((splits.vsR as any).era)} · WHIP ${fmt((splits.vsR as any).whip)}` : "Unavailable"],
      ["vs LHB", splits.vsL ? `ERA ${fmt((splits.vsL as any).era)} · WHIP ${fmt((splits.vsL as any).whip)}` : "Unavailable"],
      ["Home", splits.home ? `ERA ${fmt((splits.home as any).era)} · K ${fmt((splits.home as any).strikeOuts)}` : "Unavailable"],
      ["Away", splits.away ? `ERA ${fmt((splits.away as any).era)} · K ${fmt((splits.away as any).strikeOuts)}` : "Unavailable"],
    ]
    : [
      ["vs RHP", splits.vsR ? `OPS ${fmt((splits.vsR as any).ops)} · AVG ${fmt((splits.vsR as any).avg)}` : "Unavailable"],
      ["vs LHP", splits.vsL ? `OPS ${fmt((splits.vsL as any).ops)} · AVG ${fmt((splits.vsL as any).avg)}` : "Unavailable"],
      ["Home", splits.home ? `OPS ${fmt((splits.home as any).ops)} · HR ${fmt((splits.home as any).homeRuns)}` : "Unavailable"],
      ["Away", splits.away ? `OPS ${fmt((splits.away as any).ops)} · HR ${fmt((splits.away as any).homeRuns)}` : "Unavailable"],
    ];

  const windows: Array<[string, string]> = [
    ["Last 7", fmt(type === "pitcher" ? last7?.era || last7?.inningsPitched : last7?.ops || last7?.obp)],
    ["Last 15", fmt(type === "pitcher" ? last15?.era || last15?.inningsPitched : last15?.ops || last15?.obp)],
    ["Last 30", fmt(type === "pitcher" ? last30?.era || last30?.inningsPitched : last30?.ops || last30?.obp)],
  ];

  return {
    identity: {
      playerId: person.id,
      fullName: person.fullName,
      team: person.currentTeam?.name || "Free Agent / Unavailable",
      teamId: person.currentTeam?.id || null,
      jerseyNumber: person.primaryNumber || null,
      position: person.primaryPosition?.abbreviation || "N/A",
      bats: person.batSide?.code || null,
      throws: person.pitchHand?.code || null,
      height: person.height || null,
      weight: person.weight || null,
      age: person.currentAge || null,
      battingOrder: battingOrder ? String(battingOrder).slice(0, 1) : null,
      debutDate: person.mlbDebutDate || null,
      status: person.active ? "Active" : "Inactive",
      headshotUrl: headshotUrl(person.id),
      country: normalizeCountry(person.birthCountry),
      nationalTeam: nationalTeamLabel(person.birthCountry),
    },
    type,
    sample,
    archetype: buildArchetype(type, seasonPack.season, seasonPack.advanced, savant),
    confidence: {
      score,
      comparisonScore,
      trend,
      dataConfidence: sample.confidence,
      insight: sample.tier === "projection" ? "This profile is projection-based because the MLB sample is not stable yet." : sample.tier === "partial_sample" ? "This profile blends current MLB production with league baseline to reduce noise." : "This profile is driven by stable MLB production and current expected indicators.",
    },
    confidenceEngine: buildConfidenceEngine(type, sample, logs),
    trendData: pitchContext.trend,
    zoneIntelligence: pitchContext.zone,
    expectedActual: buildExpectedActual(type, seasonPack.season, savant),
    decisionInsight: buildDecisionInsight(type, seasonPack.season, seasonPack.advanced, savant),
    sources: {
      identity: "MLB Stats API",
      season: "MLB Stats API",
      logs: "MLB Stats API",
      splits: "MLB Stats API",
      statcast: Object.keys(savant).length ? "Baseball Savant" : "Not provided by source",
      live: "MLB Stats API",
    },
    validation: buildValidation(person, seasonPack.seasonMeta, roster.filter((item) => item.fullName === person.fullName)),
    standardStats,
    advancedStats,
    splits: splitStats,
    windows,
    recentFormSummary: recentPitching?.summary || recentHitting?.summary || "No MLB game logs available.",
    recentGames,
    allGames,
    liveGame: {
      state: liveState,
      status: feed?.gameData?.status?.detailedState || game?.status?.detailedState || "No game scheduled today",
      opponent: game ? ((game.teams?.home?.team?.id === person.currentTeam?.id) ? game.teams?.away?.team?.name : game.teams?.home?.team?.name) : "Unavailable",
      line: liveLine.map(([label, value]) => [label, value]),
      note: liveState === "LIVE" ? "Live stat line refreshes every 10-15 seconds." : liveState === "FINAL" ? "Final line from today's completed game." : liveState === "UPCOMING" ? "Upcoming today. Live line appears when the game starts." : "No game today. Rolling history remains active.",
      inning,
      isToday: Boolean(game),
      updatedAt: new Date().toISOString(),
    },
    pitchMix: type === "pitcher" ? await fetchPitchMix(playerId, logs, bust) : [],
    fetchedAt: new Date().toISOString(),
  };
}

function singles(season: Record<string, unknown>) {
  const hits = num(season.hits);
  const doubles = num(season.doubles);
  const triples = num(season.triples);
  const homeRuns = num(season.homeRuns);
  return [hits, doubles, triples, homeRuns].every(Number.isFinite) ? fmt(hits! - doubles! - triples! - homeRuns!) : "Unavailable";
}

function recentHitterSummary(logs: Array<any>): { summary: string; ops: number | null } {
  const sortedLogs = [...logs].sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));
  const sample = sortedLogs.length < 5 ? sortedLogs.slice(0) : sortedLogs.slice(0, 7);
  if (!sample.length) return { summary: "No MLB game logs available.", ops: null };
  const totals = sample.reduce((acc, log) => {
    const stat = log.stat || {};
    acc.ab += Number(stat.atBats || 0);
    acc.h += Number(stat.hits || 0);
    acc.bb += Number(stat.baseOnBalls || 0);
    acc.hbp += Number(stat.hitByPitch || 0);
    acc.sf += Number(stat.sacFlies || 0);
    acc.tb += Number(stat.totalBases || 0);
    acc.pa += Number(stat.plateAppearances || 0);
    acc.k += Number(stat.strikeOuts || 0);
    return acc;
  }, { ab: 0, h: 0, bb: 0, hbp: 0, sf: 0, tb: 0, pa: 0, k: 0 });
  const obpDen = totals.ab + totals.bb + totals.hbp + totals.sf;
  const obp = obpDen ? (totals.h + totals.bb + totals.hbp) / obpDen : null;
  const slg = totals.ab ? totals.tb / totals.ab : null;
  return { summary: `${totals.h}-${totals.ab}, ${totals.bb} BB, ${totals.k} K over ${sample.length} games`, ops: obp !== null && slg !== null ? obp + slg : null };
}

function recentPitcherSummary(logs: Array<any>): { summary: string; era: number | null } {
  const sortedLogs = [...logs].sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));
  const sample = sortedLogs.length < 5 ? sortedLogs.slice(0) : sortedLogs.slice(0, 5);
  if (!sample.length) return { summary: "No MLB game logs available.", era: null };
  const totals = sample.reduce((acc, log) => {
    const stat = log.stat || {};
    acc.outs += parseIpToOuts(String(stat.inningsPitched || "0.0"));
    acc.er += Number(stat.earnedRuns || 0);
    acc.k += Number(stat.strikeOuts || 0);
    acc.bb += Number(stat.baseOnBalls || 0);
    return acc;
  }, { outs: 0, er: 0, k: 0, bb: 0 });
  const innings = totals.outs / 3;
  return { summary: `${fmt(innings, 1)} IP, ${totals.k} K, ${totals.bb} BB over ${sample.length} appearances`, era: innings ? ((totals.er * 9) / innings) : null };
}

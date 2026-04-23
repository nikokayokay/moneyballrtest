import { applyMovementState, rememberMiLBAssignments } from "./milb-movement";
import { normalizeMiLBLevel, reconcilePlayer } from "./milb-reconciler";
import type { MiLBAffiliate, MiLBOrganizationPipeline, MiLBPlayer, MiLBValidationReport } from "./milb-types";

const MLB_API = "https://statsapi.mlb.com/api/v1";
const CACHE_TTL = 5 * 60_000;
const LEVEL_SPORT_IDS = new Set([11, 12, 13, 14]);

type CacheEntry<T> = {
  expiresAt: number;
  promise: Promise<T>;
};

const memoryCache = new Map<string, CacheEntry<unknown>>();

function cacheFetch<T>(key: string, producer: () => Promise<T>, ttl = CACHE_TTL) {
  const cached = memoryCache.get(key) as CacheEntry<T> | undefined;
  if (cached && cached.expiresAt > Date.now()) return cached.promise;
  const promise = producer();
  memoryCache.set(key, { expiresAt: Date.now() + ttl, promise });
  return promise;
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`MiLB source failed: ${response.status} ${url}`);
  return response.json() as Promise<T>;
}

type MlbTeam = {
  id: number;
  name: string;
  abbreviation?: string;
  parentOrgName?: string;
  parentOrgId?: number;
  locationName?: string;
  league?: { name?: string };
  sport?: { id?: number; name?: string; abbreviation?: string };
};

type RosterPerson = {
  person: { id: number; fullName: string };
  position?: { abbreviation?: string; type?: string };
};

type MlbPerson = {
  id: number;
  fullName: string;
  currentAge?: number;
  height?: string;
  weight?: number;
  birthCountry?: string;
  batSide?: { code?: string };
  pitchHand?: { code?: string };
  primaryPosition?: { abbreviation?: string };
  stats?: Array<{
    group?: { displayName?: string };
    splits?: Array<{
      stat?: Record<string, string | number>;
      sport?: { abbreviation?: string };
      team?: { id: number; name: string };
    }>;
  }>;
};

export async function fetchAllMlbOrganizations(season = new Date().getFullYear()) {
  return cacheFetch(`mlb-orgs-${season}`, async () => {
    const data = await fetchJson<{ teams: MlbTeam[] }>(`${MLB_API}/teams?sportId=1&activeStatus=Y&season=${season}`);
    return data.teams
      .filter((team) => team.abbreviation)
      .map((team) => ({
        id: team.id,
        name: team.name,
        abbr: team.abbreviation || team.name.slice(0, 3).toUpperCase(),
      }))
      .sort((a, b) => a.abbr.localeCompare(b.abbr));
  }, 30 * 60_000);
}

export async function fetchAffiliatesForOrganization(orgId: number, orgAbbr: string, season = new Date().getFullYear()) {
  return cacheFetch(`milb-affiliates-${orgId}-${season}`, async () => {
    const data = await fetchJson<{ teams: MlbTeam[] }>(`${MLB_API}/teams/${orgId}/affiliates?season=${season}`);
    const affiliates: Omit<MiLBAffiliate, "players">[] = data.teams
      .filter((team) => team.sport?.id && LEVEL_SPORT_IDS.has(team.sport.id))
      .map((team) => ({
        id: team.id,
        teamName: team.name,
        level: normalizeMiLBLevel(team.sport?.name || team.sport?.abbreviation) || "A",
        league: team.league?.name || "MiLB",
        location: team.locationName,
        parentOrg: team.parentOrgName || "",
        parentOrgId: team.parentOrgId || orgId,
        parentOrgAbbr: orgAbbr,
        lastUpdated: new Date().toISOString(),
      }))
      .sort((a, b) => {
        const order = { AAA: 0, AA: 1, "A+": 2, A: 3 };
        return order[a.level] - order[b.level];
      });
    return affiliates;
  });
}

async function fetchAffiliateRoster(teamId: number) {
  return cacheFetch(`milb-roster-${teamId}`, async () => {
    const data = await fetchJson<{ roster: RosterPerson[] }>(`${MLB_API}/teams/${teamId}/roster?rosterType=active`);
    return data.roster || [];
  });
}

async function fetchPlayerPerson(playerId: number, levelSportId: number, season: number) {
  const hydrate = encodeURIComponent(`stats(group=[hitting,pitching],type=[season],sportId=${levelSportId},season=${season})`);
  return cacheFetch(`milb-person-${playerId}-${levelSportId}-${season}`, async () => {
    const data = await fetchJson<{ people: MlbPerson[] }>(`${MLB_API}/people/${playerId}?hydrate=${hydrate}`);
    return data.people?.[0];
  });
}

function numberValue(value: unknown, fallback = 0) {
  const number = typeof value === "string" ? Number(value) : Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function statPercent(numerator?: unknown, denominator?: unknown) {
  const top = numberValue(numerator);
  const bottom = numberValue(denominator);
  if (!bottom) return undefined;
  return Number(((top / bottom) * 100).toFixed(1));
}

function extractStats(person: MlbPerson): MiLBPlayer["stats"] {
  const stats: MiLBPlayer["stats"] = {};
  for (const bucket of person.stats || []) {
    const split = bucket.splits?.[0];
    const stat = split?.stat || {};
    if (bucket.group?.displayName === "hitting") {
      stats.hitting = {
        avg: numberValue(stat.avg),
        obp: numberValue(stat.obp),
        slg: numberValue(stat.slg),
        ops: numberValue(stat.ops),
        hr: numberValue(stat.homeRuns),
        rbi: numberValue(stat.rbi),
        sb: numberValue(stat.stolenBases),
        pa: numberValue(stat.plateAppearances),
        kRate: statPercent(stat.strikeOuts, stat.plateAppearances),
        bbRate: statPercent(stat.baseOnBalls, stat.plateAppearances),
      };
    }
    if (bucket.group?.displayName === "pitching") {
      stats.pitching = {
        era: numberValue(stat.era),
        whip: numberValue(stat.whip),
        k9: numberValue(stat.strikeoutsPer9Inn),
        bb9: numberValue(stat.walksPer9Inn),
        ip: numberValue(stat.inningsPitched),
      };
    }
  }
  return stats;
}

function extractAdvanced(person: MlbPerson): MiLBPlayer["advanced"] {
  const hitting = person.stats?.find((bucket) => bucket.group?.displayName === "hitting")?.splits?.[0]?.stat || {};
  return {
    iso: numberValue(hitting.slg) && numberValue(hitting.avg) ? Number((numberValue(hitting.slg) - numberValue(hitting.avg)).toFixed(3)) : undefined,
    babip: hitting.babip ? numberValue(hitting.babip) : undefined,
  };
}

export async function fetchFangraphsProspectRankings(): Promise<Map<number, number>> {
  // Fangraphs does not expose a stable browser-safe public JSON endpoint for The Board.
  // This adapter is intentionally isolated so a server worker can replace it without touching UI code.
  return cacheFetch("fangraphs-prospect-rankings", async () => new Map<number, number>(), 6 * 60 * 60_000);
}

export async function fetchBaseballReferenceRegisterStats(): Promise<Map<number, Partial<MiLBPlayer["stats"]>>> {
  // Baseball Reference register pages are enrichment-only here; production should run this on a server/worker.
  return cacheFetch("bbref-register-stats", async () => new Map<number, Partial<MiLBPlayer["stats"]>>(), 6 * 60 * 60_000);
}

async function hydrateAffiliatePlayers(affiliate: Omit<MiLBAffiliate, "players">, options: { rosterLimit?: number; season: number; rankings: Map<number, number> }) {
  const roster = await fetchAffiliateRoster(affiliate.id);
  const levelSportId = affiliate.level === "AAA" ? 11 : affiliate.level === "AA" ? 12 : affiliate.level === "A+" ? 13 : 14;
  const limitedRoster = options.rosterLimit ? roster.slice(0, options.rosterLimit) : roster;
  const players = await Promise.all(limitedRoster.map(async (entry) => {
    const person = await fetchPlayerPerson(entry.person.id, levelSportId, options.season);
    if (!person) return null;
    return reconcilePlayer({
      identity: {
        id: person.id,
        name: person.fullName,
        age: person.currentAge,
        height: person.height,
        weight: person.weight,
        bats: person.batSide?.code,
        throws: person.pitchHand?.code,
        birthCountry: person.birthCountry,
        position: person.primaryPosition?.abbreviation || entry.position?.abbreviation || "UTIL",
      },
      affiliate,
      stats: extractStats(person),
      advanced: extractAdvanced(person),
      rank: options.rankings.get(person.id),
    });
  }));
  return players.filter(Boolean) as MiLBPlayer[];
}

export function validateMiLBPipeline(affiliates: MiLBAffiliate[]): MiLBValidationReport {
  const players = affiliates.flatMap((affiliate) => affiliate.players);
  const seen = new Set<number>();
  const duplicatePlayerIds: number[] = [];
  for (const player of players) {
    if (seen.has(player.id)) duplicatePlayerIds.push(player.id);
    seen.add(player.id);
  }
  const issues: string[] = [];
  if (affiliates.length !== 4) issues.push(`Expected 4 affiliates; received ${affiliates.length}.`);
  for (const affiliate of affiliates) {
    if (affiliate.players.length < 20) issues.push(`${affiliate.teamName} has ${affiliate.players.length} active players in the official roster response.`);
  }
  if (duplicatePlayerIds.length) issues.push(`Duplicate player IDs detected: ${duplicatePlayerIds.join(", ")}.`);
  return {
    ok: issues.length === 0,
    issues,
    duplicatePlayerIds,
    affiliateCount: affiliates.length,
    populatedAffiliateCount: affiliates.filter((affiliate) => affiliate.players.length > 0).length,
  };
}

function calculateFarmHealth(orgAbbr: string, affiliates: MiLBAffiliate[]) {
  const players = affiliates.flatMap((affiliate) => affiliate.players);
  const topProspects = [...players].sort((a, b) => b.prospect.score - a.prospect.score).slice(0, 8);
  const score = players.length
    ? Math.round(Math.min(100, (players.reduce((sum, player) => sum + player.prospect.score, 0) / players.length) + Math.min(18, players.length / 5)))
    : 0;
  const strongestLevel = [...affiliates]
    .map((affiliate) => ({
      level: affiliate.level,
      score: affiliate.players.length ? affiliate.players.reduce((sum, player) => sum + player.prospect.score, 0) / affiliate.players.length : 0,
    }))
    .sort((a, b) => b.score - a.score)[0]?.level || "pending";
  return { score, strongestLevel, playerCount: players.length, topProspects, orgAbbr };
}

export async function fetchOrganizationPipeline(orgAbbr: string, options: { rosterLimit?: number; season?: number } = {}): Promise<MiLBOrganizationPipeline> {
  const season = options.season || new Date().getFullYear();
  return cacheFetch(`milb-org-pipeline-${orgAbbr}-${season}-${options.rosterLimit || "all"}`, async () => {
    const orgs = await fetchAllMlbOrganizations(season);
    const org = orgs.find((item) => item.abbr.toUpperCase() === orgAbbr.toUpperCase());
    if (!org) throw new Error(`Unknown MLB organization: ${orgAbbr}`);
    const rankings = await fetchFangraphsProspectRankings();
    const affiliatesBase = await fetchAffiliatesForOrganization(org.id, org.abbr, season);
    const affiliates = await Promise.all(affiliatesBase.map(async (affiliate) => ({
      ...affiliate,
      players: await hydrateAffiliatePlayers(affiliate, { rosterLimit: options.rosterLimit, season, rankings }),
    })));
    const playersWithMovement = applyMovementState(affiliates.flatMap((affiliate) => affiliate.players));
    const playerById = new Map(playersWithMovement.map((player) => [player.id, player]));
    const hydratedAffiliates = affiliates.map((affiliate) => ({
      ...affiliate,
      players: affiliate.players.map((player) => playerById.get(player.id) || player),
    }));
    rememberMiLBAssignments(playersWithMovement);
    const validation = validateMiLBPipeline(hydratedAffiliates);
    return {
      orgId: org.id,
      orgAbbr: org.abbr,
      orgName: org.name,
      affiliates: hydratedAffiliates,
      health: calculateFarmHealth(org.abbr, hydratedAffiliates),
      validation,
      lastUpdated: new Date().toISOString(),
    };
  });
}

export async function fetchMiLBUniverse(options: { orgLimit?: number; rosterLimit?: number; season?: number } = {}) {
  const season = options.season || new Date().getFullYear();
  return cacheFetch(`milb-universe-${season}-${options.orgLimit || "all"}-${options.rosterLimit || "all"}`, async () => {
    const orgs = await fetchAllMlbOrganizations(season);
    const selected = options.orgLimit ? orgs.slice(0, options.orgLimit) : orgs;
    const pipelines = await Promise.all(selected.map((org) => fetchOrganizationPipeline(org.abbr, { rosterLimit: options.rosterLimit, season })));
    return {
      pipelines,
      players: pipelines.flatMap((pipeline) => pipeline.affiliates.flatMap((affiliate) => affiliate.players)),
      lastUpdated: new Date().toISOString(),
    };
  });
}

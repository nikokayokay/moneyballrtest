import { currentMlbDate } from "@/src/lib/live";

export type SpherePlayer = {
  id: number;
  src: string;
  alt: string;
  title: string;
  description: string;
  team: string;
  rank: number;
  score: number;
  woba: number | null;
  last7Woba: number | null;
  hardHit: number | null;
  trend: "hot" | "cold" | "volatile" | "neutral";
};

type MlbSplit = {
  player?: { id?: number; fullName?: string };
  team?: { name?: string };
  stat?: Record<string, unknown>;
};

type MlbStatsResponse = {
  stats?: Array<{ splits?: MlbSplit[] }>;
};

const WOBA_WEIGHTS = {
  ubb: 0.69,
  hbp: 0.72,
  single: 0.88,
  double: 1.247,
  triple: 1.578,
  homeRun: 2.031,
};

function num(value: unknown) {
  if (value === null || value === undefined || value === "" || value === ".---" || value === "-.--") return null;
  const parsed = Number(String(value).replace(/%/g, "").replace(/,/g, "").trim());
  return Number.isFinite(parsed) ? parsed : null;
}

function headshotUrl(playerId: number) {
  return `https://img.mlbstatic.com/mlb-photos/image/upload/w_320,q_auto:best/v1/people/${playerId}/headshot/67/current`;
}

function fmtRate(value: number | null) {
  if (value === null) return "Not enough data";
  return value.toFixed(3).replace(/^0/, "");
}

function computeWoba(stat: Record<string, unknown>) {
  const hits = num(stat.hits) || 0;
  const doubles = num(stat.doubles) || 0;
  const triples = num(stat.triples) || 0;
  const homeRuns = num(stat.homeRuns) || 0;
  const singles = Math.max(0, hits - doubles - triples - homeRuns);
  const walks = num(stat.baseOnBalls) || 0;
  const intentionalWalks = num(stat.intentionalWalks) || 0;
  const ubb = Math.max(0, walks - intentionalWalks);
  const hbp = num(stat.hitByPitch) || 0;
  const atBats = num(stat.atBats) || 0;
  const sacFlies = num(stat.sacFlies) || 0;
  const denominator = atBats + ubb + hbp + sacFlies;
  if (!denominator) return null;
  return (
    (ubb * WOBA_WEIGHTS.ubb) +
    (hbp * WOBA_WEIGHTS.hbp) +
    (singles * WOBA_WEIGHTS.single) +
    (doubles * WOBA_WEIGHTS.double) +
    (triples * WOBA_WEIGHTS.triple) +
    (homeRuns * WOBA_WEIGHTS.homeRun)
  ) / denominator;
}

function iso(stat: Record<string, unknown>) {
  const slg = num(stat.slg);
  const avg = num(stat.avg);
  return slg !== null && avg !== null ? slg - avg : null;
}

async function fetchMlbStats(url: string) {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error(`MLB stats request failed: ${response.status}`);
  return response.json() as Promise<MlbStatsResponse>;
}

export async function fetchImpactPlayers(limit = 48): Promise<SpherePlayer[]> {
  const season = new Date().getFullYear();
  const end = currentMlbDate();
  const startDate = new Date(`${end}T12:00:00`);
  startDate.setDate(startDate.getDate() - 7);
  const start = startDate.toISOString().slice(0, 10);
  const seasonUrl = `https://statsapi.mlb.com/api/v1/stats?stats=season&group=hitting&playerPool=ALL&season=${season}&sportIds=1&limit=1000`;
  const last7Url = `https://statsapi.mlb.com/api/v1/stats?stats=byDateRange&group=hitting&playerPool=ALL&season=${season}&sportIds=1&startDate=${start}&endDate=${end}&limit=1000`;
  const [seasonData, last7Data] = await Promise.all([fetchMlbStats(seasonUrl), fetchMlbStats(last7Url)]);
  const last7ById = new Map<number, Record<string, unknown>>();

  (last7Data.stats?.[0]?.splits || []).forEach((split) => {
    const id = split.player?.id;
    if (id && split.stat) last7ById.set(id, split.stat);
  });

  const ranked = (seasonData.stats?.[0]?.splits || []).map((split) => {
    const id = split.player?.id || 0;
    const stat = split.stat || {};
    const rolling = last7ById.get(id) || {};
    const pa = num(stat.plateAppearances) || 0;
    const recentPa = num(rolling.plateAppearances) || 0;
    const woba = computeWoba(stat);
    const last7Woba = computeWoba(rolling);
    const processDelta = last7Woba !== null && woba !== null ? last7Woba - woba : 0;
    const hardHitProxy = iso(stat);
    const trendScore = processDelta * 90;
    const score =
      ((woba ?? 0.300) * 100) +
      (Math.min(pa, 250) / 250 * 12) +
      ((hardHitProxy ?? 0.140) * 34) +
      (last7Woba !== null ? last7Woba * 30 : 6) +
      trendScore;
    const trend: SpherePlayer["trend"] = processDelta > 0.045 ? "hot" : processDelta < -0.045 ? "cold" : recentPa < 10 ? "volatile" : "neutral";
    return {
      id,
      src: headshotUrl(id),
      alt: split.player?.fullName || "MLB player",
      title: split.player?.fullName || "MLB player",
      description: `wOBA: ${fmtRate(woba)} | Last 7: ${fmtRate(last7Woba)} | HardHit: Not enough data`,
      team: split.team?.name || "MLB",
      rank: 0,
      score,
      woba,
      last7Woba,
      hardHit: null,
      trend,
    };
  })
    .filter((player) => player.id && player.woba !== null)
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.max(40, Math.min(60, limit)))
    .map((player, index) => ({ ...player, rank: index + 1 }));

  return ranked;
}

const WOBA_WEIGHTS = {
  ubb: 0.69,
  hbp: 0.72,
  single: 0.88,
  double: 1.247,
  triple: 1.578,
  homeRun: 2.031,
};

export function toNumber(value: unknown) {
  if (value === null || value === undefined || value === "" || value === ".---" || value === "-.--") return null;
  const parsed = Number(String(value).replace(/%/g, "").replace(/,/g, "").trim());
  return Number.isFinite(parsed) ? parsed : null;
}

export function computeOps(obp: unknown, slg: unknown) {
  const a = toNumber(obp);
  const b = toNumber(slg);
  return a !== null && b !== null ? a + b : null;
}

export function computeKRate(strikeouts: unknown, plateAppearances: unknown) {
  const so = toNumber(strikeouts);
  const pa = toNumber(plateAppearances);
  return so !== null && pa ? (so / pa) * 100 : null;
}

export function computeBbRate(walks: unknown, plateAppearances: unknown) {
  const bb = toNumber(walks);
  const pa = toNumber(plateAppearances);
  return bb !== null && pa ? (bb / pa) * 100 : null;
}

export function computeWoba(stat: Record<string, unknown>) {
  const hits = toNumber(stat.hits) || 0;
  const doubles = toNumber(stat.doubles) || 0;
  const triples = toNumber(stat.triples) || 0;
  const homeRuns = toNumber(stat.homeRuns) || 0;
  const singles = Math.max(0, hits - doubles - triples - homeRuns);
  const walks = toNumber(stat.baseOnBalls) || 0;
  const intentionalWalks = toNumber(stat.intentionalWalks) || 0;
  const ubb = Math.max(0, walks - intentionalWalks);
  const hbp = toNumber(stat.hitByPitch) || 0;
  const atBats = toNumber(stat.atBats) || 0;
  const sacFlies = toNumber(stat.sacFlies) || 0;
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

export function moneyballrImpactScore(stat: Record<string, unknown>) {
  const woba = computeWoba(stat) ?? 0.315;
  const ops = toNumber(stat.ops) ?? computeOps(stat.obp, stat.slg) ?? 0.720;
  const hr = toNumber(stat.homeRuns) ?? 0;
  const pa = toNumber(stat.plateAppearances) ?? 0;
  const kRate = computeKRate(stat.strikeOuts, stat.plateAppearances) ?? 22;
  const bbRate = computeBbRate(stat.baseOnBalls, stat.plateAppearances) ?? 8;
  const sample = Math.min(1, pa / 250);
  return Math.round(Math.max(0, Math.min(100, 35 + (woba - 0.315) * 115 + (ops - 0.720) * 35 + Math.min(16, hr * 0.75) + (bbRate * 0.6) - (kRate * 0.25) + sample * 14)));
}

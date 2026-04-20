import type { PlayerProfile } from "@/src/lib/mlb";

export type TrendClassification =
  | "surging"
  | "stable"
  | "volatile"
  | "cooling off"
  | "underperforming process"
  | "outperforming process";

export type ProfileArchetype =
  | "contact-first"
  | "power-centric"
  | "balanced bat"
  | "swing-and-miss power"
  | "command artist"
  | "velocity-heavy"
  | "ground-ball specialist"
  | "bat-missing breaker-heavy arm";

function numeric(value: string | null | undefined) {
  if (!value || value === "Unavailable" || value === "N/A") return null;
  const parsed = Number(value.replace(/[^0-9.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function stat(rows: Array<[string, string]>, label: string) {
  return numeric(rows.find(([key]) => key === label)?.[1]);
}

function average(values: Array<number | null>) {
  const usable = values.filter((value): value is number => Number.isFinite(value));
  return usable.length ? usable.reduce((sum, value) => sum + value, 0) / usable.length : null;
}

function variance(values: Array<number | null>) {
  const usable = values.filter((value): value is number => Number.isFinite(value));
  if (usable.length < 2) return null;
  const avg = usable.reduce((sum, value) => sum + value, 0) / usable.length;
  return usable.reduce((sum, value) => sum + ((value - avg) ** 2), 0) / usable.length;
}

export function classifyPlayerTrend(profile: PlayerProfile): TrendClassification {
  const woba = stat(profile.advancedStats, "wOBA");
  const xwoba = stat(profile.advancedStats, "xwOBA");
  const recent = profile.trendData.slice(-5).map((point) => point.woba);
  const prior = profile.trendData.slice(-10, -5).map((point) => point.woba);
  const recentAvg = average(recent);
  const priorAvg = average(prior);
  const recentVariance = variance(recent);
  const delta = recentAvg !== null && priorAvg !== null ? recentAvg - priorAvg : null;
  const processGap = xwoba !== null && woba !== null ? xwoba - woba : null;

  if (processGap !== null && processGap > 0.035) return "underperforming process";
  if (processGap !== null && processGap < -0.035) return "outperforming process";
  if (recentVariance !== null && recentVariance > 0.006) return "volatile";
  if (delta !== null && delta > 0.035) return "surging";
  if (delta !== null && delta < -0.035) return "cooling off";
  return "stable";
}

export function classifyArchetype(profile: PlayerProfile): ProfileArchetype {
  if (profile.type === "pitcher") {
    const kRate = stat(profile.advancedStats, "K%");
    const bbRate = stat(profile.advancedStats, "BB%");
    const whiff = stat(profile.advancedStats, "Whiff%");
    const velo = profile.pitchMix.map((pitch) => numeric(pitch.avgVelo)).filter((value): value is number => Number.isFinite(value));
    const avgVelo = velo.length ? velo.reduce((sum, value) => sum + value, 0) / velo.length : null;
    if ((whiff ?? 0) >= 28 || (kRate ?? 0) >= 28) return "bat-missing breaker-heavy arm";
    if ((avgVelo ?? 0) >= 95) return "velocity-heavy";
    if ((bbRate ?? 99) <= 7) return "command artist";
    return "ground-ball specialist";
  }

  const iso = stat(profile.advancedStats, "ISO");
  const kRate = stat(profile.advancedStats, "K%");
  const bbRate = stat(profile.advancedStats, "BB%");
  const ops = stat(profile.standardStats, "OPS");
  if ((iso ?? 0) >= 0.220 && (kRate ?? 0) >= 26) return "swing-and-miss power";
  if ((iso ?? 0) >= 0.200) return "power-centric";
  if ((kRate ?? 100) <= 18 && (bbRate ?? 0) >= 8) return "contact-first";
  if ((ops ?? 0) >= 0.760) return "balanced bat";
  return "contact-first";
}

export function playerValueScore(profile: PlayerProfile) {
  const obp = stat(profile.standardStats, "OBP") ?? 0.315;
  const ops = stat(profile.standardStats, "OPS") ?? 0.700;
  const woba = stat(profile.advancedStats, "wOBA") ?? 0.315;
  const xwoba = stat(profile.advancedStats, "xwOBA") ?? woba;
  const bb = stat(profile.advancedStats, "BB%") ?? 8;
  const k = stat(profile.advancedStats, "K%") ?? 22;
  const process = Math.max(-0.06, Math.min(0.08, xwoba - woba));
  return Math.round(Math.max(0, Math.min(100, 42 + ((obp - 0.300) * 115) + ((ops - 0.700) * 38) + ((woba - 0.315) * 95) + (process * 120) + ((bb - k / 4) * 0.7))));
}

export function consistencyIndex(profile: PlayerProfile) {
  const values = profile.trendData.slice(-10).map((point) => point.woba);
  const v = variance(values);
  if (v === null) return profile.sample.confidence === "HIGH" ? 65 : 48;
  return Math.round(Math.max(0, Math.min(100, 82 - (v * 4200))));
}

export function impactRecentScore(profile: PlayerProfile) {
  const recent = average(profile.trendData.slice(-5).map((point) => point.woba)) ?? 0.315;
  const confidence = profile.sample.reliability * 20;
  const value = playerValueScore(profile);
  return Math.round(Math.max(0, Math.min(100, (recent * 120) + (value * 0.42) + confidence)));
}

export function generatePlayerInsights(profile: PlayerProfile) {
  const trend = classifyPlayerTrend(profile);
  const archetype = classifyArchetype(profile);
  const woba = stat(profile.advancedStats, "wOBA");
  const xwoba = stat(profile.advancedStats, "xwOBA");
  const kRate = stat(profile.advancedStats, "K%");
  const bbRate = stat(profile.advancedStats, "BB%");
  const blurbs: string[] = [];

  if (trend === "underperforming process") blurbs.push("Power output is trailing expected damage.");
  if (trend === "outperforming process") blurbs.push("Results are running ahead of the underlying contact profile.");
  if (trend === "surging") blurbs.push("Recent contact quality supports breakout form.");
  if (trend === "cooling off") blurbs.push("Recent production is tapering from the prior window.");
  if (trend === "volatile") blurbs.push("Game-to-game output is swinging hard right now.");
  if (trend === "stable") blurbs.push("Recent form is holding close to season shape.");
  if ((bbRate ?? 0) >= 10 && (kRate ?? 99) <= 24) blurbs.push("Plate discipline remains stable enough to protect the floor.");
  if (woba !== null && xwoba !== null && Math.abs(xwoba - woba) < 0.015) blurbs.push("Expected and actual results are largely aligned.");
  blurbs.push(`Profile reads as ${archetype}.`);

  return [...new Set(blurbs)].slice(0, 3);
}

export function trendTone(tag: TrendClassification) {
  if (tag === "surging" || tag === "underperforming process") return "positive" as const;
  if (tag === "cooling off") return "negative" as const;
  if (tag === "volatile" || tag === "outperforming process") return "warning" as const;
  return "neutral" as const;
}

export function exportCaption(profile: PlayerProfile) {
  const tag = classifyPlayerTrend(profile);
  const name = profile.identity.fullName;
  if (tag === "surging") return `${name} is building real current-form momentum.`;
  if (tag === "underperforming process") return `${name}'s process is better than the box score right now.`;
  if (tag === "outperforming process") return `${name} is getting results, but the process gap is worth watching.`;
  return `${name}'s current Moneyballr profile in one snapshot.`;
}

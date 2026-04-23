export type SourceName = "mlbam" | "milb" | "fangraphs" | "bbref" | "savant" | "derived";

export interface SourceValue<T> {
  value: T;
  source: SourceName;
  timestamp: string;
  confidence?: number;
}

export interface ReconciledValue<T> extends SourceValue<T> {
  alternatives: SourceValue<T>[];
  conflict: boolean;
}

const SOURCE_PRIORITY: Record<SourceName, number> = {
  mlbam: 100,
  milb: 92,
  savant: 86,
  fangraphs: 82,
  bbref: 74,
  derived: 58,
};

function normalizeStatValue(value: unknown) {
  if (typeof value === "string") {
    const numeric = Number(value.replace("%", ""));
    return Number.isFinite(numeric) ? numeric : value;
  }
  return value;
}

function freshnessScore(timestamp: string) {
  const ageMs = Math.max(0, Date.now() - new Date(timestamp).getTime());
  return Math.max(0, 30 - ageMs / 86_400_000);
}

export function reconcileStat<T>(values: SourceValue<T>[]): ReconciledValue<T> | null {
  if (!values.length) return null;
  const normalized = values.map((entry) => ({
    ...entry,
    value: normalizeStatValue(entry.value) as T,
    confidence: entry.confidence ?? 0.8,
  }));
  const ranked = [...normalized].sort((a, b) => {
    const aScore = SOURCE_PRIORITY[a.source] + freshnessScore(a.timestamp) + (a.confidence || 0) * 12;
    const bScore = SOURCE_PRIORITY[b.source] + freshnessScore(b.timestamp) + (b.confidence || 0) * 12;
    return bScore - aScore;
  });
  const winner = ranked[0];
  return {
    ...winner,
    alternatives: ranked.slice(1),
    conflict: ranked.some((entry) => String(entry.value) !== String(winner.value)),
  };
}

export function mergeStatObjects<T extends Record<string, unknown>>(sources: Partial<Record<SourceName, { data: T; timestamp: string; confidence?: number }>>) {
  const fields = new Set<string>();
  for (const source of Object.values(sources)) {
    Object.keys(source?.data || {}).forEach((field) => fields.add(field));
  }
  const output: Record<string, ReconciledValue<unknown>> = {};
  for (const field of fields) {
    const values = Object.entries(sources).flatMap(([source, payload]) => {
      if (!payload || !(field in payload.data)) return [];
      return [{ value: payload.data[field], source: source as SourceName, timestamp: payload.timestamp, confidence: payload.confidence }];
    });
    const reconciled = reconcileStat(values);
    if (reconciled) output[field] = reconciled;
  }
  return output;
}

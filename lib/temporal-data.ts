export type TimeWindow = "last7" | "last30" | "season";

export interface Snapshot<T> {
  id: string;
  entityId: string | number;
  timestamp: string;
  data: T;
}

const snapshots = new Map<string, Snapshot<unknown>[]>();

export function storeSnapshot<T>(entityId: string | number, data: T, timestamp = new Date().toISOString()) {
  const key = String(entityId);
  const next = [...(snapshots.get(key) || []), { id: `${key}-${timestamp}`, entityId, timestamp, data }];
  snapshots.set(key, next.slice(-240));
}

export function getSnapshots<T>(entityId: string | number, window: TimeWindow = "season") {
  const all = (snapshots.get(String(entityId)) || []) as Snapshot<T>[];
  const cutoffDays = window === "last7" ? 7 : window === "last30" ? 30 : 366;
  const cutoff = Date.now() - cutoffDays * 86_400_000;
  return all.filter((snapshot) => new Date(snapshot.timestamp).getTime() >= cutoff);
}

export function rewindSnapshot<T>(entityId: string | number, at: string) {
  const target = new Date(at).getTime();
  return ([...(snapshots.get(String(entityId)) || [])] as Snapshot<T>[])
    .filter((snapshot) => new Date(snapshot.timestamp).getTime() <= target)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0] || null;
}

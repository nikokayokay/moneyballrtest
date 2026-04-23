export const LIVE_REFRESH_MS = 12_000;
export const NEAR_REALTIME_REFRESH_MS = 5 * 60_000;
export const FULL_SYNC_REFRESH_MS = 24 * 60 * 60_000;

export type LiveStateTag = "LIVE" | "FINAL" | "UPCOMING" | "NO_GAME";

export function currentMlbDate(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function formatLiveClock(now: Date) {
  const date = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    month: "short",
    day: "numeric",
  }).format(now);
  const time = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    hour: "numeric",
    minute: "2-digit",
  }).format(now);
  return `LIVE - ${date}, ${time} ET`;
}

export function classifyGameState(status?: string | null): LiveStateTag {
  const normalized = String(status || "").toLowerCase();
  if (normalized.includes("in progress") || normalized.includes("warmup") || normalized.includes("delayed")) return "LIVE";
  if (normalized.includes("final") || normalized.includes("completed")) return "FINAL";
  if (normalized.includes("scheduled") || normalized.includes("pre-game") || normalized.includes("preview")) return "UPCOMING";
  return "NO_GAME";
}

export function isLiveState(state: LiveStateTag) {
  return state === "LIVE";
}

export function refreshIntervalForState(state: LiveStateTag) {
  return state === "LIVE" ? LIVE_REFRESH_MS : NEAR_REALTIME_REFRESH_MS;
}

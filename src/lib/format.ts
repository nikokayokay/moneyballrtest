import type { LiveStateTag } from "@/src/lib/mlb";

export const MOTION = {
  fast: "150ms",
  base: "220ms",
  slow: "420ms",
  ease: "cubic-bezier(0.2, 0.8, 0.2, 1)",
};

export function isPresent(value: string | number | null | undefined) {
  return value !== null && value !== undefined && value !== "" && value !== "Unavailable" && value !== "N/A";
}

export function formatRate(value: number | null | undefined, digits = 3) {
  if (!Number.isFinite(value)) return "Not enough data";
  return Number(value).toFixed(digits).replace(/^0/, "");
}

export function formatPct(value: number | null | undefined, digits = 1) {
  if (!Number.isFinite(value)) return "Not enough data";
  return `${Number(value).toFixed(digits)}%`;
}

export function formatDateShort(value: string | null | undefined) {
  if (!value) return "No date";
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

export function liveStateTone(state: LiveStateTag | "HOT" | "COLD" | "NEUTRAL" | string) {
  if (state === "LIVE" || state === "HOT") return "positive";
  if (state === "FINAL") return "neutral";
  if (state === "UPCOMING" || state === "NEUTRAL") return "warning";
  if (state === "COLD") return "negative";
  return "neutral";
}

export function trendLabel(value: number | null | undefined) {
  if (!Number.isFinite(value)) return "Needs sample";
  if (Number(value) > 0.04) return "Hot signal";
  if (Number(value) < -0.04) return "Cooling";
  return "Stable";
}

export function rankScore(values: Array<number | null | undefined>) {
  const usable = values.filter((value): value is number => Number.isFinite(value));
  if (!usable.length) return 50;
  return Math.round(usable.reduce((sum, value) => sum + value, 0) / usable.length);
}

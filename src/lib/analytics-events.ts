type AnalyticsEvent = {
  type: string;
  label: string;
  metadata?: Record<string, string | number | boolean | null>;
  at: string;
};

const KEY = "moneyballr.analytics.v1";

export function trackAnalyticsEvent(type: string, label: string, metadata?: AnalyticsEvent["metadata"]) {
  if (typeof window === "undefined") return;
  try {
    const current = JSON.parse(window.localStorage.getItem(KEY) || "[]") as AnalyticsEvent[];
    const next = [{ type, label, metadata, at: new Date().toISOString() }, ...current].slice(0, 100);
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Analytics should never interrupt baseball.
  }
}

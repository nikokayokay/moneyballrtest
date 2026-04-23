export type AlertType = "breakout" | "call-up" | "clutch" | "data-delay";

export interface MoneyballrAlert {
  id: string;
  type: AlertType;
  title: string;
  detail: string;
  timestamp: string;
  read?: boolean;
}

const KEY = "moneyballr.alerts.v1";

function readAlerts(): MoneyballrAlert[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(KEY) || "[]") as MoneyballrAlert[];
  } catch {
    return [];
  }
}

export function createAlert(alert: Omit<MoneyballrAlert, "id" | "timestamp">) {
  const next = [{ ...alert, id: `${alert.type}-${Date.now()}`, timestamp: new Date().toISOString() }, ...readAlerts()].slice(0, 80);
  if (typeof window !== "undefined") window.localStorage.setItem(KEY, JSON.stringify(next));
  return next[0];
}

export function alertHistory() {
  return readAlerts();
}

export function shouldTriggerBreakout(score: number, previousScore?: number) {
  return score >= 82 && (!previousScore || score - previousScore >= 8);
}

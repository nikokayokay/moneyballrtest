export type MoneyballrEventType = "HR" | "STRIKEOUT" | "GAME_END" | "PLAYER_UPDATE" | "ROSTER_MOVE";

export interface MoneyballrEvent {
  id: string;
  type: MoneyballrEventType;
  playerId?: number | string;
  playerName?: string;
  team?: string;
  impact: number;
  timestamp: string;
  payload?: Record<string, unknown>;
}

type Listener = (events: MoneyballrEvent[]) => void;

const listeners = new Set<Listener>();
let queue: MoneyballrEvent[] = [];
let timer: number | null = null;

function rankEvents(events: MoneyballrEvent[]) {
  return [...events].sort((a, b) => b.impact - a.impact || new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export function subscribeToMoneyballrEvents(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function pushMoneyballrEvent(event: Omit<MoneyballrEvent, "id" | "timestamp"> & { id?: string; timestamp?: string }) {
  queue.push({
    ...event,
    id: event.id || `${event.type}-${event.playerId || "system"}-${Date.now()}`,
    timestamp: event.timestamp || new Date().toISOString(),
  });
  if (timer) return;
  timer = window.setTimeout(() => {
    const next = rankEvents(queue).slice(0, 25);
    queue = [];
    timer = null;
    listeners.forEach((listener) => listener(next));
  }, 650);
}

export function simulateLiveTrigger(type: MoneyballrEventType, playerName = "Live signal") {
  const impact = type === "HR" ? 92 : type === "GAME_END" ? 74 : type === "STRIKEOUT" ? 58 : 45;
  pushMoneyballrEvent({ type, playerName, impact });
}

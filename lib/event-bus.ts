export type EventBusTopic =
  | "player:event"
  | "game:update"
  | "stat:change"
  | "signals:rerank"
  | "leaderboards:refresh"
  | "visuals:update";

export interface EventBusMessage<T = unknown> {
  topic: EventBusTopic;
  payload: T;
  timestamp: string;
}

type Handler<T = unknown> = (message: EventBusMessage<T>) => void;

const handlers = new Map<EventBusTopic, Set<Handler>>();

export function publishEvent<T>(topic: EventBusTopic, payload: T) {
  const message: EventBusMessage<T> = { topic, payload, timestamp: new Date().toISOString() };
  handlers.get(topic)?.forEach((handler) => handler(message));
  if (topic === "player:event" || topic === "game:update" || topic === "stat:change") {
    handlers.get("signals:rerank")?.forEach((handler) => handler({ ...message, topic: "signals:rerank" }));
    handlers.get("visuals:update")?.forEach((handler) => handler({ ...message, topic: "visuals:update" }));
  }
}

export function subscribeEvent<T>(topic: EventBusTopic, handler: Handler<T>) {
  const set = handlers.get(topic) || new Set<Handler>();
  set.add(handler as Handler);
  handlers.set(topic, set);
  return () => set.delete(handler as Handler);
}

import { useCallback, useEffect, useState } from "react";

const KEY = "moneyballr.watchlist.v1";

type WatchItem = {
  id: number;
  type: "player" | "team";
  label: string;
  addedAt: string;
};

function readWatchlist(): WatchItem[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(KEY) || "[]") as WatchItem[];
  } catch {
    return [];
  }
}

export function useWatchlist() {
  const [items, setItems] = useState<WatchItem[]>([]);

  useEffect(() => {
    setItems(readWatchlist());
  }, []);

  const persist = useCallback((next: WatchItem[]) => {
    setItems(next);
    window.localStorage.setItem(KEY, JSON.stringify(next));
  }, []);

  const isWatched = useCallback((id: number, type: WatchItem["type"] = "player") => {
    return items.some((item) => item.id === id && item.type === type);
  }, [items]);

  const toggle = useCallback((item: Omit<WatchItem, "addedAt">) => {
    const exists = items.some((existing) => existing.id === item.id && existing.type === item.type);
    const next = exists
      ? items.filter((existing) => !(existing.id === item.id && existing.type === item.type))
      : [{ ...item, addedAt: new Date().toISOString() }, ...items].slice(0, 24);
    persist(next);
  }, [items, persist]);

  return { items, isWatched, toggle };
}

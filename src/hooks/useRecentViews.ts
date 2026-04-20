import { useEffect, useState } from "react";

const KEY = "moneyballr.recent.v1";

export type RecentView = {
  id: number;
  label: string;
  team?: string;
  viewedAt: string;
};

function read(): RecentView[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(KEY) || "[]") as RecentView[];
  } catch {
    return [];
  }
}

export function useRecentViews() {
  const [items, setItems] = useState<RecentView[]>([]);

  useEffect(() => {
    setItems(read());
  }, []);

  const track = (view: Omit<RecentView, "viewedAt">) => {
    const next = [{ ...view, viewedAt: new Date().toISOString() }, ...read().filter((item) => item.id !== view.id)].slice(0, 10);
    window.localStorage.setItem(KEY, JSON.stringify(next));
    setItems(next);
  };

  return { items, track };
}

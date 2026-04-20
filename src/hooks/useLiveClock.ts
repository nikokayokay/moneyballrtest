import { useEffect, useMemo, useState } from "react";
import { formatLiveClock, currentMlbDate } from "@/src/lib/live";

export function useLiveClock() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1_000);
    return () => window.clearInterval(timer);
  }, []);

  return useMemo(() => ({
    now,
    label: formatLiveClock(now),
    mlbDate: currentMlbDate(now),
  }), [now]);
}

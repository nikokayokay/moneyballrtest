export interface GameLogLike {
  date: string;
  opponent?: string;
  value: number;
  contextScore?: number;
}

export interface LastXGamesSummary {
  games: GameLogLike[];
  average: number;
  trend: "up" | "down" | "flat";
  best: GameLogLike | null;
}

export function summarizeLastXGames(logs: GameLogLike[], games = 10): LastXGamesSummary {
  const recent = [...logs]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, games);
  const average = recent.length ? recent.reduce((sum, game) => sum + game.value, 0) / recent.length : 0;
  const firstHalf = recent.slice(0, Math.ceil(recent.length / 2));
  const secondHalf = recent.slice(Math.ceil(recent.length / 2));
  const firstAvg = firstHalf.length ? firstHalf.reduce((sum, game) => sum + game.value, 0) / firstHalf.length : average;
  const secondAvg = secondHalf.length ? secondHalf.reduce((sum, game) => sum + game.value, 0) / secondHalf.length : average;
  const delta = firstAvg - secondAvg;
  return {
    games: recent,
    average: Number(average.toFixed(2)),
    trend: Math.abs(delta) < 0.5 ? "flat" : delta > 0 ? "up" : "down",
    best: recent.reduce<GameLogLike | null>((best, game) => (!best || game.value > best.value ? game : best), null),
  };
}

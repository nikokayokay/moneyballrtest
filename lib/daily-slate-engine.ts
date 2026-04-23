import { analyzeMatchup } from "./matchup-engine";

export interface SlateGame {
  id: number;
  awayTeam: string;
  homeTeam: string;
  awayScore?: number | null;
  homeScore?: number | null;
  status: string;
}

export function rankDailySlate(games: SlateGame[]) {
  return games.map((game) => {
    const score = String(game.status).toLowerCase().includes("progress") ? 92 : String(game.status).toLowerCase().includes("final") ? 64 : 74;
    return {
      ...game,
      watchScore: score,
      label: score >= 90 ? "Live priority" : score >= 72 ? "Watchlist game" : "Final context",
    };
  }).sort((a, b) => b.watchScore - a.watchScore);
}

export function topPlayerWatch(hitterName: string, pitcherName: string) {
  return analyzeMatchup({
    hitter: { name: hitterName, handedness: "L", ops: 0.82, kRate: 21 },
    pitcher: { name: pitcherName, throws: "R", era: 4.1, k9: 8.5 },
  });
}

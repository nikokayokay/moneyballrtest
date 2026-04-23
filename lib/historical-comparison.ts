import { mostSimilarPlayers, type PlayerVector } from "./player-similarity";

export interface HistoricalSeason {
  id: string;
  playerName: string;
  season: number;
  vector: PlayerVector;
}

export function historicalParallels(current: { id: string; name: string; vector: PlayerVector }, seasons: HistoricalSeason[]) {
  return mostSimilarPlayers(
    { id: current.id, name: current.name, vector: current.vector },
    seasons.map((season) => ({ id: season.id, name: `${season.playerName} ${season.season}`, vector: season.vector })),
    3,
  ).map((match) => ({
    ...match,
    insight: `This reminds you of ${match.player.name} by shape, not just raw totals.`,
  }));
}

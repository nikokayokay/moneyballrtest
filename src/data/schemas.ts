export type NormalizedPlayer = {
  id: number;
  name: string;
  teamId: number | null;
  team: string;
  teamAbbr: string;
  position: string;
  headshotUrl: string;
  birthCountry?: string;
  birthCity?: string;
};

export type NormalizedTeam = {
  id: number;
  name: string;
  abbreviation: string;
  logoUrl: string;
};

export type NormalizedGame = {
  id: number;
  state: "LIVE" | "FINAL" | "UPCOMING" | "NO_GAME";
  awayTeam: string;
  homeTeam: string;
  awayScore: number | null;
  homeScore: number | null;
  inning: string | null;
  outs: number | null;
};

export type LeaderboardCategory =
  | "homeRuns"
  | "ops"
  | "avg"
  | "stolenBases"
  | "era"
  | "strikeOuts"
  | "war";

export type LeaderboardEntry = {
  playerId: number;
  playerName: string;
  teamId: number | null;
  team: string;
  position: string;
  statLabel: string;
  statValue: string;
  numericValue: number;
  rank: number;
  trend: "hot" | "cold" | "stable";
  last7Context: string;
  headshotUrl: string;
};

export type LeaderboardCard = {
  id: LeaderboardCategory;
  title: string;
  statLabel: string;
  entries: LeaderboardEntry[];
  href: string;
  updatedAt: string;
};

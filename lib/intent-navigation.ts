export interface NavigationSuggestion {
  label: string;
  href: string;
  section: string;
  score: number;
}

const intents: Array<{ patterns: RegExp[]; suggestion: NavigationSuggestion }> = [
  { patterns: [/hot players/i, /top performers/i], suggestion: { label: "Today's Top Performers", href: "/", section: "home-top-performers", score: 96 } },
  { patterns: [/yankees prospects/i, /nyy farm/i], suggestion: { label: "Yankees Farm System", href: "/minor-leagues/organizations/NYY", section: "milb-org", score: 94 } },
  { patterns: [/prospects/i, /minor/i], suggestion: { label: "Minor League Hub", href: "/minor-leagues", section: "milb", score: 88 } },
  { patterns: [/leaders/i, /leaderboard/i], suggestion: { label: "Leaderboards", href: "/leaderboards", section: "leaderboards", score: 84 } },
  { patterns: [/games/i, /scores/i], suggestion: { label: "Game Center", href: "/games", section: "games", score: 80 } },
];

export function suggestNavigation(query: string) {
  const matches = intents.filter((intent) => intent.patterns.some((pattern) => pattern.test(query))).map((intent) => intent.suggestion);
  return matches.length ? matches.sort((a, b) => b.score - a.score) : [{ label: "Player Search", href: "/players", section: "search", score: 60 }];
}

export interface UserPreferences {
  teams: string[];
  players: Array<string | number>;
  stats: string[];
}

const KEY = "moneyballr.preferences.v1";
const DEFAULTS: UserPreferences = { teams: [], players: [], stats: ["impact", "woba", "ops"] };

export function loadPreferences(): UserPreferences {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    return { ...DEFAULTS, ...JSON.parse(window.localStorage.getItem(KEY) || "{}") };
  } catch {
    return DEFAULTS;
  }
}

export function savePreferences(preferences: UserPreferences) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(preferences));
}

export function toggleFavoriteTeam(team: string) {
  const prefs = loadPreferences();
  const teams = prefs.teams.includes(team) ? prefs.teams.filter((item) => item !== team) : [...prefs.teams, team];
  savePreferences({ ...prefs, teams });
  return teams;
}

export function toggleFavoritePlayer(playerId: string | number) {
  const prefs = loadPreferences();
  const id = String(playerId);
  const players = prefs.players.map(String).includes(id) ? prefs.players.filter((item) => String(item) !== id) : [...prefs.players, playerId];
  savePreferences({ ...prefs, players });
  return players;
}

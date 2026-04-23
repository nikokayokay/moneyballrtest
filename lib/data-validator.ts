import type { HomePerformer } from "@/src/data/home-discovery";

export type ValidatedStandingTeam = {
  teamId: number;
  teamName: string;
  abbreviation: string;
  league: string;
  division: string;
  wins: number;
  losses: number;
  gamesBack: string;
  lastTen: string;
  streak: string;
  logoUrl: string;
};

type ValidationResult = {
  ok: boolean;
  issues: string[];
};

function reportValidation(source: string, issues: string[]) {
  if (issues.length) {
    console.error(`[Moneyballr data validation] ${source}`, issues);
  }
}

export function validateStandings(teams: ValidatedStandingTeam[]): ValidationResult {
  const issues: string[] = [];
  const ids = new Set<number>();

  if (teams.length < 20) issues.push(`Expected a broad MLB standings payload, received ${teams.length} teams.`);

  teams.forEach((team) => {
    if (!team.teamId || ids.has(team.teamId)) issues.push(`Invalid or duplicate team id for ${team.teamName}.`);
    ids.add(team.teamId);
    if (team.wins < 0 || team.losses < 0) issues.push(`Negative record detected for ${team.teamName}.`);
    if (!team.teamName || !team.abbreviation) issues.push(`Missing team identity for ${team.teamId}.`);
  });

  reportValidation("standings", issues);
  return { ok: issues.length === 0, issues };
}

export function validateTopPerformers(performers: HomePerformer[]): ValidationResult {
  const issues: string[] = [];
  const ids = new Set<string>();

  if (!performers.length) return { ok: true, issues };

  performers.forEach((player) => {
    const id = String(player.playerId);
    if (!id || ids.has(id)) issues.push(`Invalid or duplicate performer id for ${player.name}.`);
    ids.add(id);
    if (!player.name || !player.headshotUrl) issues.push(`Missing performer identity for ${id}.`);
    if (!Number.isFinite(player.impactScore)) issues.push(`Invalid impact score for ${player.name}.`);
    if (!player.statLine || !player.keyStat) issues.push(`Missing live stat line for ${player.name}.`);
  });

  reportValidation("top performers", issues);
  return { ok: issues.length === 0, issues };
}

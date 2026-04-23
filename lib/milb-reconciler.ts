import { calculateProspectScore } from "./prospect-score";
import type { MiLBAffiliate, MiLBLevel, MiLBPlayer, SourceConflict } from "./milb-types";

export function normalizeMiLBLevel(value?: string | null): MiLBLevel | null {
  const normalized = (value || "").toLowerCase();
  if (normalized.includes("triple") || normalized === "aaa") return "AAA";
  if (normalized.includes("double") || normalized === "aa") return "AA";
  if (normalized.includes("high") || normalized === "a+" || normalized === "high-a") return "A+";
  if (normalized.includes("single") || normalized === "a") return "A";
  return null;
}

export function logSourceConflicts(context: string, conflicts: SourceConflict[]) {
  if (!conflicts.length) return;
  const isDev = typeof process !== "undefined"
    ? process.env.NODE_ENV !== "production"
    : typeof location !== "undefined" && location.hostname === "localhost";
  if (!isDev) return;
  console.warn(`[Moneyballr MiLB reconcile] ${context}`, conflicts);
}

export function reconcilePlayer(input: {
  identity: {
    id: number;
    name: string;
    age?: number;
    height?: string;
    weight?: number;
    bats?: string;
    throws?: string;
    birthCountry?: string;
    position: string;
  };
  affiliate: Omit<MiLBAffiliate, "players">;
  stats: MiLBPlayer["stats"];
  advanced?: MiLBPlayer["advanced"];
  rank?: number;
  lastUpdated?: string;
}): MiLBPlayer {
  const conflicts: SourceConflict[] = [];
  const level = input.affiliate.level;
  const age = input.identity.age || 0;
  const prospect = calculateProspectScore({
    age,
    level,
    stats: input.stats,
    rank: input.rank,
  });

  if (!input.identity.id) {
    conflicts.push({
      field: "id",
      preferredSource: "MLB Stats API",
      discardedSource: "non-canonical source",
      preferredValue: input.identity.id,
      discardedValue: undefined,
    });
  }

  logSourceConflicts(input.identity.name, conflicts);

  return {
    id: input.identity.id,
    name: input.identity.name,
    mlbOrg: input.affiliate.parentOrg,
    orgAbbr: input.affiliate.parentOrgAbbr,
    affiliate: {
      teamId: input.affiliate.id,
      teamName: input.affiliate.teamName,
      level,
      league: input.affiliate.league,
    },
    bio: {
      age,
      height: input.identity.height,
      weight: input.identity.weight,
      bats: input.identity.bats === "L" || input.identity.bats === "R" || input.identity.bats === "S" ? input.identity.bats : undefined,
      throws: input.identity.throws === "L" || input.identity.throws === "R" ? input.identity.throws : undefined,
      birthCountry: input.identity.birthCountry,
    },
    position: input.identity.position,
    stats: input.stats,
    advanced: input.advanced,
    prospect: {
      ...prospect,
      rank: input.rank,
    },
    movement: {
      lastMove: "unchanged",
    },
    lastUpdated: input.lastUpdated || new Date().toISOString(),
  };
}

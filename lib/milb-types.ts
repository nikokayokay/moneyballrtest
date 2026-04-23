export type MiLBLevel = "AAA" | "AA" | "A+" | "A";

export type ProspectTier = "elite" | "top100" | "orgTop10" | "unranked";

export type MovementType = "promoted" | "demoted" | "unchanged";

export interface MiLBHittingStats {
  avg: number;
  obp: number;
  slg: number;
  ops: number;
  hr: number;
  rbi: number;
  sb: number;
  pa?: number;
  kRate?: number;
  bbRate?: number;
}

export interface MiLBPitchingStats {
  era: number;
  whip: number;
  k9: number;
  bb9: number;
  ip?: number;
}

export interface MiLBPlayer {
  id: number;
  name: string;
  mlbOrg: string;
  orgAbbr: string;
  affiliate: {
    teamId: number;
    teamName: string;
    level: MiLBLevel;
    league: string;
  };
  bio: {
    age: number;
    height?: string;
    weight?: number;
    bats?: "L" | "R" | "S";
    throws?: "L" | "R";
    birthCountry?: string;
  };
  position: string;
  stats: {
    hitting?: MiLBHittingStats;
    pitching?: MiLBPitchingStats;
  };
  advanced?: {
    wrcPlus?: number;
    iso?: number;
    babip?: number;
  };
  prospect: {
    rank?: number;
    tier?: ProspectTier;
    score: number;
    label: "MLB Ready" | "Rising" | "Development" | "Depth";
  };
  movement: {
    lastMove?: MovementType;
    fromLevel?: string;
    toLevel?: string;
    timestamp?: string;
  };
  lastUpdated: string;
}

export interface MiLBAffiliate {
  id: number;
  teamName: string;
  level: MiLBLevel;
  league: string;
  location?: string;
  parentOrg: string;
  parentOrgId: number;
  parentOrgAbbr: string;
  players: MiLBPlayer[];
  lastUpdated: string;
}

export interface MiLBOrganizationPipeline {
  orgId: number;
  orgAbbr: string;
  orgName: string;
  affiliates: MiLBAffiliate[];
  health: {
    score: number;
    strongestLevel: MiLBLevel | "pending";
    playerCount: number;
    topProspects: MiLBPlayer[];
  };
  validation: MiLBValidationReport;
  lastUpdated: string;
}

export interface MiLBValidationReport {
  ok: boolean;
  issues: string[];
  duplicatePlayerIds: number[];
  affiliateCount: number;
  populatedAffiliateCount: number;
}

export interface SourceConflict {
  field: string;
  preferredSource: string;
  discardedSource: string;
  preferredValue: unknown;
  discardedValue: unknown;
}

export interface MovementLogEntry {
  id: string;
  playerId: number;
  playerName: string;
  orgAbbr: string;
  fromLevel?: MiLBLevel | "MLB" | "unknown";
  toLevel?: MiLBLevel | "MLB" | "unknown";
  type: MovementType;
  timestamp: string;
}

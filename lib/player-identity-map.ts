export interface PlayerIdentity {
  canonicalId: string;
  mlbamId?: number;
  fangraphsId?: string;
  bbrefId?: string;
  name: string;
  birthDate?: string;
  team?: string;
  sourceIds: Record<string, string | number | undefined>;
  confidence: number;
  unresolved?: boolean;
}

export interface RawPlayerIdentity {
  source: "mlbam" | "fangraphs" | "bbref" | "savant" | "milb";
  id: string | number;
  name: string;
  birthDate?: string;
  team?: string;
}

const registry = new Map<string, PlayerIdentity>();
const unresolved: PlayerIdentity[] = [];

function normalizeName(name: string) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9 ]/gi, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function fallbackKey(player: Pick<RawPlayerIdentity, "name" | "birthDate">) {
  return `${normalizeName(player.name)}::${player.birthDate || "no-dob"}`;
}

function confidenceFor(candidate: RawPlayerIdentity, existing?: PlayerIdentity) {
  if (!existing) return candidate.birthDate ? 0.82 : 0.64;
  let score = normalizeName(candidate.name) === normalizeName(existing.name) ? 0.48 : 0;
  if (candidate.birthDate && candidate.birthDate === existing.birthDate) score += 0.38;
  if (candidate.team && candidate.team === existing.team) score += 0.1;
  if (candidate.source === "mlbam") score += 0.04;
  return Math.min(1, score);
}

function idField(source: RawPlayerIdentity["source"]) {
  if (source === "mlbam" || source === "milb" || source === "savant") return "mlbamId";
  if (source === "fangraphs") return "fangraphsId";
  return "bbrefId";
}

export function resolvePlayerIdentity(player: RawPlayerIdentity): PlayerIdentity {
  const canonicalId = player.source === "mlbam" || player.source === "milb" || player.source === "savant"
    ? `mlbam:${player.id}`
    : fallbackKey(player);
  const existing = registry.get(canonicalId) || registry.get(fallbackKey(player));
  const confidence = confidenceFor(player, existing);
  const identity: PlayerIdentity = {
    canonicalId: existing?.canonicalId || canonicalId,
    mlbamId: existing?.mlbamId,
    fangraphsId: existing?.fangraphsId,
    bbrefId: existing?.bbrefId,
    name: existing?.name || player.name,
    birthDate: existing?.birthDate || player.birthDate,
    team: player.team || existing?.team,
    sourceIds: { ...(existing?.sourceIds || {}) },
    confidence,
    unresolved: confidence < 0.72,
  };
  const field = idField(player.source);
  if (field === "mlbamId") identity.mlbamId = Number(player.id);
  if (field === "fangraphsId") identity.fangraphsId = String(player.id);
  if (field === "bbrefId") identity.bbrefId = String(player.id);
  identity.sourceIds[player.source] = player.id;
  registry.set(identity.canonicalId, identity);
  registry.set(fallbackKey(identity), identity);
  if (identity.unresolved) unresolved.push(identity);
  return identity;
}

export function dedupePlayerIdentities(players: RawPlayerIdentity[]) {
  return players.map(resolvePlayerIdentity).filter((identity, index, all) => (
    all.findIndex((item) => item.canonicalId === identity.canonicalId) === index
  ));
}

export function getUnresolvedPlayerIdentities() {
  return unresolved;
}

export function validateIdentityResolution(players: RawPlayerIdentity[]) {
  const identities = dedupePlayerIdentities(players);
  const unresolvedIdentities = identities.filter((identity) => identity.unresolved);
  return {
    ok: unresolvedIdentities.length === 0,
    total: identities.length,
    unresolved: unresolvedIdentities,
  };
}

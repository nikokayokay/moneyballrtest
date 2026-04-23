import type { MiLBPlayer, MovementLogEntry } from "./milb-types";

type AssignmentSnapshot = Record<number, { level: MiLBPlayer["affiliate"]["level"]; teamName: string; timestamp: string }>;

const STORAGE_KEY = "moneyballr.milb.assignmentSnapshot.v1";
let memorySnapshot: AssignmentSnapshot = {};

function readSnapshot(): AssignmentSnapshot {
  if (Object.keys(memorySnapshot).length) return memorySnapshot;
  if (typeof window === "undefined") return memorySnapshot;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    memorySnapshot = raw ? JSON.parse(raw) as AssignmentSnapshot : {};
  } catch {
    memorySnapshot = {};
  }
  return memorySnapshot;
}

function writeSnapshot(snapshot: AssignmentSnapshot) {
  memorySnapshot = snapshot;
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  } catch {
    // Local storage is an optional acceleration layer; memory cache remains authoritative.
  }
}

export function detectMiLBMovements(players: MiLBPlayer[], previous = readSnapshot()): MovementLogEntry[] {
  const now = new Date().toISOString();
  return players.flatMap((player) => {
    const old = previous[player.id];
    if (!old || old.level === player.affiliate.level) return [];
    return [{
      id: `${player.id}-${old.level}-${player.affiliate.level}-${now}`,
      playerId: player.id,
      playerName: player.name,
      orgAbbr: player.orgAbbr,
      fromLevel: old.level,
      toLevel: player.affiliate.level,
      type: old.level === "AAA" && player.affiliate.level !== "AAA" ? "demoted" : "promoted",
      timestamp: now,
    }];
  });
}

export function applyMovementState(players: MiLBPlayer[], movements = detectMiLBMovements(players)) {
  const movementByPlayer = new Map(movements.map((move) => [move.playerId, move]));
  return players.map((player) => {
    const move = movementByPlayer.get(player.id);
    if (!move) {
      return {
        ...player,
        movement: {
          ...player.movement,
          lastMove: "unchanged" as const,
        },
      };
    }
    return {
      ...player,
      movement: {
        lastMove: move.type,
        fromLevel: move.fromLevel,
        toLevel: move.toLevel,
        timestamp: move.timestamp,
      },
    };
  });
}

export function rememberMiLBAssignments(players: MiLBPlayer[]) {
  const next: AssignmentSnapshot = {};
  const now = new Date().toISOString();
  for (const player of players) {
    next[player.id] = {
      level: player.affiliate.level,
      teamName: player.affiliate.teamName,
      timestamp: now,
    };
  }
  writeSnapshot(next);
}

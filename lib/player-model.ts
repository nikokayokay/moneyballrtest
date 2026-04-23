import { classifyPlayerArchetype } from "./archetypes";
import { buildDevelopmentCurve, classifyDevelopmentTrajectory, type DevelopmentPoint } from "./development-curves";
import { playerValueScore } from "./player-value-model";
import { estimateReadiness } from "./projection-engine";
import { detectTrend } from "./trend-detection";
import type { MiLBPlayer } from "./milb-types";

export function modelMlbPlayer(input: {
  id: string | number;
  name: string;
  recent: number[];
  baseline: number;
  offense?: number;
  defense?: number;
  baserunning?: number;
  pitching?: number;
  hitting?: Parameters<typeof classifyPlayerArchetype>[0]["hitting"];
  pitchingShape?: Parameters<typeof classifyPlayerArchetype>[0]["pitching"];
}) {
  return {
    id: input.id,
    name: input.name,
    archetype: classifyPlayerArchetype({ hitting: input.hitting, pitching: input.pitchingShape }),
    trend: detectTrend(input.recent, input.baseline),
    valueScore: playerValueScore({
      offense: input.offense,
      defense: input.defense,
      baserunning: input.baserunning,
      pitching: input.pitching,
    }),
  };
}

export function modelMilbPlayer(player: MiLBPlayer, curve: DevelopmentPoint[] = []) {
  return {
    id: player.id,
    name: player.name,
    archetype: classifyPlayerArchetype({
      hitting: player.stats.hitting,
      pitching: player.stats.pitching,
    }),
    readiness: estimateReadiness(player),
    developmentCurve: buildDevelopmentCurve(curve),
    trajectory: curve.length ? classifyDevelopmentTrajectory(curve) : "steady growth",
  };
}

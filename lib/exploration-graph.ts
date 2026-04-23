export interface GraphNode {
  id: string;
  label: string;
  type: "player" | "team" | "country" | "archetype";
}

export interface GraphEdge {
  source: string;
  target: string;
  weight: number;
  label: string;
}

export function buildExplorationGraph(players: Array<{ id: string | number; name: string; team: string; country?: string; archetype?: string }>) {
  const nodes = new Map<string, GraphNode>();
  const edges: GraphEdge[] = [];
  for (const player of players) {
    const playerId = `player:${player.id}`;
    nodes.set(playerId, { id: playerId, label: player.name, type: "player" });
    const teamId = `team:${player.team}`;
    nodes.set(teamId, { id: teamId, label: player.team, type: "team" });
    edges.push({ source: playerId, target: teamId, weight: 1, label: "team" });
    if (player.country) {
      const countryId = `country:${player.country}`;
      nodes.set(countryId, { id: countryId, label: player.country, type: "country" });
      edges.push({ source: playerId, target: countryId, weight: 0.8, label: "origin" });
    }
    if (player.archetype) {
      const archetypeId = `archetype:${player.archetype}`;
      nodes.set(archetypeId, { id: archetypeId, label: player.archetype, type: "archetype" });
      edges.push({ source: playerId, target: archetypeId, weight: 0.7, label: "profile" });
    }
  }
  return { nodes: Array.from(nodes.values()), edges };
}

export type PlayerVector = Record<string, number>;

export function cosineSimilarity(a: PlayerVector, b: PlayerVector) {
  const keys = Array.from(new Set([...Object.keys(a), ...Object.keys(b)]));
  const dot = keys.reduce((sum, key) => sum + (a[key] || 0) * (b[key] || 0), 0);
  const magA = Math.sqrt(keys.reduce((sum, key) => sum + Math.pow(a[key] || 0, 2), 0));
  const magB = Math.sqrt(keys.reduce((sum, key) => sum + Math.pow(b[key] || 0, 2), 0));
  return magA && magB ? Number((dot / (magA * magB)).toFixed(3)) : 0;
}

export function mostSimilarPlayers<T extends { id: string | number; name: string; vector: PlayerVector }>(target: T, pool: T[], limit = 5) {
  return pool
    .filter((player) => player.id !== target.id)
    .map((player) => ({ player, similarity: cosineSimilarity(target.vector, player.vector) }))
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit);
}

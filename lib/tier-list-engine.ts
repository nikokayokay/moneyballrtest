export type TierLabel = "S" | "A" | "B" | "C" | "Watch";

export interface TierInput {
  id: string | number;
  name: string;
  team?: string;
  score: number;
  confidence?: number;
}

export interface TieredEntity extends TierInput {
  tier: TierLabel;
  rank: number;
}

function tierFor(score: number, confidence = 75): TierLabel {
  const trustedScore = score * (0.72 + Math.min(100, Math.max(0, confidence)) / 360);
  if (trustedScore >= 82) return "S";
  if (trustedScore >= 70) return "A";
  if (trustedScore >= 56) return "B";
  if (trustedScore >= 42) return "C";
  return "Watch";
}

export function buildDynamicTierList(inputs: TierInput[]): TieredEntity[] {
  return [...inputs]
    .sort((a, b) => b.score - a.score)
    .map((item, index) => ({
      ...item,
      rank: index + 1,
      tier: tierFor(item.score, item.confidence),
    }));
}

export function groupByTier(items: TieredEntity[]) {
  return items.reduce<Record<TierLabel, TieredEntity[]>>(
    (groups, item) => {
      groups[item.tier].push(item);
      return groups;
    },
    { S: [], A: [], B: [], C: [], Watch: [] },
  );
}

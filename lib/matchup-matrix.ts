import { analyzeMatchup, type MatchupInput } from "./matchup-engine";

export interface MatchupMatrixInput {
  hitter: MatchupInput["hitter"] & { id: string | number; name: string; team?: string };
  pitcher: MatchupInput["pitcher"] & { id: string | number; name: string; team?: string };
  parkFactor?: number;
}

export interface MatchupMatrixCell {
  hitterId: string | number;
  pitcherId: string | number;
  hitter: string;
  pitcher: string;
  advantage: ReturnType<typeof analyzeMatchup>["label"];
  score: number;
  summary: string;
}

export function buildMatchupMatrix(inputs: MatchupMatrixInput[]): MatchupMatrixCell[] {
  return inputs
    .map((input) => {
      const result = analyzeMatchup({ hitter: input.hitter, pitcher: input.pitcher });
      const parkAdjustedScore = Math.round(Math.max(0, Math.min(100, result.score + ((input.parkFactor || 100) - 100) * 0.12)));
      return {
        hitterId: input.hitter.id,
        pitcherId: input.pitcher.id,
        hitter: input.hitter.name,
        pitcher: input.pitcher.name,
        advantage: result.label,
        score: parkAdjustedScore,
        summary: result.note,
      };
    })
    .sort((a, b) => b.score - a.score);
}

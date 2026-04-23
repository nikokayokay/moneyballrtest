import { adjustImpactScore, contextualDifficultyMultiplier, type DifficultyContext } from "./contextual-difficulty";
import { clutchFactor, type GameContext } from "./game-context";
import { calculateLeverageIndex } from "./leverage-index";

export interface ContextInput {
  opponentStrength?: number;
  parkFactor?: number;
  leverage?: number;
  game?: GameContext;
}

export function enrichContext(input: ContextInput) {
  const leverage = input.game ? calculateLeverageIndex(input.game) : input.leverage ?? 1;
  const gameClutch = input.game ? clutchFactor(input.game) : 1;
  const difficulty: DifficultyContext = {
    opponentStrength: input.opponentStrength ?? 1,
    parkFactor: input.parkFactor ?? 1,
    leverage: leverage * gameClutch,
  };
  return {
    leverage,
    clutchFactor: gameClutch,
    difficultyMultiplier: contextualDifficultyMultiplier(difficulty),
    difficulty,
  };
}

export function adjustContext(score: number, input: ContextInput) {
  const context = enrichContext(input);
  return {
    ...context,
    adjustedScore: adjustImpactScore(score, context.difficulty),
  };
}

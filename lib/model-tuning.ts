export interface ModelWeights {
  recency: number;
  leverage: number;
  baseline: number;
  projection: number;
}

const KEY = "moneyballr.modelWeights.v1";
export const DEFAULT_MODEL_WEIGHTS: ModelWeights = { recency: 0.34, leverage: 0.24, baseline: 0.24, projection: 0.18 };

export function loadModelWeights(): ModelWeights {
  if (typeof window === "undefined") return DEFAULT_MODEL_WEIGHTS;
  try {
    return { ...DEFAULT_MODEL_WEIGHTS, ...JSON.parse(window.localStorage.getItem(KEY) || "{}") };
  } catch {
    return DEFAULT_MODEL_WEIGHTS;
  }
}

export function saveModelWeights(weights: ModelWeights) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(weights));
}

export function tuneSignalScore(input: { recency: number; leverage: number; baseline: number; projection: number }, weights = loadModelWeights()) {
  return Math.round(input.recency * weights.recency + input.leverage * weights.leverage + input.baseline * weights.baseline + input.projection * weights.projection);
}

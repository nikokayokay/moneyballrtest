export type TrendShiftDirection = "up" | "down" | "flat";

export interface TrendShiftInput {
  id: string | number;
  label: string;
  baseline: number;
  current: number;
  sampleSize?: number;
  higherIsBetter?: boolean;
}

export interface TrendShift {
  id: string | number;
  label: string;
  baseline: number;
  current: number;
  delta: number;
  percentChange: number;
  direction: TrendShiftDirection;
  intensity: number;
  verdict: "surging" | "slipping" | "steady";
}

export function calculateTrendShift(input: TrendShiftInput): TrendShift {
  const higherIsBetter = input.higherIsBetter ?? true;
  const delta = input.current - input.baseline;
  const adjustedDelta = higherIsBetter ? delta : -delta;
  const denominator = Math.max(Math.abs(input.baseline), 0.001);
  const percentChange = delta / denominator;
  const sampleModifier = Math.min(1, Math.max(0.35, (input.sampleSize || 10) / 30));
  const intensity = Math.round(Math.min(100, Math.abs(percentChange) * 100 * sampleModifier));
  const direction: TrendShiftDirection = Math.abs(delta) < denominator * 0.03 ? "flat" : adjustedDelta > 0 ? "up" : "down";
  return {
    id: input.id,
    label: input.label,
    baseline: input.baseline,
    current: input.current,
    delta,
    percentChange,
    direction,
    intensity,
    verdict: direction === "up" ? "surging" : direction === "down" ? "slipping" : "steady",
  };
}

export function rankTrendShifts(inputs: TrendShiftInput[]) {
  return inputs
    .map(calculateTrendShift)
    .sort((a, b) => b.intensity - a.intensity);
}

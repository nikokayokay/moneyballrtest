export function sampleConfidence(sampleSize: number, target = 120) {
  return Math.round(Math.max(15, Math.min(98, (sampleSize / (sampleSize + target)) * 100)));
}

export function metricConfidence(input: { sampleSize: number; sourceConfidence?: number; recencyDays?: number }) {
  const sample = sampleConfidence(input.sampleSize);
  const source = (input.sourceConfidence ?? 0.82) * 100;
  const recency = Math.max(35, 100 - (input.recencyDays || 0) * 4);
  return Math.round(sample * 0.5 + source * 0.32 + recency * 0.18);
}

export function confidenceTone(confidence: number) {
  if (confidence >= 75) return "high";
  if (confidence >= 50) return "medium";
  return "low";
}

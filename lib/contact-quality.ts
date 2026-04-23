export interface ContactQualityInput {
  exitVelocity?: number;
  hardHitRate?: number;
  barrelRate?: number;
  launchAngle?: number;
  sampleSize?: number;
}

export interface ContactQualityResult {
  expectedSlug: number;
  damageScore: number;
  label: "elite damage" | "solid contact" | "contact risk" | "low signal";
  confidence: number;
}

export function evaluateContactQuality(input: ContactQualityInput): ContactQualityResult {
  const hardHit = input.hardHitRate ?? 36;
  const barrel = input.barrelRate ?? 7;
  const ev = input.exitVelocity ?? 88;
  const angle = input.launchAngle ?? 12;
  const angleFit = Math.max(0, 1 - Math.abs(angle - 14) / 24);
  const damageScore = Math.round(Math.max(0, Math.min(100, hardHit * 0.9 + barrel * 2.4 + (ev - 84) * 2 + angleFit * 16)));
  const expectedSlug = Number((0.280 + damageScore / 260).toFixed(3));
  const confidence = Math.round(Math.min(100, Math.max(25, (input.sampleSize || 20) * 4)));
  return {
    expectedSlug,
    damageScore,
    confidence,
    label: confidence < 45 ? "low signal" : damageScore >= 72 ? "elite damage" : damageScore >= 54 ? "solid contact" : "contact risk",
  };
}

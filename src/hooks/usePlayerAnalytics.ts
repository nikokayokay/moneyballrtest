import { useMemo } from "react";
import type { Pitch, PlayerProfile } from "@/src/lib/mlb";
import { evaluateProp } from "@/src/services/DecisionEngine";
import type { ContactQualityPoint, PlayerAnalytics, PitchTypePerformance } from "@/src/types/analytics";

function average(values: number[]) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
}

function standardDeviation(values: number[]) {
  if (values.length < 2) return null;
  const mean = average(values);
  if (mean === null) return null;
  const variance = values.reduce((sum, value) => sum + ((value - mean) ** 2), 0) / values.length;
  return Math.sqrt(variance);
}

function parseMetric(profile: PlayerProfile, label: string) {
  const found = [...profile.standardStats, ...profile.advancedStats].find(([metric]) => metric === label)?.[1];
  if (!found || found === "Unavailable") return null;
  const parsed = Number(String(found).replace(/[^0-9.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function isSwing(pitch: Pitch) {
  return pitch.result === "swinging_strike" || pitch.result === "foul" || pitch.result === "in_play" || pitch.result === "hit" || pitch.result === "home_run";
}

function isContact(pitch: Pitch) {
  return pitch.result === "foul" || pitch.result === "in_play" || pitch.result === "hit" || pitch.result === "home_run";
}

function buildPitchTypePerformance(pitches: Pitch[]): PitchTypePerformance[] {
  const byType = new Map<string, Pitch[]>();
  pitches.forEach((pitch) => {
    const bucket = byType.get(pitch.pitchType) || [];
    bucket.push(pitch);
    byType.set(pitch.pitchType, bucket);
  });

  return [...byType.entries()].map(([pitchType, bucket]) => {
    const swings = bucket.filter(isSwing);
    const whiffs = swings.filter((pitch) => pitch.result === "swinging_strike");
    const damage = bucket.filter((pitch) => pitch.result === "hit" || pitch.result === "home_run" || pitch.result === "in_play");
    const launchSpeeds = damage.map((pitch) => pitch.launchSpeed).filter((value): value is number => Number.isFinite(value));
    return {
      pitchType,
      pitchesSeen: bucket.length,
      swingPct: bucket.length ? (swings.length / bucket.length) * 100 : null,
      whiffPct: swings.length ? (whiffs.length / swings.length) * 100 : null,
      damageRate: damage.length ? average(damage.map((pitch) => pitch.xba ?? 0.22)) : null,
      averageExitVelocity: average(launchSpeeds) ?? null,
    };
  }).sort((a, b) => b.pitchesSeen - a.pitchesSeen);
}

function buildTimeline(pitches: Pitch[]): ContactQualityPoint[] {
  const grouped = new Map<string, Pitch[]>();
  pitches.filter((pitch) => pitch.launchSpeed !== undefined).forEach((pitch) => {
    const key = pitch.gameDate || pitch.timestamp || "Unknown";
    const bucket = grouped.get(key) || [];
    bucket.push(pitch);
    grouped.set(key, bucket);
  });

  return [...grouped.entries()].slice(-8).map(([label, bucket]) => {
    const speeds = bucket.map((pitch) => pitch.launchSpeed).filter((value): value is number => Number.isFinite(value));
    const barrels = bucket.filter((pitch) => pitch.isBarrel).length;
    return {
      label,
      averageExitVelocity: average(speeds) ?? null,
      barrelRate: bucket.length ? (barrels / bucket.length) * 100 : null,
    };
  });
}

export function usePlayerAnalytics(profile: PlayerProfile, pitches: Pitch[]): PlayerAnalytics {
  return useMemo(() => {
    const chasePool = pitches.filter((pitch) => pitch.isInZone === false);
    const zonePool = pitches.filter((pitch) => pitch.isInZone === true);
    const swings = pitches.filter(isSwing);
    const contacts = pitches.filter(isContact);
    const swingProfile = {
      chasePct: chasePool.length ? (chasePool.filter(isSwing).length / chasePool.length) * 100 : null,
      zoneSwingPct: zonePool.length ? (zonePool.filter(isSwing).length / zonePool.length) * 100 : null,
      contactPct: swings.length ? (contacts.length / swings.length) * 100 : null,
    };

    const gameSeries = profile.allGames.map((game) => {
      const ops = Number(String(game.impact).replace(/[^0-9.-]/g, ""));
      return Number.isFinite(ops) ? ops : null;
    }).filter((value): value is number => Number.isFinite(value));
    const variance = standardDeviation(gameSeries);
    const mean = average(gameSeries);
    const consistencyScore = variance !== null && mean !== null && mean > 0 ? Math.max(0, Math.min(100, 100 - ((variance / mean) * 45))) : Math.max(12, profile.confidenceEngine.percent - 8);
    const volatility = {
      variance,
      consistencyScore: Math.round(consistencyScore),
      label: consistencyScore >= 72 ? "Low variance contact hitter" : consistencyScore <= 45 ? "High variance slugger" : "Balanced volatility profile",
    };

    const pitchTypePerformance = buildPitchTypePerformance(pitches);
    const bestPitchType = pitchTypePerformance.find((entry) => (entry.damageRate ?? 0) >= 0.34 && entry.pitchesSeen >= 20);
    const exploit = bestPitchType
      ? {
        level: "strong" as const,
        headline: "STRONG MATCHUP EDGE",
        detail: `${profile.identity.fullName} is doing damage against ${bestPitchType.pitchType} with ${(bestPitchType.damageRate ?? 0).toFixed(3)} expected outcome value over ${bestPitchType.pitchesSeen} pitches.`,
      }
      : {
        level: "neutral" as const,
        headline: "No clear exploit signal",
        detail: "Pitch-type damage is distributed evenly right now, so matchup edges need more opponent-specific context.",
      };

    const timeline = buildTimeline(pitches);
    const recentPitches = pitches.slice(-40);
    const nextPitchBuckets = recentPitches.reduce<Record<string, number>>((acc, pitch) => {
      acc[pitch.pitchType] = (acc[pitch.pitchType] || 0) + 1;
      return acc;
    }, {});
    const [nextPitchType, nextPitchCount = 0] = Object.entries(nextPitchBuckets).sort((a, b) => b[1] - a[1])[0] || [null, 0];
    const damageProbability = recentPitches.length ? (recentPitches.filter((pitch) => pitch.result === "hit" || pitch.result === "home_run").length / recentPitches.length) * 100 : null;
    const predictive = {
      nextPitchType,
      nextPitchProbability: recentPitches.length && nextPitchType ? (nextPitchCount / recentPitches.length) * 100 : null,
      damageProbability,
      swingProbability: recentPitches.length ? (recentPitches.filter(isSwing).length / recentPitches.length) * 100 : null,
    };

    const wobaGap = profile.expectedActual.find((item) => item.label === "wOBA" || item.label === "BA")?.delta ?? null;
    const xwoba = parseMetric(profile, "xwOBA");
    const moneyball = wobaGap !== null && wobaGap < -0.02 && (xwoba ?? 0) >= 0.32
      ? { label: "undervalued" as const, detail: "Underlying contact quality is better than the results line, which flags a buy-low profile." }
      : wobaGap !== null && wobaGap > 0.02
        ? { label: "overperforming" as const, detail: "The results line is running ahead of the expected quality-of-contact indicators." }
        : { label: "neutral" as const, detail: "Expected and actual outcomes are running close enough that the current line looks fair." };

    const propModel = evaluateProp({
      player: profile,
      pitches,
      propLine: 0.5,
      opponent: profile.liveGame.opponent,
      context: {
        opponentPitcherHand: profile.type === "hitter" ? ((recentPitches[recentPitches.length - 1]?.pitcherHand as "L" | "R" | undefined) ?? null) : null,
      },
    });

    return {
      swingProfile,
      volatility,
      pitchTypePerformance,
      exploit,
      contactQualityTimeline: timeline,
      predictive,
      moneyball,
      propModel,
    };
  }, [profile, pitches]);
}

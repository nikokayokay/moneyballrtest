import { Crosshair, Gauge, Radar, ShieldAlert, TrendingUp } from "lucide-react";
import type { PlayerProfile as PlayerProfileData } from "@/src/lib/mlb";
import { usePitchData } from "@/src/hooks/usePitchData";
import { usePlayerAnalytics } from "@/src/hooks/usePlayerAnalytics";
import { StrikeZoneChart } from "@/src/components/charts/StrikeZoneChart";
import { DecisionSummary } from "@/src/components/decision/DecisionSummary";
import { ProfileView } from "@/src/components/profile-view";

type PlayerProfileProps = {
  profile: PlayerProfileData;
};

export function PlayerProfile({ profile }: PlayerProfileProps) {
  const pitchQuery = usePitchData(profile.identity.playerId, profile.type);
  const analytics = usePlayerAnalytics(profile, pitchQuery.data || []);

  return (
    <div className="space-y-6 sm:space-y-8">
      {profile.type === "hitter" ? (
        <>
          <section className="rounded-[28px] border border-white/8 bg-slate-950/72 p-4 shadow-[0_20px_60px_rgba(0,0,0,0.35)] sm:p-6">
            <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
              <div>
                <div className="font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.24em] text-slate-500">Pitch Tracking</div>
                <div className="mt-2 text-[clamp(1.75rem,4vw,2.85rem)] font-['Bebas_Neue'] tracking-[0.08em] text-white">Interactive Strike Zone</div>
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.03] px-3 py-2 text-xs uppercase tracking-[0.16em] text-slate-400">
                <Crosshair className="h-3.5 w-3.5 text-sky-300" />
                Baseball Savant gamefeed
              </div>
            </div>
            <StrikeZoneChart pitches={pitchQuery.data || []} isLoading={pitchQuery.isLoading} />
          </section>

          <section className="grid grid-cols-1 gap-4 md:grid-cols-6 xl:grid-cols-12">
            <div className="md:col-span-3 xl:col-span-4">
              <DecisionSummary
                label="Decision Engine"
                value={`${analytics.propModel.hitProbability}% hit probability`}
                detail={`${analytics.propModel.edgeVsLine > 0 ? "+" : ""}${analytics.propModel.edgeVsLine}% edge vs 0.5 hit line • Risk ${analytics.propModel.riskTier} • Confidence ${analytics.propModel.confidenceScore}`}
                tone={analytics.propModel.riskTier === "A" || analytics.propModel.riskTier === "B" ? "emerald" : analytics.propModel.riskTier === "F" ? "rose" : "amber"}
              />
            </div>
            <div className="md:col-span-3 xl:col-span-4">
              <DecisionSummary
                label="Volatility System"
                value={`${analytics.volatility.consistencyScore}`}
                detail={`${analytics.volatility.label}${analytics.volatility.variance !== null ? ` • Variance ${analytics.volatility.variance.toFixed(3)}` : ""}`}
                tone={analytics.volatility.consistencyScore >= 70 ? "emerald" : analytics.volatility.consistencyScore <= 45 ? "rose" : "amber"}
              />
            </div>
            <div className="md:col-span-6 xl:col-span-4">
              <DecisionSummary
                label="Exploit Detection"
                value={analytics.exploit.headline}
                detail={analytics.exploit.detail}
                tone={analytics.exploit.level === "strong" ? "emerald" : analytics.exploit.level === "watch" ? "amber" : "slate"}
              />
            </div>
          </section>

          <section className="grid grid-cols-1 gap-4 md:grid-cols-6 xl:grid-cols-12">
            <div className="md:col-span-3 xl:col-span-4 rounded-[28px] border border-white/8 bg-slate-950/72 p-5">
              <div className="mb-4 flex items-center gap-2">
                <Gauge className="h-4 w-4 text-emerald-300" />
                <div className="font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.2em] text-slate-500">Swing Profile</div>
              </div>
              <div className="space-y-3 text-sm text-slate-300">
                <div className="flex items-center justify-between"><span>Chase%</span><span>{analytics.swingProfile.chasePct?.toFixed(1) ?? "N/A"}%</span></div>
                <div className="flex items-center justify-between"><span>Zone Swing%</span><span>{analytics.swingProfile.zoneSwingPct?.toFixed(1) ?? "N/A"}%</span></div>
                <div className="flex items-center justify-between"><span>Contact%</span><span>{analytics.swingProfile.contactPct?.toFixed(1) ?? "N/A"}%</span></div>
              </div>
            </div>

            <div className="md:col-span-3 xl:col-span-4 rounded-[28px] border border-white/8 bg-slate-950/72 p-5">
              <div className="mb-4 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-sky-300" />
                <div className="font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.2em] text-slate-500">Predictive Layer</div>
              </div>
              <div className="space-y-3 text-sm text-slate-300">
                <div className="flex items-center justify-between"><span>Next pitch</span><span>{analytics.predictive.nextPitchType || "N/A"}</span></div>
                <div className="flex items-center justify-between"><span>Pitch probability</span><span>{analytics.predictive.nextPitchProbability?.toFixed(1) ?? "N/A"}%</span></div>
                <div className="flex items-center justify-between"><span>Damage probability</span><span>{analytics.predictive.damageProbability?.toFixed(1) ?? "N/A"}%</span></div>
                <div className="flex items-center justify-between"><span>Swing probability</span><span>{analytics.predictive.swingProbability?.toFixed(1) ?? "N/A"}%</span></div>
              </div>
            </div>

            <div className="md:col-span-6 xl:col-span-4 rounded-[28px] border border-white/8 bg-slate-950/72 p-5">
              <div className="mb-4 flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-amber-200" />
                <div className="font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.2em] text-slate-500">Moneyball Signal</div>
              </div>
              <div className="text-[clamp(1.35rem,2vw,2rem)] font-['Bebas_Neue'] tracking-[0.08em] text-white">{analytics.moneyball.label}</div>
              <div className="mt-2 text-sm leading-7 text-slate-300">{analytics.moneyball.detail}</div>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-4 md:grid-cols-6 xl:grid-cols-12">
            <div className="md:col-span-3 xl:col-span-5 rounded-[28px] border border-white/8 bg-slate-950/72 p-5">
              <div className="mb-4 flex items-center gap-2">
                <Radar className="h-4 w-4 text-rose-300" />
                <div className="font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.2em] text-slate-500">Best vs pitch types</div>
              </div>
              <div className="space-y-3">
                {analytics.pitchTypePerformance.slice(0, 5).map((entry) => (
                  <div key={entry.pitchType} className="rounded-2xl border border-white/8 bg-white/[0.03] p-3 text-sm text-slate-300">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-semibold text-white">{entry.pitchType}</span>
                      <span>{entry.pitchesSeen} seen</span>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-slate-400">
                      <span>Swing {entry.swingPct?.toFixed(1) ?? "N/A"}%</span>
                      <span>Whiff {entry.whiffPct?.toFixed(1) ?? "N/A"}%</span>
                      <span>Damage {(entry.damageRate ?? 0).toFixed(3)}</span>
                      <span>EV {entry.averageExitVelocity?.toFixed(1) ?? "N/A"}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="md:col-span-3 xl:col-span-7 rounded-[28px] border border-white/8 bg-slate-950/72 p-5">
              <div className="mb-4 font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.2em] text-slate-500">Contact quality timeline</div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {analytics.contactQualityTimeline.map((point) => (
                  <div key={point.label} className="rounded-2xl border border-white/8 bg-white/[0.03] p-3 text-sm text-slate-300">
                    <div className="font-semibold text-white">{point.label}</div>
                    <div className="mt-2">EV {point.averageExitVelocity?.toFixed(1) ?? "N/A"} mph</div>
                    <div>Barrel {point.barrelRate?.toFixed(1) ?? "N/A"}%</div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </>
      ) : null}

      <ProfileView profile={profile} />
    </div>
  );
}

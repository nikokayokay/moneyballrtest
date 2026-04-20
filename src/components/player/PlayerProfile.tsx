import { Crosshair, Gauge, Radar, ShieldAlert, TrendingUp } from "lucide-react";
import type { PlayerProfile as PlayerProfileData } from "@/src/lib/mlb";
import { usePitchData } from "@/src/hooks/usePitchData";
import { usePlayerAnalytics } from "@/src/hooks/usePlayerAnalytics";
import { StrikeZoneChart } from "@/src/components/charts/StrikeZoneChart";
import { DecisionSummary } from "@/src/components/decision/DecisionSummary";
import { ProfileView } from "@/src/components/profile-view";
import {
  ContactQualityModule,
  CurrentFormModule,
  MatchupContextModule,
  SprayOrPitchMixModule,
  SplitViewModule,
} from "@/src/components/player/PlayerIntelligenceModules";

type PlayerProfileProps = {
  profile: PlayerProfileData;
};

export function PlayerProfile({ profile }: PlayerProfileProps) {
  const pitchQuery = usePitchData(profile.identity.playerId, profile.type, profile.liveGame.state === "LIVE");
  const analytics = usePlayerAnalytics(profile, pitchQuery.data || []);
  const metric = (value: number | null | undefined, suffix = "") => value === null || value === undefined ? "Not enough data" : `${value.toFixed(1)}${suffix}`;

  return (
    <div className="space-y-6 sm:space-y-8">
      <ProfileView profile={profile} />
      <CurrentFormModule profile={profile} />
      <MatchupContextModule profile={profile} />
      <SplitViewModule profile={profile} />
      <ContactQualityModule profile={profile} />

      {profile.type === "hitter" ? (
        <>
          <section className="bg-[#090f19]">
            <div className="flex flex-wrap items-end justify-between gap-3 border-b border-white/8 px-4 py-3">
              <div>
                <div className="font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.24em] text-slate-500">Pitch Tracking</div>
                <div className="mt-2 text-[clamp(1.75rem,4vw,2.85rem)] font-['Bebas_Neue'] tracking-[0.08em] text-white">Interactive Strike Zone</div>
              </div>
              <div className="inline-flex items-center gap-2 border border-white/8 bg-[#101827] px-3 py-2 text-xs uppercase tracking-[0.16em] text-slate-400">
                <Crosshair className="h-3.5 w-3.5 text-sky-300" />
                Baseball Savant gamefeed
              </div>
            </div>
            <div className="p-3 sm:p-4">
              <StrikeZoneChart pitches={pitchQuery.data || []} isLoading={pitchQuery.isLoading} />
            </div>
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
            <div className="surface-secondary p-5 md:col-span-3 xl:col-span-4">
              <div className="mb-4 flex items-center gap-2">
                <Gauge className="h-4 w-4 text-emerald-300" />
                <div className="font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.2em] text-slate-500">Swing Profile</div>
              </div>
              <div className="space-y-3 text-sm text-slate-300">
                <div className="flex items-center justify-between"><span>Chase%</span><span>{metric(analytics.swingProfile.chasePct, "%")}</span></div>
                <div className="flex items-center justify-between"><span>Zone Swing%</span><span>{metric(analytics.swingProfile.zoneSwingPct, "%")}</span></div>
                <div className="flex items-center justify-between"><span>Contact%</span><span>{metric(analytics.swingProfile.contactPct, "%")}</span></div>
              </div>
            </div>

            <div className="surface-secondary p-5 md:col-span-3 xl:col-span-4">
              <div className="mb-4 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-sky-300" />
                <div className="font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.2em] text-slate-500">Predictive Layer</div>
              </div>
              <div className="space-y-3 text-sm text-slate-300">
                <div className="flex items-center justify-between"><span>Next pitch</span><span>{analytics.predictive.nextPitchType || "Not enough data"}</span></div>
                <div className="flex items-center justify-between"><span>Pitch probability</span><span>{metric(analytics.predictive.nextPitchProbability, "%")}</span></div>
                <div className="flex items-center justify-between"><span>Damage probability</span><span>{metric(analytics.predictive.damageProbability, "%")}</span></div>
                <div className="flex items-center justify-between"><span>Swing probability</span><span>{metric(analytics.predictive.swingProbability, "%")}</span></div>
              </div>
            </div>

            <div className="surface-secondary p-5 md:col-span-6 xl:col-span-4">
              <div className="mb-4 flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-amber-200" />
                <div className="font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.2em] text-slate-500">Moneyball Signal</div>
              </div>
              <div className="text-[clamp(1.35rem,2vw,2rem)] font-['Bebas_Neue'] tracking-[0.08em] text-white">{analytics.moneyball.label}</div>
              <div className="mt-2 text-sm leading-7 text-slate-300">{analytics.moneyball.detail}</div>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-4 md:grid-cols-6 xl:grid-cols-12">
            <div className="surface-secondary p-5 md:col-span-3 xl:col-span-5">
              <div className="mb-4 flex items-center gap-2">
                <Radar className="h-4 w-4 text-rose-300" />
                <div className="font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.2em] text-slate-500">Best vs pitch types</div>
              </div>
              <div className="space-y-3">
                {analytics.pitchTypePerformance.slice(0, 5).map((entry) => (
                  <div key={entry.pitchType} className="border border-white/8 bg-white/[0.03] p-3 text-sm text-slate-300">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-semibold text-white">{entry.pitchType}</span>
                      <span>{entry.pitchesSeen} seen</span>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-slate-400">
                      <span>Swing {metric(entry.swingPct, "%")}</span>
                      <span>Whiff {metric(entry.whiffPct, "%")}</span>
                      <span>Damage {(entry.damageRate ?? 0).toFixed(3)}</span>
                      <span>EV {metric(entry.averageExitVelocity)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="surface-secondary p-5 md:col-span-3 xl:col-span-7">
              <div className="mb-4 font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.2em] text-slate-500">Contact quality timeline</div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {analytics.contactQualityTimeline.map((point) => (
                  <div key={point.label} className="border border-white/8 bg-white/[0.03] p-3 text-sm text-slate-300">
                    <div className="font-semibold text-white">{point.label}</div>
                    <div className="mt-2">EV {point.averageExitVelocity === null ? "Not enough data" : `${point.averageExitVelocity.toFixed(1)} mph`}</div>
                    <div>Barrel {metric(point.barrelRate, "%")}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </>
      ) : null}
      <SprayOrPitchMixModule profile={profile} />
    </div>
  );
}

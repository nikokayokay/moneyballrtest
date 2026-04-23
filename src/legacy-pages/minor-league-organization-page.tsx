import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Activity, RefreshCw, ShieldCheck } from "lucide-react";
import { AreaTrendChart } from "@/src/components/charts/AreaTrendChart";
import { FarmSystemPanel } from "@/src/components/milb/FarmSystemPanel";
import { PageShell } from "@/src/components/layout/PageShell";
import { fetchOrganizationPipeline } from "@/lib/milb-fetchers";

export function MinorLeagueOrganizationPage() {
  const { team } = useParams();
  const orgAbbr = (team || "").toUpperCase();
  const pipelineQuery = useQuery({
    queryKey: ["milb", "organization-pipeline", orgAbbr],
    queryFn: () => fetchOrganizationPipeline(orgAbbr, { rosterLimit: 30 }),
    enabled: Boolean(orgAbbr),
    staleTime: 5 * 60_000,
    refetchInterval: 10 * 60_000,
  });
  const pipeline = pipelineQuery.data;

  return (
    <PageShell>
      <Link to="/minor-leagues/organizations" className="mb-3 inline-flex items-center gap-2 font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.16em] text-slate-400 transition hover:text-emerald-300">
        <ArrowLeft className="h-3.5 w-3.5" />
        All organizations
      </Link>

      <section className="surface-primary overflow-hidden">
        <div className="grid grid-cols-1 gap-px bg-white/8 lg:grid-cols-[1.618fr_1fr]">
          <div className="bg-[#080d16] p-5">
            <div className="mb-label text-cyan-200">Organization pipeline</div>
            <h1 className="mb-title mt-3 text-[clamp(4rem,8vw,8rem)] text-white">{pipeline?.orgName || orgAbbr}</h1>
            <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-400">
              Live official MiLB affiliates and active rosters are normalized into one Moneyballr development pipeline with validation and movement tracking.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-px bg-white/8">
            <div className="bg-[#0a101a] p-4">
              <div className="font-['Bebas_Neue'] text-6xl leading-none text-emerald-300">{pipelineQuery.isLoading ? "..." : pipeline?.health.score || 0}</div>
              <div className="mb-label mt-1">farm score</div>
            </div>
            <div className="bg-[#0a101a] p-4">
              <div className="font-['Bebas_Neue'] text-6xl leading-none text-cyan-200">{pipeline?.health.strongestLevel || "..."}</div>
              <div className="mb-label mt-1">strongest level</div>
            </div>
          </div>
        </div>
      </section>

      <section className="mb-section grid grid-cols-1 gap-3 lg:grid-cols-[1.618fr_1fr]">
        <FarmSystemPanel orgAbbr={orgAbbr} teamName={pipeline?.orgName} />
        <section className="surface-secondary p-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-300" />
            <div className="mb-label text-emerald-300">Health check</div>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-px bg-white/8">
            {[
              ["Affiliates", pipeline?.validation.affiliateCount || 0],
              ["Populated", pipeline?.validation.populatedAffiliateCount || 0],
              ["Players", pipeline?.health.playerCount || 0],
            ].map(([label, value]) => (
              <div key={label} className="bg-[#080d16] p-3">
                <div className="font-['Bebas_Neue'] text-4xl leading-none text-white">{value}</div>
                <div className="mb-label mt-1 text-[8px]">{label}</div>
              </div>
            ))}
          </div>
          <div className="mb-label mt-5 text-cyan-200">Validation layer</div>
          <div className="mt-3 space-y-3">
            {pipelineQuery.isLoading ? (
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <RefreshCw className="h-4 w-4 animate-spin text-cyan-200" />
                Validating affiliate count, roster population, and duplicate player IDs...
              </div>
            ) : null}
            {pipeline?.validation.issues.length ? pipeline.validation.issues.map((issue) => (
              <div key={issue} className="border-t border-white/8 pt-3 text-sm leading-6 text-slate-400">
                {issue}
              </div>
            )) : null}
            {pipeline?.validation.ok ? <div className="text-sm text-slate-500">Official affiliate and roster checks passed for this refresh window.</div> : null}
          </div>
        </section>
      </section>

      <section className="mb-section grid grid-cols-1 gap-3 lg:grid-cols-[1fr_1.618fr]">
        <AreaTrendChart
          eyebrow="Level strength"
          title="Affiliate signal"
          points={(pipeline?.affiliates || []).map((entry) => ({
            label: entry.level,
            value: entry.players.length
              ? entry.players.reduce((sum, player) => sum + player.prospect.score, 0) / entry.players.length
              : 0,
          }))}
          valueLabel="score"
        />
        <section className="surface-secondary p-4">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-cyan-200" />
            <div className="mb-label text-cyan-200">Top prospects in organization</div>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
            {(pipeline?.health.topProspects || []).map((player) => (
              <Link key={player.id} to={`/minor-leagues/players/${player.id}`} className="border border-white/8 bg-white/[0.025] p-3 transition hover:border-emerald-300/25">
                <div className="mb-label text-cyan-200">{player.affiliate.level} · {player.position}</div>
                <div className="mt-2 font-['Barlow_Condensed'] text-2xl font-semibold uppercase tracking-[0.08em] text-white">{player.name}</div>
                <div className="mt-2 text-sm text-slate-500">{player.affiliate.teamName}</div>
                <div className="mt-3 font-['Bebas_Neue'] text-4xl leading-none text-emerald-300">{player.prospect.score}</div>
              </Link>
            ))}
            {!pipeline?.health.topProspects.length ? <div className="text-sm text-slate-500">Official player scoring appears after roster refresh completes.</div> : null}
          </div>
        </section>
      </section>
    </PageShell>
  );
}

import { Link, Navigate, useParams } from "react-router-dom";
import { useRef } from "react";
import { ArrowLeft, BarChart3, GitCompare, Radar, TimerReset } from "lucide-react";
import { AreaTrendChart } from "@/src/components/charts/AreaTrendChart";
import { FarmSystemPanel } from "@/src/components/milb/FarmSystemPanel";
import { ProspectCard } from "@/src/components/milb/ProspectCard";
import { PageShell } from "@/src/components/layout/PageShell";
import { ExportButton } from "@/src/components/share/ExportButton";
import { PROSPECTS, type Prospect } from "@/src/data/milb";

function formatDecimal(value?: number) {
  if (!Number.isFinite(value)) return "N/A";
  return Number(value).toFixed(3).replace(/^0/, "");
}

function hitterStats(prospect: Prospect) {
  return [
    { label: "AVG", raw: formatDecimal(prospect.stats.avg), adjusted: formatDecimal(prospect.adjusted.avg) },
    { label: "OBP", raw: formatDecimal(prospect.stats.obp), adjusted: formatDecimal(prospect.adjusted.obp) },
    { label: "SLG", raw: formatDecimal(prospect.stats.slg), adjusted: formatDecimal(prospect.adjusted.slg) },
    { label: "OPS", raw: formatDecimal(prospect.stats.ops), adjusted: formatDecimal(prospect.adjusted.ops) },
    { label: "HR", raw: prospect.stats.hr?.toString() || "N/A", adjusted: prospect.adjusted.hr?.toString() || "N/A" },
  ];
}

function pitcherStats(prospect: Prospect) {
  return [
    { label: "ERA", raw: prospect.stats.era?.toFixed(2) || "N/A", adjusted: prospect.adjusted.era?.toFixed(2) || "N/A" },
    { label: "WHIP", raw: prospect.stats.whip?.toFixed(2) || "N/A", adjusted: prospect.adjusted.whip?.toFixed(2) || "N/A" },
    { label: "K/9", raw: prospect.stats.kPer9?.toFixed(1) || "N/A", adjusted: prospect.adjusted.kPer9?.toFixed(1) || "N/A" },
    { label: "BB/9", raw: prospect.stats.bbPer9?.toFixed(1) || "N/A", adjusted: prospect.adjusted.bbPer9?.toFixed(1) || "N/A" },
    { label: "Velo", raw: prospect.stats.avgVelo?.toFixed(1) || "N/A", adjusted: prospect.stats.avgVelo?.toFixed(1) || "N/A" },
  ];
}

function trendCopy(trend: Prospect["trend"]) {
  if (trend === "rising") return "Development trend is moving up relative to level and age.";
  if (trend === "falling") return "Current production is carrying enough risk to pull the signal down.";
  return "Profile is stable, with translation depending on the next level test.";
}

export function ProspectPage() {
  const { prospectId } = useParams();
  const exportRef = useRef<HTMLElement | null>(null);
  const prospect = PROSPECTS.find((item) => item.id === prospectId);
  if (!prospect) return <Navigate to="/minor-leagues" replace />;

  const stats = prospect.type === "pitcher" ? pitcherStats(prospect) : hitterStats(prospect);
  const comparison = PROSPECTS
    .filter((item) => item.id !== prospect.id && item.type === prospect.type)
    .sort((a, b) => Math.abs(a.developmentScore - prospect.developmentScore) - Math.abs(b.developmentScore - prospect.developmentScore))[0];

  return (
    <PageShell>
      <Link to="/minor-leagues" className="mb-3 inline-flex items-center gap-2 font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.16em] text-slate-400 transition hover:text-emerald-300">
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to prospects
      </Link>

      <section ref={exportRef} className="surface-primary overflow-hidden">
        <div className="grid grid-cols-1 gap-px bg-white/8 lg:grid-cols-[1.618fr_1fr]">
          <div className="bg-[#080d16] p-4 sm:p-5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.16em] text-cyan-200">{prospect.level}</span>
              <span className="border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.16em] text-emerald-200">{prospect.trend}</span>
              {prospect.ranking ? <span className="border border-yellow-200/20 bg-yellow-200/10 px-3 py-1 font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.16em] text-yellow-100">Top 100 #{prospect.ranking}</span> : null}
            </div>
            <h1 className="mb-title mt-4 text-[clamp(4rem,8vw,8rem)] text-white">{prospect.name}</h1>
            <div className="mb-meta text-sm text-slate-400">
              {prospect.organization} · {prospect.position} · Age {prospect.age} · ETA {prospect.eta}
            </div>
            <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-300">{prospect.ceiling}</p>
            <div className="mt-4">
              <ExportButton
                targetRef={exportRef}
                filename={`${prospect.name}-moneyballr-prospect-card`}
                caption={`${prospect.name} prospect snapshot: ${prospect.organization}, ${prospect.level}, dev score ${prospect.developmentScore}.`}
              />
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              {prospect.tags.map((tag) => (
                <span key={tag} className="border border-white/8 bg-white/[0.035] px-2.5 py-1 font-['JetBrains_Mono'] text-[9px] uppercase tracking-[0.14em] text-slate-300">{tag}</span>
              ))}
            </div>
          </div>
          <div className="bg-[#0a101a] p-4 sm:p-5">
            <div className="mb-label text-emerald-300">Projection panel</div>
            <div className="mt-4 grid grid-cols-2 gap-px bg-white/8">
              <div className="bg-[#080d16] p-4">
                <div className="font-['Bebas_Neue'] text-6xl leading-none tracking-[0.06em] text-emerald-300">{prospect.developmentScore}</div>
                <div className="mb-label mt-1">dev score</div>
              </div>
              <div className="bg-[#080d16] p-4">
                <div className="font-['Bebas_Neue'] text-6xl leading-none tracking-[0.06em] text-cyan-200">{prospect.eta}</div>
                <div className="mb-label mt-1">eta</div>
              </div>
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-400">{trendCopy(prospect.trend)}</p>
            <div className="mt-4">
              <div className="mb-label">Comparable shape</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {prospect.comparablePlayers.map((player) => (
                  <span key={player} className="border border-white/8 bg-white/[0.03] px-3 py-1.5 font-['Barlow_Condensed'] text-lg font-semibold uppercase tracking-[0.08em] text-white">{player}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mb-section grid grid-cols-1 gap-3 lg:grid-cols-[1.618fr_1fr]">
        <section className="surface-secondary p-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-emerald-300" />
            <div className="mb-label text-emerald-300">Minor to MLB translation</div>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-px bg-white/8 sm:grid-cols-5">
            {stats.map((stat) => (
              <div key={stat.label} className="bg-[#080d16] p-3">
                <div className="mb-label text-[8px]">{stat.label}</div>
                <div className="mt-2 font-['Bebas_Neue'] text-4xl leading-none tracking-[0.06em] text-white">{stat.adjusted}</div>
                <div className="mt-2 text-xs text-slate-500">raw {stat.raw}</div>
              </div>
            ))}
          </div>
        </section>
        <section className="surface-secondary p-4">
          <div className="flex items-center gap-2">
            <TimerReset className="h-4 w-4 text-cyan-200" />
            <div className="mb-label text-cyan-200">Development timeline</div>
          </div>
          <div className="mt-4 space-y-3">
            {prospect.timeline.map((step) => (
              <div key={`${step.label}-${step.score}`} className="grid grid-cols-[4rem_1fr_auto] gap-3 border-t border-white/8 pt-3">
                <div className="mb-label text-[8px] text-slate-500">{step.level}</div>
                <div>
                  <div className="font-['Barlow_Condensed'] text-lg font-semibold uppercase tracking-[0.08em] text-white">{step.label}</div>
                  <div className="text-sm text-slate-500">{step.note}</div>
                </div>
                <div className="font-['Bebas_Neue'] text-3xl text-emerald-300">{step.score}</div>
              </div>
            ))}
          </div>
        </section>
      </section>

      <section className="mb-section grid grid-cols-1 gap-3 lg:grid-cols-[1fr_1.618fr]">
        <AreaTrendChart
          eyebrow="Stat progression"
          title="Development score path"
          points={prospect.timeline.map((step) => ({ label: step.label, value: step.score }))}
          valueLabel="score"
        />
        <section className="surface-secondary p-4">
          <div className="flex items-center gap-2">
            <Radar className="h-4 w-4 text-yellow-200" />
            <div className="mb-label text-yellow-200">Growth focus</div>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
            {(prospect.type === "pitcher"
              ? ["Command efficiency", "Velocity carry", "Starter durability"]
              : ["Contact stability", "Damage translation", "Zone discipline"]
            ).map((item, index) => (
              <div key={item} className="border border-white/8 bg-white/[0.025] p-3">
                <div className="font-['Bebas_Neue'] text-4xl leading-none text-slate-600">0{index + 1}</div>
                <div className="mt-2 font-['Barlow_Condensed'] text-xl font-semibold uppercase tracking-[0.08em] text-white">{item}</div>
                <p className="mt-2 text-sm leading-5 text-slate-500">Tracked as a development indicator before MLB promotion modeling.</p>
              </div>
            ))}
          </div>
        </section>
      </section>

      {comparison ? (
        <section className="mb-section surface-primary p-4">
          <div className="mb-label text-cyan-200">Comparison engine</div>
          <div className="mt-4 grid grid-cols-1 items-stretch gap-3 lg:grid-cols-[1fr_auto_1fr]">
            <ProspectCard prospect={prospect} compact />
            <div className="flex items-center justify-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/[0.035]">
                <GitCompare className="h-5 w-5 text-cyan-200" />
              </div>
            </div>
            <ProspectCard prospect={comparison} compact />
          </div>
        </section>
      ) : null}

      <section className="mb-section">
        <FarmSystemPanel orgAbbr={prospect.orgAbbr} teamName={prospect.organization} />
      </section>
    </PageShell>
  );
}

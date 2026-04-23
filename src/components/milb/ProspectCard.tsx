import { Link } from "react-router-dom";
import { ArrowUpRight, Gauge, TrendingDown, TrendingUp } from "lucide-react";
import type { Prospect } from "@/src/data/milb";

function formatDecimal(value?: number) {
  if (!Number.isFinite(value)) return "N/A";
  return Number(value).toFixed(3).replace(/^0/, "");
}

function formatRate(value?: number) {
  if (!Number.isFinite(value)) return "N/A";
  return `${Number(value).toFixed(1)}%`;
}

function trendTone(trend: Prospect["trend"]) {
  if (trend === "rising") return "border-emerald-300/25 bg-emerald-300/10 text-emerald-200";
  if (trend === "falling") return "border-rose-300/25 bg-rose-300/10 text-rose-200";
  return "border-cyan-300/20 bg-cyan-300/10 text-cyan-200";
}

function TrendIcon({ trend }: { trend: Prospect["trend"] }) {
  if (trend === "rising") return <TrendingUp className="h-3.5 w-3.5" />;
  if (trend === "falling") return <TrendingDown className="h-3.5 w-3.5" />;
  return <Gauge className="h-3.5 w-3.5" />;
}

export function ProspectCard({ prospect, compact = false }: { prospect: Prospect; compact?: boolean }) {
  const primaryStat = prospect.type === "pitcher"
    ? { label: "Adj ERA", value: prospect.adjusted.era?.toFixed(2) || "N/A" }
    : { label: "Adj OPS", value: formatDecimal(prospect.adjusted.ops) };
  const secondaryStat = prospect.type === "pitcher"
    ? { label: "K/9", value: prospect.adjusted.kPer9?.toFixed(1) || "N/A" }
    : { label: "K / BB", value: `${formatRate(prospect.stats.kRate)} / ${formatRate(prospect.stats.bbRate)}` };

  return (
    <Link
      to={`/minor-leagues/players/${prospect.id}`}
      className={`group block border border-white/8 bg-[#080e18] transition duration-200 hover:-translate-y-0.5 hover:border-emerald-300/25 hover:bg-[#0b1421] ${
        compact ? "p-3" : "p-4"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="mb-label text-cyan-200">{prospect.level}</span>
            {prospect.ranking ? (
              <span className="border border-yellow-200/20 bg-yellow-200/10 px-2 py-0.5 font-['JetBrains_Mono'] text-[9px] uppercase tracking-[0.14em] text-yellow-100">
                #{prospect.ranking}
              </span>
            ) : null}
          </div>
          <div className="mb-title mt-2 truncate text-[clamp(1.9rem,2.6vw,2.7rem)] text-white">{prospect.name}</div>
          <div className="mb-meta text-xs text-slate-400">
            {prospect.orgAbbr} · {prospect.position} · Age {prospect.age} · ETA {prospect.eta}
          </div>
        </div>
        <div className="shrink-0 text-right">
          <div className="font-['Bebas_Neue'] text-4xl leading-none tracking-[0.06em] text-emerald-300">{prospect.developmentScore}</div>
          <div className="mb-label mt-1 text-[8px]">dev score</div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-px bg-white/8">
        {[primaryStat, secondaryStat].map((stat) => (
          <div key={stat.label} className="bg-[#0a101a] p-3">
            <div className="mb-label text-[8px]">{stat.label}</div>
            <div className="mt-1 font-['Barlow_Condensed'] text-xl font-semibold uppercase tracking-[0.08em] text-slate-100">{stat.value}</div>
          </div>
        ))}
      </div>

      {!compact ? (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 border px-2.5 py-1 font-['JetBrains_Mono'] text-[9px] uppercase tracking-[0.14em] ${trendTone(prospect.trend)}`}>
            <TrendIcon trend={prospect.trend} />
            {prospect.trend}
          </span>
          {prospect.tags.slice(0, 2).map((tag) => (
            <span key={tag} className="border border-white/8 bg-white/[0.035] px-2.5 py-1 font-['JetBrains_Mono'] text-[9px] uppercase tracking-[0.14em] text-slate-400">
              {tag}
            </span>
          ))}
        </div>
      ) : null}

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-white/8 pt-3">
        <p className="line-clamp-2 text-sm leading-5 text-slate-400">{prospect.ceiling}</p>
        <ArrowUpRight className="h-4 w-4 shrink-0 text-slate-500 transition group-hover:text-emerald-300" />
      </div>
    </Link>
  );
}

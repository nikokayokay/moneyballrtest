import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { affiliateRowsForTeam, type DashboardTeam } from "@/src/data/team-dashboard";

export function AffiliateLadder({ team, className }: { team: DashboardTeam; className?: string }) {
  const affiliates = affiliateRowsForTeam(team);

  return (
    <section className={cn("rounded-3xl border border-white/10 bg-[#070d16] p-4", className)}>
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.18em] text-cyan-200">Affiliate pipeline</div>
          <h2 className="mt-2 font-['Bebas_Neue'] text-4xl leading-none tracking-[0.06em] text-white">AAA to A ladder</h2>
        </div>
        <Link to={`/minor-leagues/organizations/${team.abbr}`} className="font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.16em] text-emerald-300">
          Full MiLB page
        </Link>
      </div>
      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 2xl:grid-cols-4">
        {affiliates.map((affiliate) => (
          <Link
            key={affiliate.level}
            to={`/minor-leagues/levels/${affiliate.level.toLowerCase().replace("single-a", "a")}`}
            className="group rounded-2xl border border-white/8 bg-white/[0.025] p-3 transition hover:-translate-y-0.5 hover:border-emerald-300/25 hover:bg-white/[0.04]"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/8 bg-[#050914] font-['Bebas_Neue'] text-2xl tracking-[0.06em] text-cyan-200">
                {affiliate.level === "Single-A" ? "A" : affiliate.level.replace("High-", "H")}
              </div>
              <ArrowUpRight className="h-4 w-4 text-slate-600 transition group-hover:text-emerald-300" />
            </div>
            <div className="mt-3 font-['Barlow_Condensed'] text-xl font-semibold uppercase tracking-[0.08em] text-white">{affiliate.team}</div>
            <div className="mt-1 text-xs text-slate-500">{affiliate.location} · {affiliate.record}</div>
            <div className="mt-3 grid grid-cols-2 gap-px overflow-hidden rounded-xl bg-white/8">
              <MiniCell label="Top" value={affiliate.topProspect?.name || "Tracking"} />
              <MiniCell label="Trend" value={affiliate.trendingPlayer?.name || "Pending"} />
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function MiniCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[#080d16] p-2">
      <div className="truncate text-xs text-slate-300">{value}</div>
      <div className="mt-1 font-['JetBrains_Mono'] text-[7px] uppercase tracking-[0.14em] text-slate-600">{label}</div>
    </div>
  );
}

import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { DashboardTeam } from "@/src/data/team-dashboard";

const toneClass = {
  good: "border-emerald-300/25 bg-emerald-300/10 text-emerald-200",
  warn: "border-yellow-200/25 bg-yellow-200/10 text-yellow-100",
  bad: "border-rose-300/25 bg-rose-300/10 text-rose-200",
  neutral: "border-cyan-300/18 bg-cyan-300/8 text-cyan-100",
};

export function TeamIdentityPanel({ team }: { team: DashboardTeam }) {
  return (
    <section className="flex min-h-full flex-col gap-5 p-5">
      <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-3xl border border-white/10 bg-[#080f1a]">
        <div className="absolute inset-8 rounded-full bg-[radial-gradient(circle,rgba(52,211,153,.24),transparent_62%)] blur-xl" />
        <motion.img
          src={team.logoUrl}
          alt={`${team.name} logo`}
          className="relative z-10 h-[62%] w-[62%] object-contain drop-shadow-[0_18px_45px_rgba(0,0,0,.45)]"
          whileHover={{ scale: 1.045, rotate: 1.5 }}
          transition={{ type: "spring", stiffness: 240, damping: 22 }}
        />
      </div>

      <div>
        <div className="font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.18em] text-cyan-200">{team.division}</div>
        <h1 className="mt-2 font-['Bebas_Neue'] text-6xl leading-none tracking-[0.06em] text-white">{team.name}</h1>
        <div className="mt-3 grid grid-cols-3 gap-px overflow-hidden rounded-2xl bg-white/10">
          {[
            ["Record", team.record],
            ["Payroll", team.payroll],
            ["Mode", team.mode],
          ].map(([label, value]) => (
            <div key={label} className="bg-[#09101b] p-3">
              <div className="font-['Barlow_Condensed'] text-xl font-semibold uppercase tracking-[0.08em] text-white">{value}</div>
              <div className="mt-1 font-['JetBrains_Mono'] text-[8px] uppercase tracking-[0.16em] text-slate-500">{label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {[
          ["Run Diff", team.runDifferential > 0 ? `+${team.runDifferential}` : String(team.runDifferential)],
          ["Farm Rank", `#${team.farmRank}`],
          ["Last 10", team.last10],
          ["Streak", team.streak],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-white/8 bg-white/[0.035] p-3">
            <div className="font-['Bebas_Neue'] text-3xl leading-none tracking-[0.06em] text-white">{value}</div>
            <div className="mt-1 font-['JetBrains_Mono'] text-[8px] uppercase tracking-[0.16em] text-slate-500">{label}</div>
          </div>
        ))}
      </div>

      <div>
        <div className="font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.18em] text-slate-500">Metrics strip</div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          {team.metrics.map((metric) => (
            <Link
              key={metric.label}
              to={metric.href}
              title={`${metric.label}: ${metric.value}. Click for deeper stat context.`}
              className={cn("rounded-2xl border p-3 transition hover:-translate-y-0.5 hover:brightness-110", toneClass[metric.tone])}
            >
              <div className="font-['Barlow_Condensed'] text-xl font-semibold uppercase tracking-[0.08em]">{metric.value}</div>
              <div className="mt-1 font-['JetBrains_Mono'] text-[8px] uppercase tracking-[0.16em] opacity-70">{metric.label}</div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

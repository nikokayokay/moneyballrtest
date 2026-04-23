import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { AreaTrendChart } from "@/src/components/charts/AreaTrendChart";
import type { DashboardTeam } from "@/src/data/team-dashboard";

type Mode = "Hitting" | "Pitching" | "Fielding" | "Advanced";

export function TeamAnalytics({ team, className }: { team: DashboardTeam; className?: string }) {
  const [mode, setMode] = useState<Mode>("Hitting");
  const points = useMemo(() => {
    const labels = ["G-5", "G-4", "G-3", "G-2", "Now"];
    if (mode === "Pitching") return team.trends.era.map((value, index) => ({ label: labels[index], value }));
    if (mode === "Advanced") return team.trends.runDiff.map((value, index) => ({ label: labels[index], value }));
    if (mode === "Fielding") return team.trends.runDiff.map((value, index) => ({ label: labels[index], value: Math.max(0, 50 + value * 0.5) }));
    return team.trends.ops.map((value, index) => ({ label: labels[index], value }));
  }, [mode, team]);

  return (
    <section className={cn("rounded-3xl border border-white/10 bg-[#070d16] p-4", className)}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.18em] text-cyan-200">Analytics core</div>
          <h2 className="mt-2 font-['Bebas_Neue'] text-4xl leading-none tracking-[0.06em] text-white">{team.abbr} trend desk</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {(["Hitting", "Pitching", "Fielding", "Advanced"] as Mode[]).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setMode(item)}
              className={cn(
                "rounded-full border px-3 py-1.5 font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.14em] transition",
                mode === item ? "border-emerald-300/35 bg-emerald-300/10 text-emerald-200" : "border-white/8 bg-white/[0.025] text-slate-500 hover:text-white",
              )}
            >
              {item}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-4 grid grid-cols-1 gap-3 xl:grid-cols-[1.618fr_1fr]">
        <AreaTrendChart title={mode === "Pitching" ? "ERA trend" : mode === "Advanced" ? "Run differential" : mode === "Fielding" ? "Run prevention index" : "Team OPS trend"} eyebrow={mode} points={points} valueLabel={mode.toLowerCase()} className="rounded-2xl" />
        <div className="rounded-2xl border border-white/8 bg-white/[0.025] p-4">
          <div className="font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.18em] text-slate-500">Decision read</div>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            {mode === "Pitching"
              ? `${team.name} is currently profiled around a ${team.era.toFixed(2)} ERA with staff movement monitored against MiLB callup depth.`
              : mode === "Advanced"
                ? `Run differential sits at ${team.runDifferential > 0 ? "+" : ""}${team.runDifferential}, making the current roster signal ${team.runDifferential >= 20 ? "contender-grade" : "still volatile"}.`
                : `${team.name} owns a ${team.ops.toFixed(3).replace(/^0/, "")} OPS signal, led by ${team.topPlayer} and reinforced by recent form.`}
          </p>
        </div>
      </div>
    </section>
  );
}

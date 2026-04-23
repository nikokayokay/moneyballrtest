import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { classifyPlayerArchetype } from "@/lib/archetypes";
import { percentileRank } from "@/lib/league-baselines";
import { PROSPECTS } from "@/src/data/milb";

const pool = PROSPECTS.map((prospect) => ({
  id: prospect.id,
  name: prospect.name,
  team: prospect.orgAbbr,
  ops: prospect.adjusted.ops || 0,
  hr: prospect.adjusted.hr || 0,
  kRate: prospect.stats.kRate || prospect.stats.kPer9 || 0,
  value: prospect.developmentScore,
  archetype: classifyPlayerArchetype(prospect.type === "pitcher"
    ? { pitching: { k9: prospect.stats.kPer9, bb9: prospect.stats.bbPer9, era: prospect.stats.era } }
    : { hitting: { ops: prospect.adjusted.ops, hr: prospect.adjusted.hr, kRate: prospect.stats.kRate, bbRate: prospect.stats.bbRate, avg: prospect.adjusted.avg } }),
}));

function Radar({ player, maxes }: { player: (typeof pool)[number]; maxes: Record<"ops" | "hr" | "kRate" | "value", number> }) {
  const metrics = [
    player.ops / Math.max(0.001, maxes.ops),
    player.hr / Math.max(1, maxes.hr),
    player.kRate / Math.max(1, maxes.kRate),
    player.value / Math.max(1, maxes.value),
  ].map((value) => Math.max(0.12, Math.min(1, value)));
  const points = metrics.map((value, index) => {
    const angle = -Math.PI / 2 + index * (Math.PI * 2 / metrics.length);
    const radius = 36 * value;
    return `${50 + Math.cos(angle) * radius},${50 + Math.sin(angle) * radius}`;
  }).join(" ");
  return (
    <svg viewBox="0 0 100 100" className="h-24 w-24">
      <polygon points="50,14 86,50 50,86 14,50" fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth="1" />
      <polygon points={points} fill="rgba(52,211,153,0.22)" stroke="rgb(110,231,183)" strokeWidth="2" />
    </svg>
  );
}

export function PlayerCompare({ className }: { className?: string }) {
  const [selected, setSelected] = useState<string[]>(pool.slice(0, 3).map((player) => player.id));
  const players = useMemo(() => pool.filter((player) => selected.includes(player.id)).slice(0, 4), [selected]);

  const toggle = (id: string) => {
    setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id].slice(-4));
  };

  return (
    <section className={cn("rounded-3xl border border-white/10 bg-[#070d16] p-4", className)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.18em] text-cyan-200">Player comparison</div>
          <h2 className="mt-2 font-['Bebas_Neue'] text-4xl leading-none tracking-[0.06em] text-white">Prospect value bars</h2>
        </div>
        <div className="flex max-w-xl flex-wrap gap-2">
          {pool.map((player) => (
            <button
              key={player.id}
              type="button"
              onClick={() => toggle(player.id)}
              className={cn("rounded-full border px-3 py-1.5 font-['JetBrains_Mono'] text-[9px] uppercase tracking-[0.14em]", selected.includes(player.id) ? "border-emerald-300/35 bg-emerald-300/10 text-emerald-200" : "border-white/8 bg-white/[0.025] text-slate-500")}
            >
              {player.name}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-5 space-y-5">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          {players.map((player) => {
            const maxes = {
              ops: Math.max(...players.map((item) => item.ops), 1),
              hr: Math.max(...players.map((item) => item.hr), 1),
              kRate: Math.max(...players.map((item) => item.kRate), 1),
              value: Math.max(...players.map((item) => item.value), 1),
            };
            const percentile = percentileRank(player.value, pool.map((item) => item.value));
            return (
              <div key={`${player.id}-radar`} className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.025] p-3">
                <Radar player={player} maxes={maxes} />
                <div className="min-w-0">
                  <div className="truncate font-['Barlow_Condensed'] text-2xl font-semibold uppercase tracking-[0.08em] text-white">{player.name}</div>
                  <div className="mt-1 font-['JetBrains_Mono'] text-[9px] uppercase tracking-[0.14em] text-cyan-200">{player.archetype}</div>
                  <div className="mt-2 text-xs text-slate-500">{percentile}th percentile value profile</div>
                </div>
              </div>
            );
          })}
        </div>
        {(["ops", "hr", "kRate", "value"] as const).map((metric) => {
          const max = Math.max(...players.map((player) => player[metric]), 1);
          return (
            <div key={metric}>
              <div className="font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.18em] text-slate-500">{metric === "kRate" ? "K% / K9" : metric === "value" ? "WAR-style value" : metric.toUpperCase()}</div>
              <div className="mt-2 space-y-2">
                {players.map((player) => (
                  <div key={`${player.id}-${metric}`} className="grid grid-cols-[8rem_1fr_4rem] items-center gap-3">
                    <div className="truncate text-sm text-slate-300">{player.name}</div>
                    <div className="h-2 overflow-hidden rounded-full bg-white/8">
                      <div className="h-full rounded-full bg-emerald-300" style={{ width: `${Math.max(4, (player[metric] / max) * 100)}%` }} />
                    </div>
                    <div className="text-right font-['JetBrains_Mono'] text-[10px] text-slate-400">{metric === "ops" ? player[metric].toFixed(3).replace(/^0/, "") : player[metric].toFixed(metric === "kRate" ? 1 : 0)}</div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

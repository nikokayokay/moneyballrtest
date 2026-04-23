import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DashboardTeam, TeamMode } from "@/src/data/team-dashboard";

function Sparkline({ values }: { values: number[] }) {
  const max = Math.max(...values);
  const min = Math.min(...values);
  const points = values.map((value, index) => {
    const x = (index / Math.max(1, values.length - 1)) * 100;
    const y = 26 - ((value - min) / Math.max(1, max - min)) * 22;
    return `${x},${y}`;
  }).join(" ");
  return (
    <svg viewBox="0 0 100 30" className="h-8 w-24" preserveAspectRatio="none">
      <polyline points={points} fill="none" stroke="#34d399" strokeWidth="2.4" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

export function TeamSelector({ teams, selected, onSelect }: { teams: DashboardTeam[]; selected: DashboardTeam; onSelect: (team: DashboardTeam) => void }) {
  const [query, setQuery] = useState("");
  const [division, setDivision] = useState("ALL");
  const [league, setLeague] = useState("ALL");
  const [mode, setMode] = useState<TeamMode | "ALL">("ALL");

  const divisions = useMemo(() => Array.from(new Set(teams.map((team) => team.division))).sort(), [teams]);
  const visible = teams.filter((team) => {
    const q = query.trim().toLowerCase();
    return (!q || `${team.name} ${team.abbr}`.toLowerCase().includes(q))
      && (division === "ALL" || team.division === division)
      && (league === "ALL" || team.league === league)
      && (mode === "ALL" || team.mode === mode);
  });

  return (
    <section className="rounded-3xl border border-white/10 bg-[#070d16] p-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-[16rem] items-center gap-2 rounded-2xl border border-white/10 bg-black/25 px-3 py-2">
          <Search className="h-4 w-4 text-cyan-200" />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search teams" className="w-full bg-transparent text-sm outline-none placeholder:text-slate-600" />
        </div>
        <div className="flex flex-wrap gap-2">
          <Select label="Division" value={division} values={["ALL", ...divisions]} onChange={setDivision} />
          <Select label="League" value={league} values={["ALL", "AL", "NL"]} onChange={setLeague} />
          <Select label="Mode" value={mode} values={["ALL", "Contender", "Middle", "Rebuild"]} onChange={(value) => setMode(value as TeamMode | "ALL")} />
        </div>
      </div>
      <div className="mt-3 flex gap-3 overflow-x-auto pb-1 scrollbar-thin">
        {visible.map((team) => (
          <motion.button
            key={team.abbr}
            type="button"
            onClick={() => onSelect(team)}
            whileHover={{ y: -3, width: 310 }}
            transition={{ type: "spring", stiffness: 260, damping: 24 }}
            className={cn(
              "group w-[252px] shrink-0 rounded-2xl border p-3 text-left transition",
              selected.abbr === team.abbr ? "border-emerald-300/35 bg-emerald-300/10" : "border-white/8 bg-white/[0.025] hover:border-cyan-300/20",
            )}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="truncate font-['Barlow_Condensed'] text-xl font-semibold uppercase tracking-[0.08em] text-white">{team.name}</div>
                <div className="mt-1 font-['JetBrains_Mono'] text-[9px] uppercase tracking-[0.14em] text-slate-500">{team.record} · L10 {team.last10} · {team.streak}</div>
              </div>
              <Sparkline values={team.sparkline} />
            </div>
            <div className="mt-3 hidden grid-cols-3 gap-px overflow-hidden rounded-xl bg-white/8 group-hover:grid">
              {[["Top", team.topPlayer], ["OPS", team.ops.toFixed(3).replace(/^0/, "")], ["ERA", team.era.toFixed(2)]].map(([label, value]) => (
                <div key={label} className="bg-[#080d16] p-2">
                  <div className="truncate text-xs text-slate-300">{value}</div>
                  <div className="mt-1 font-['JetBrains_Mono'] text-[7px] uppercase tracking-[0.14em] text-slate-600">{label}</div>
                </div>
              ))}
            </div>
          </motion.button>
        ))}
      </div>
    </section>
  );
}

function Select({ label, value, values, onChange }: { label: string; value: string; values: string[]; onChange: (value: string) => void }) {
  return (
    <label className="rounded-2xl border border-white/8 bg-white/[0.025] px-3 py-2">
      <span className="sr-only">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="bg-transparent font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.14em] text-slate-300 outline-none">
        {values.map((item) => <option key={item} value={item} className="bg-[#080d16] text-white">{item}</option>)}
      </select>
    </label>
  );
}

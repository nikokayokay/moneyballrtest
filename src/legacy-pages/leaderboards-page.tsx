import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { AreaTrendChart } from "@/src/components/charts/AreaTrendChart";
import { PageShell, SectionHeader } from "@/src/components/layout/PageShell";
import { InsightTag } from "@/src/components/player/InsightTag";
import { getImpactPlayers } from "@/lib/data-engine";
import { NEAR_REALTIME_REFRESH_MS } from "@/src/lib/live";

function tone(trend: string) {
  if (trend === "hot") return "positive" as const;
  if (trend === "cold") return "negative" as const;
  if (trend === "volatile") return "warning" as const;
  return "neutral" as const;
}

export function LeaderboardsPage() {
  const [params] = useSearchParams();
  const statParam = params.get("stat");
  const [preset, setPreset] = useState(statParam || "impact");
  const [teamFilter, setTeamFilter] = useState("all");
  const query = useQuery({
    queryKey: ["leaderboard-impact"],
    queryFn: () => getImpactPlayers(60),
    staleTime: NEAR_REALTIME_REFRESH_MS,
    refetchInterval: NEAR_REALTIME_REFRESH_MS,
  });
  const players = query.data || [];
  const teams = useMemo(() => [...new Set(players.map((player) => player.team))].sort(), [players]);
  const filtered = useMemo(() => {
    const base = teamFilter === "all" ? players : players.filter((player) => player.team === teamFilter);
    if (preset === "homeRuns") return [...base].sort((a, b) => b.score - a.score);
    if (preset === "ops" || preset === "avg" || preset === "strikeOuts" || preset === "era") return base;
    if (preset === "hottest") return [...base].sort((a, b) => (b.last7Woba || 0) - (a.last7Woba || 0));
    if (preset === "process") return [...base].sort((a, b) => ((b.last7Woba || 0) - (b.woba || 0)) - ((a.last7Woba || 0) - (a.woba || 0)));
    if (preset === "power") return base.filter((player) => (player.woba || 0) >= 0.340);
    return base;
  }, [players, preset, teamFilter]);

  return (
    <PageShell>
      <section className="surface-primary">
        <SectionHeader
          eyebrow="Leaderboards"
          title="Current impact board"
          copy="A dense ranking of hitters using current production, recent form, and sample-aware signal strength."
        />
        <div className="flex flex-wrap items-center gap-2 border-b border-white/8 p-3">
          {[
            ["impact", "Impact recent"],
            ["hottest", "Hottest hitters"],
            ["process", "Expected breakout"],
            ["power", "Power lately"],
          ].map(([value, label]) => (
            <button key={value} type="button" onClick={() => setPreset(value)} className={`border px-3 py-2 font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.14em] ${preset === value ? "border-emerald-300/30 bg-emerald-300/10 text-emerald-200" : "border-white/10 bg-white/[0.03] text-slate-400"}`}>
              {label}
            </button>
          ))}
          <select value={teamFilter} onChange={(event) => setTeamFilter(event.target.value)} className="border border-white/10 bg-[#090f19] px-3 py-2 font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.14em] text-slate-300 outline-none">
            <option value="all">All teams</option>
            {teams.map((team) => <option key={team} value={team}>{team}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-1 gap-0 lg:grid-cols-[minmax(0,1.618fr)_minmax(18rem,1fr)]">
          <div className="divide-y divide-white/8">
            {filtered.slice(0, 24).map((player) => (
              <Link key={player.id} to={`/player/${player.id}`} className="grid grid-cols-[2.75rem_3rem_1fr_auto] items-center gap-3 px-4 py-3 transition hover:bg-white/[0.025]">
                <div className="font-['Bebas_Neue'] text-2xl tracking-[0.08em] text-slate-400">#{player.rank}</div>
                <img src={player.src} alt={player.alt} className="player-headshot aspect-square w-full bg-slate-900" loading="lazy" />
                <div className="min-w-0">
                  <div className="truncate font-['Barlow_Condensed'] text-2xl font-semibold uppercase tracking-[0.06em] text-white">{player.title}</div>
                  <div className="truncate text-xs text-slate-500">{player.team} - {player.description}</div>
                </div>
                <InsightTag tone={tone(player.trend)}>{player.trend}</InsightTag>
              </Link>
            ))}
          </div>
          <div className="border-t border-white/8 p-3 lg:border-l lg:border-t-0">
            <AreaTrendChart
              eyebrow="Top 12"
              title="wOBA shape"
              points={filtered.slice(0, 12).reverse().map((player) => ({ label: `#${player.rank}`, value: player.woba }))}
              valueLabel="wOBA"
            />
          </div>
        </div>
      </section>
    </PageShell>
  );
}

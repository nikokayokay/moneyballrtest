import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { getLeaderboards } from "@/lib/data-engine";
import { NEAR_REALTIME_REFRESH_MS } from "@/src/lib/live";

const wanted = ["homeRuns", "era", "ops", "stolenBases"];

function teamLogo(teamId: number | null) {
  return teamId ? `https://www.mlbstatic.com/team-logos/${teamId}.svg` : "";
}

export function StatLeaders() {
  const query = useQuery({
    queryKey: ["dashboard-stat-leaders"],
    queryFn: getLeaderboards,
    staleTime: NEAR_REALTIME_REFRESH_MS,
    refetchInterval: NEAR_REALTIME_REFRESH_MS,
    refetchIntervalInBackground: true,
  });
  const cards = (query.data || []).filter((card) => wanted.includes(card.id));

  return (
    <section className="rounded-3xl border border-white/10 bg-[#070d16] p-4">
      <div className="font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.18em] text-cyan-200">Homepage stat leaders</div>
      <h2 className="mt-2 font-['Bebas_Neue'] text-4xl leading-none tracking-[0.06em] text-white">Who owns the board</h2>
      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 2xl:grid-cols-4">
        {cards.map((card) => (
          <Link key={card.id} to={card.href} className="rounded-2xl border border-white/8 bg-white/[0.025] p-3 transition hover:-translate-y-0.5 hover:border-emerald-300/25">
            <div className="font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.16em] text-slate-500">{card.title}</div>
            <div className="mt-3 space-y-2">
              {card.entries.slice(0, 3).map((entry) => (
                <div key={entry.playerId} className="grid grid-cols-[2rem_1fr_auto] items-center gap-2">
                  <img src={entry.headshotUrl} alt={entry.playerName} className="h-8 w-8 rounded-full object-cover object-[50%_45%]" loading="lazy" />
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-white">{entry.playerName}</div>
                    <div className="flex items-center gap-1 text-[10px] text-slate-500">
                      {teamLogo(entry.teamId) ? <img src={teamLogo(entry.teamId)} alt="" className="h-3 w-3 object-contain" /> : null}
                      {entry.position}
                    </div>
                  </div>
                  <div className="font-['Bebas_Neue'] text-2xl text-emerald-300">{entry.statValue}</div>
                </div>
              ))}
            </div>
          </Link>
        ))}
        {query.isLoading ? <div className="rounded-2xl border border-white/8 bg-white/[0.025] p-4 text-sm text-slate-500">Loading leaders...</div> : null}
      </div>
    </section>
  );
}

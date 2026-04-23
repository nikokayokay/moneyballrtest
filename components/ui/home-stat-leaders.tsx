import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { DATA_REFRESH_INTERVALS, getLeaderboards } from "@/lib/data-engine";

const categories = ["homeRuns", "era", "ops", "stolenBases"];

function teamLogo(teamId: number | null) {
  return teamId ? `https://www.mlbstatic.com/team-logos/${teamId}.svg` : "";
}

export function HomeStatLeaders({ countryFilter }: { countryFilter: string | null }) {
  const query = useQuery({
    queryKey: ["home-compact-stat-leaders", countryFilter],
    queryFn: getLeaderboards,
    staleTime: DATA_REFRESH_INTERVALS.leaderboards,
    refetchInterval: DATA_REFRESH_INTERVALS.leaderboards,
    refetchIntervalInBackground: true,
  });
  const cards = (query.data || []).filter((card) => categories.includes(card.id));

  return (
    <section className="rounded-[32px] border border-white/10 bg-[#070d16] p-[20px]">
      <div className="flex flex-wrap items-end justify-between gap-[20px]">
        <div>
          <div className="font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.18em] text-emerald-300">Quick stat leaders</div>
          <h2 className="mt-[8px] font-['Bebas_Neue'] text-[32px] leading-none tracking-[0.06em] text-white">Fast leaderboard scan</h2>
        </div>
        {countryFilter ? <div className="text-xs text-slate-500">Filtered context: {countryFilter}</div> : null}
      </div>
      <div className="mt-[20px] grid grid-cols-1 gap-[20px] md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <Link key={card.id} to={card.href} className="rounded-[20px] border border-white/8 bg-white/[0.025] p-[12px] transition hover:-translate-y-0.5 hover:border-emerald-300/25">
            <div className="font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.16em] text-slate-500">{card.title}</div>
            <div className="mt-[12px] space-y-[8px]">
              {card.entries.slice(0, 3).map((entry) => (
                <div key={entry.playerId} className="grid grid-cols-[32px_1fr_auto] items-center gap-[8px]">
                  <img src={entry.headshotUrl} alt={entry.playerName} className="h-[32px] w-[32px] rounded-full object-cover object-[50%_45%]" loading="lazy" />
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-white">{entry.playerName}</div>
                    <div className="flex items-center gap-[4px] text-[10px] text-slate-500">
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
        {query.isLoading ? <div className="rounded-[20px] border border-white/8 bg-white/[0.025] p-[20px] text-sm text-slate-500">Updating data...</div> : null}
      </div>
    </section>
  );
}

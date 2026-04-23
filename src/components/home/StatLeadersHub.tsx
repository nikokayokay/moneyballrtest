import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import type { LeaderboardCard, LeaderboardEntry } from "@/src/data/schemas";
import { trackAnalyticsEvent } from "@/src/lib/analytics-events";

type StatLeadersHubProps = {
  cards: LeaderboardCard[];
  isLoading?: boolean;
};

function trendIcon(entry: LeaderboardEntry) {
  if (entry.trend === "hot") return <ArrowUpRight className="h-3.5 w-3.5 text-emerald-300" />;
  if (entry.trend === "cold") return <ArrowDownRight className="h-3.5 w-3.5 text-red-300" />;
  return <span className="h-1.5 w-1.5 rounded-full bg-slate-500" />;
}

export function StatLeadersHub({ cards, isLoading = false }: StatLeadersHubProps) {
  return (
    <section className="surface-primary">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-white/8 px-4 py-4 sm:px-5">
        <div>
          <div className="mb-label text-cyan-200">Stat leaders hub</div>
          <div className="mb-title mt-2 text-[clamp(2.2rem,3.6vw,4.2rem)] text-white">Who is dominating</div>
        </div>
        <Link
          to="/leaderboards"
          onClick={() => trackAnalyticsEvent("leaderboard_click", "view_all_leaders")}
          className="border border-emerald-300/20 bg-emerald-300/10 px-3 py-2 font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.14em] text-emerald-200 transition hover:bg-emerald-300/15"
        >
          View all leaders
        </Link>
      </div>
      <div className="grid grid-cols-1 gap-px bg-white/8 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
        {isLoading ? Array.from({ length: 5 }, (_, index) => (
          <div key={index} className="h-72 animate-pulse bg-[#090f19]" />
        )) : cards.map((card) => (
          <Link
            key={card.id}
            to={card.href}
            onClick={() => trackAnalyticsEvent("leaderboard_click", card.id)}
            className="group bg-[#090f19] p-4 transition duration-200 hover:z-10 hover:-translate-y-1 hover:bg-[#0c1422] hover:shadow-[0_22px_70px_rgba(0,0,0,0.42)]"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="mb-label">{card.title}</div>
                <div className="mt-1 font-['Bebas_Neue'] text-4xl leading-none tracking-[0.06em] text-white">{card.statLabel}</div>
              </div>
              <div className="text-right text-[10px] uppercase tracking-[0.14em] text-slate-500">
                Live sync
              </div>
            </div>
            <div className="mt-4 space-y-2">
              {card.entries.map((entry) => (
                <div key={`${card.id}-${entry.playerId}`} className="grid grid-cols-[1.7rem_2.5rem_1fr_auto] items-center gap-2 border-t border-white/8 pt-2">
                  <div className="font-['Bebas_Neue'] text-xl tracking-[0.06em] text-slate-500">{entry.rank}</div>
                  <img src={entry.headshotUrl} alt={entry.playerName} className="player-headshot aspect-square w-full bg-slate-900" loading="lazy" />
                  <div className="min-w-0">
                    <div className="truncate font-['Barlow_Condensed'] text-lg font-semibold uppercase tracking-[0.06em] text-white">{entry.playerName}</div>
                    <div className="truncate text-[11px] text-slate-500">{entry.team} | {entry.position}</div>
                    <div className="hidden text-[11px] text-cyan-200 opacity-0 transition group-hover:block group-hover:opacity-100">{entry.last7Context}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-['Bebas_Neue'] text-2xl leading-none tracking-[0.06em] text-emerald-300">{entry.statValue}</div>
                    <div className="mt-1 flex justify-end">{trendIcon(entry)}</div>
                  </div>
                </div>
              ))}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

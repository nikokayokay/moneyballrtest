import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { fetchRosterDirectory } from "@/src/lib/mlb";
import { PlayerSearch } from "@/src/components/player-search";

export function PlayersPage() {
  const rosterQuery = useQuery({
    queryKey: ["roster-directory"],
    queryFn: fetchRosterDirectory,
    staleTime: 10 * 60_000,
  });

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <section className="panel-glow rounded-[32px] border border-white/8 bg-slate-950/75 p-8 shadow-[0_24px_70px_rgba(0,0,0,0.45)]">
        <div className="font-['JetBrains_Mono'] text-[11px] uppercase tracking-[0.28em] text-emerald-400">Players</div>
        <h1 className="headline-shadow mt-4 font-['Bebas_Neue'] text-6xl tracking-[0.08em] text-white md:text-8xl">Live active roster directory</h1>
        <p className="mt-4 max-w-4xl text-lg leading-8 text-slate-300">Every active player now opens into the same premium live profile system, with stronger cards, cleaner headshots, and full-season access.</p>
        <div className="mt-8 max-w-3xl">
          <PlayerSearch />
        </div>
      </section>

      <section className="mt-8 rounded-[28px] border border-white/8 bg-slate-950/70 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <div className="font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.24em] text-slate-500">Roster Index</div>
            <div className="mt-2 font-['Bebas_Neue'] text-4xl tracking-[0.08em] text-white">All Active Players</div>
          </div>
          <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300">{rosterQuery.data?.length || 0} players loaded</div>
        </div>
        {rosterQuery.isLoading ? (
          <div className="text-sm text-slate-400">Loading active roster directory...</div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {(rosterQuery.data || []).map((player) => (
              <Link
                key={player.playerId}
                to={`/player/${player.playerId}`}
                className="group relative flex items-center gap-4 overflow-hidden rounded-[24px] border border-white/8 bg-white/[0.03] p-4 transition hover:-translate-y-1 hover:border-emerald-400/20 hover:bg-white/[0.05] hover:shadow-[0_18px_50px_rgba(0,0,0,0.35)]"
              >
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-emerald-400/60 via-sky-400/40 to-transparent opacity-60" />
                <div className="h-16 w-16 overflow-hidden rounded-[20px] border border-white/10 bg-slate-900">
                  <img src={player.headshotUrl} alt={player.fullName} className="h-full w-full object-cover object-top" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-['Barlow_Condensed'] text-2xl font-semibold uppercase tracking-[0.08em] text-white">{player.fullName}</div>
                  <div className="text-sm text-slate-400">{player.team} • {player.position}</div>
                </div>
                <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.18em] text-slate-300 transition group-hover:border-emerald-400/20 group-hover:text-emerald-300">
                  Open
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

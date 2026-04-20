import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { PageShell, SectionHeader } from "@/src/components/layout/PageShell";
import { PlayerSearch } from "@/src/components/player-search";
import { fetchRosterDirectory } from "@/src/lib/mlb";

export function PlayersPage() {
  const rosterQuery = useQuery({
    queryKey: ["roster-directory"],
    queryFn: fetchRosterDirectory,
    staleTime: 10 * 60_000,
  });

  return (
    <PageShell>
      <section className="surface-primary">
        <SectionHeader
          eyebrow="Players"
          title="Live active roster directory"
          copy="Every active player opens into the same profile system with live context, complete logs, and sample-aware analytics."
        />
        <div className="p-4 sm:p-5">
          <div className="max-w-3xl">
            <PlayerSearch />
          </div>
        </div>
      </section>

      <section className="mb-section surface-primary p-4 sm:p-5">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <div className="mb-label">Roster Index</div>
            <div className="mb-title mt-2 text-4xl text-white">All Active Players</div>
          </div>
          <div className="border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300">{rosterQuery.data?.length || 0} players loaded</div>
        </div>
        {rosterQuery.isLoading ? (
          <div className="text-sm text-slate-400">Loading active roster directory...</div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {(rosterQuery.data || []).map((player) => (
              <Link
                key={player.playerId}
                to={`/player/${player.playerId}`}
                className="group relative flex items-center gap-4 overflow-hidden border border-white/8 bg-white/[0.03] p-4 transition hover:-translate-y-0.5 hover:border-emerald-400/20 hover:bg-white/[0.05] hover:shadow-[0_18px_50px_rgba(0,0,0,0.35)]"
              >
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-emerald-400/60 via-sky-400/40 to-transparent opacity-60" />
                <div className="h-16 w-16 overflow-hidden border border-white/10 bg-slate-900">
                  <img src={player.headshotUrl} alt={player.fullName} className="player-headshot h-full w-full" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-['Barlow_Condensed'] text-2xl font-semibold uppercase tracking-[0.08em] text-white">{player.fullName}</div>
                  <div className="text-sm text-slate-400">{player.team} | {player.position}</div>
                </div>
                <div className="border border-white/10 bg-white/5 px-3 py-1 font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.18em] text-slate-300 transition group-hover:border-emerald-400/20 group-hover:text-emerald-300">
                  Open
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </PageShell>
  );
}

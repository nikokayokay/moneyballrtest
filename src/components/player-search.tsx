import { useState } from "react";
import { Search, X } from "lucide-react";
import { Link } from "react-router-dom";
import { usePlayerSearch } from "@/src/hooks/use-player-search";

type PlayerSearchProps = {
  className?: string;
  autoFocus?: boolean;
};

export function PlayerSearch({ className = "", autoFocus = false }: PlayerSearchProps) {
  const [query, setQuery] = useState("");
  const { results, isLoading } = usePlayerSearch(query);

  return (
    <div className={`relative ${className}`}>
      <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
        <Search className="h-5 w-5 text-emerald-400" />
        <input
          autoFocus={autoFocus}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search any MLB player"
          className="w-full bg-transparent text-white outline-none placeholder:text-slate-500"
        />
        {query ? (
          <button type="button" onClick={() => setQuery("")} className="rounded-full border border-white/10 p-1 text-slate-400 transition hover:border-white/20 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      {(query || isLoading) && (
        <div className="absolute left-0 right-0 top-[calc(100%+12px)] z-30 overflow-hidden rounded-2xl border border-white/10 bg-slate-950/95 shadow-[0_20px_70px_rgba(0,0,0,0.45)] backdrop-blur-xl">
          {isLoading ? (
            <div className="p-4 text-sm text-slate-400">Loading roster index...</div>
          ) : results.length ? (
            <div className="max-h-[480px] overflow-y-auto scrollbar-thin">
              {results.map((player) => (
                <Link
                  key={player.playerId}
                  to={`/player/${player.playerId}`}
                  className="flex items-center gap-4 border-b border-white/5 px-4 py-3 transition last:border-b-0 hover:bg-white/5"
                >
                  <div className="h-14 w-14 overflow-hidden rounded-2xl border border-white/10 bg-slate-900">
                    <img src={player.headshotUrl} alt={player.fullName} className="h-full w-full object-cover object-top" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-['Barlow_Condensed'] text-xl font-semibold uppercase tracking-[0.08em] text-white">{player.fullName}</div>
                    <div className="text-sm text-slate-400">{player.team} • {player.position}</div>
                  </div>
                  <div className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.18em] text-emerald-300">
                    Open Profile
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="p-4 text-sm text-slate-400">No active MLB players matched that search.</div>
          )}
        </div>
      )}
    </div>
  );
}

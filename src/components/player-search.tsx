import { useState } from "react";
import { Search, X } from "lucide-react";
import { Link } from "react-router-dom";
import { usePlayerSearch } from "@/src/hooks/use-player-search";
import { PROSPECTS, promotionWatch } from "@/src/data/milb";

type PlayerSearchProps = {
  className?: string;
  autoFocus?: boolean;
};

export function PlayerSearch({ className = "", autoFocus = false }: PlayerSearchProps) {
  const [query, setQuery] = useState("");
  const { results, isLoading } = usePlayerSearch(query);
  const prospectResults = query.trim().length >= 2
    ? PROSPECTS.filter((prospect) => [prospect.name, prospect.orgAbbr, prospect.organization, prospect.level, prospect.position]
      .join(" ")
      .toLowerCase()
      .includes(query.trim().toLowerCase())).slice(0, 6)
    : [];

  return (
    <div className={`relative ${className}`}>
      <div className="flex items-center gap-2 border border-white/10 bg-[#0b121d] px-3 py-2">
        <Search className="h-4 w-4 text-emerald-400" />
        <input
          autoFocus={autoFocus}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search any MLB player"
          className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
        />
        {query ? (
          <button type="button" onClick={() => setQuery("")} className="border border-white/10 p-1 text-slate-400 transition hover:border-white/20 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      {(query || isLoading) && (
        <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-30 overflow-hidden border border-white/10 bg-[#080d16] shadow-[0_16px_40px_rgba(0,0,0,0.35)]">
          {isLoading ? (
            <div className="p-3 text-sm text-slate-400">Loading roster index...</div>
          ) : results.length || prospectResults.length ? (
            <div className="max-h-[420px] overflow-y-auto scrollbar-thin">
              {prospectResults.length ? (
                <div className="border-b border-white/8 bg-cyan-300/[0.03] px-3 py-2">
                  <div className="mb-label text-cyan-200">MiLB prospects</div>
                </div>
              ) : null}
              {prospectResults.map((prospect) => (
                <Link
                  key={prospect.id}
                  to={`/minor-leagues/players/${prospect.id}`}
                  className="flex items-center gap-3 border-b border-white/5 px-3 py-2 transition last:border-b-0 hover:bg-white/[0.04]"
                >
                  <div className="flex h-11 w-11 items-center justify-center bg-[#050914] font-['Bebas_Neue'] text-2xl tracking-[0.06em] text-emerald-300">
                    {prospect.orgAbbr}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-['Barlow_Condensed'] text-lg font-semibold uppercase tracking-[0.06em] text-white">{prospect.name}</div>
                    <div className="text-xs text-slate-500">{prospect.level} · {prospect.position} · {promotionWatch(prospect)}</div>
                  </div>
                  <div className="border border-cyan-300/20 bg-cyan-300/10 px-2 py-1 font-['JetBrains_Mono'] text-[9px] uppercase tracking-[0.16em] text-cyan-200">
                    MiLB
                  </div>
                </Link>
              ))}
              {results.length ? (
                <div className="border-b border-white/8 bg-emerald-300/[0.03] px-3 py-2">
                  <div className="mb-label text-emerald-200">MLB players</div>
                </div>
              ) : null}
              {results.map((player) => (
                <Link
                  key={player.playerId}
                  to={`/player/${player.playerId}`}
                  className="flex items-center gap-3 border-b border-white/5 px-3 py-2 transition last:border-b-0 hover:bg-white/[0.04]"
                >
                  <div className="h-11 w-11 overflow-hidden bg-slate-900">
                    <img src={player.headshotUrl} alt={player.fullName} className="player-headshot h-full w-full" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-['Barlow_Condensed'] text-lg font-semibold uppercase tracking-[0.06em] text-white">{player.fullName}</div>
                    <div className="text-xs text-slate-500">{player.team} - {player.position}</div>
                  </div>
                  <div className="border border-emerald-400/20 bg-emerald-400/10 px-2 py-1 font-['JetBrains_Mono'] text-[9px] uppercase tracking-[0.16em] text-emerald-300">
                    Open
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="p-3 text-sm text-slate-400">No MLB or MiLB players matched that search.</div>
          )}
        </div>
      )}
    </div>
  );
}

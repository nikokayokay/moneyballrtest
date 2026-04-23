import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Building2, ChevronRight, Database, RefreshCw } from "lucide-react";
import { fetchOrganizationPipeline } from "@/lib/milb-fetchers";
import type { MiLBAffiliate, MiLBPlayer } from "@/lib/milb-types";

const LEVELS: MiLBAffiliate["level"][] = ["AAA", "AA", "A+", "A"];

function formatStat(player: MiLBPlayer) {
  if (player.stats.hitting) {
    return {
      label: "OPS",
      value: player.stats.hitting.ops ? player.stats.hitting.ops.toFixed(3).replace(/^0/, "") : "Live",
    };
  }
  if (player.stats.pitching) {
    return {
      label: "ERA",
      value: player.stats.pitching.era ? player.stats.pitching.era.toFixed(2) : "Live",
    };
  }
  return { label: "Roster", value: "Live" };
}

function PlayerRow({ player }: { player: MiLBPlayer }) {
  const stat = formatStat(player);
  return (
    <Link
      to={`/minor-leagues/players/${player.id}`}
      className="grid grid-cols-[1fr_auto] items-center gap-3 border border-white/6 bg-white/[0.02] p-3 transition hover:border-emerald-300/25 hover:bg-emerald-300/[0.035]"
    >
      <div className="min-w-0">
        <div className="truncate font-['Barlow_Condensed'] text-lg font-semibold uppercase tracking-[0.08em] text-white">{player.name}</div>
        <div className="mb-label mt-1 text-[8px]">
          {player.position} · Age {player.bio.age || "N/A"} · {player.prospect.label}
        </div>
      </div>
      <div className="text-right">
        <div className="font-['Bebas_Neue'] text-2xl leading-none tracking-[0.06em] text-emerald-300">{stat.value}</div>
        <div className="mb-label mt-1 text-[8px]">{stat.label}</div>
      </div>
    </Link>
  );
}

export function FarmSystemPanel({ orgAbbr, teamName, compact = false }: { orgAbbr: string; teamName?: string; compact?: boolean }) {
  const pipelineQuery = useQuery({
    queryKey: ["milb", "organization-pipeline", orgAbbr],
    queryFn: () => fetchOrganizationPipeline(orgAbbr, { rosterLimit: 30 }),
    staleTime: 5 * 60_000,
    refetchInterval: 10 * 60_000,
    refetchOnWindowFocus: true,
  });

  const pipeline = pipelineQuery.data;
  const score = pipeline?.health.score ?? 0;
  const displayName = pipeline?.orgName || teamName || orgAbbr;

  return (
    <section className={`surface-secondary ${compact ? "p-3" : "p-4"}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="mb-label text-cyan-200">Official MiLB pipeline</div>
          <div className="mb-title mt-2 text-[clamp(1.8rem,2.8vw,3rem)] text-white">{displayName} pipeline</div>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
            Affiliates, active rosters, player IDs, assignments, and season stat lines are pulled from the official MLB/MiLB API layer and reconciled into Moneyballr scoring.
          </p>
          {pipeline ? (
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="border border-cyan-300/15 bg-cyan-300/10 px-2.5 py-1 font-['JetBrains_Mono'] text-[9px] uppercase tracking-[0.14em] text-cyan-200">
                {pipeline.health.playerCount} official players
              </span>
              <span className="border border-white/10 bg-white/[0.03] px-2.5 py-1 font-['JetBrains_Mono'] text-[9px] uppercase tracking-[0.14em] text-slate-400">
                Updated {new Date(pipeline.lastUpdated).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
              </span>
            </div>
          ) : null}
        </div>
        <div className="border border-emerald-300/20 bg-emerald-300/10 px-3 py-2 text-right">
          <div className="font-['Bebas_Neue'] text-4xl leading-none tracking-[0.06em] text-emerald-300">{pipelineQuery.isLoading ? "..." : score}</div>
          <div className="mb-label mt-1 text-[8px]">farm score</div>
        </div>
      </div>

      {pipelineQuery.isLoading ? (
        <div className="mt-4 flex items-center gap-3 border border-white/8 bg-white/[0.025] p-4 text-sm leading-6 text-slate-400">
          <RefreshCw className="h-4 w-4 animate-spin text-cyan-200" />
          Loading official affiliates, rosters, and stat lines...
        </div>
      ) : null}

      {pipelineQuery.isError ? (
        <div className="mt-4 flex items-start gap-3 border border-yellow-200/15 bg-yellow-200/8 p-4 text-sm leading-6 text-yellow-100">
          <AlertTriangle className="mt-1 h-4 w-4 shrink-0" />
          <div>
            MiLB data is refreshing. Moneyballr will retry automatically instead of showing stale or fabricated roster data.
          </div>
        </div>
      ) : null}

      {pipeline && !pipeline.validation.ok ? (
        <div className="mt-4 flex items-start gap-3 border border-cyan-300/15 bg-cyan-300/8 p-4 text-sm leading-6 text-slate-300">
          <Database className="mt-1 h-4 w-4 shrink-0 text-cyan-200" />
          <div>
            <div className="font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.16em] text-cyan-200">Validation notes</div>
            <div className="mt-1 text-slate-400">{pipeline.validation.issues.slice(0, 2).join(" ")}</div>
          </div>
        </div>
      ) : null}

      {pipeline ? (
        <div className="mt-4 grid grid-cols-1 gap-3 xl:grid-cols-4">
          {LEVELS.map((level) => {
            const affiliate = pipeline.affiliates.find((entry) => entry.level === level);
            const topPlayers = affiliate?.players
              ? [...affiliate.players].sort((a, b) => b.prospect.score - a.prospect.score).slice(0, compact ? 3 : 5)
              : [];
            return (
              <section key={level} className="border border-white/8 bg-[#070d16]">
                <div className="border-b border-white/8 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-['Bebas_Neue'] text-3xl leading-none tracking-[0.08em] text-white">{level}</div>
                    <Building2 className="h-4 w-4 text-cyan-200" />
                  </div>
                  <div className="mt-2 min-h-10 text-sm leading-5 text-slate-300">{affiliate?.teamName || "Affiliate resolving"}</div>
                  <div className="mb-label mt-1 text-[8px]">{affiliate?.league || "Official map pending"}</div>
                </div>
                <div className="space-y-2 p-2">
                  {topPlayers.length ? topPlayers.map((player) => <PlayerRow key={player.id} player={player} />) : (
                    <div className="border border-white/6 bg-white/[0.02] p-3 text-sm leading-5 text-slate-500">
                      Official roster refresh in progress.
                    </div>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      ) : (
        null
      )}

      <Link
        to={`/minor-leagues?team=${orgAbbr}`}
        className="mt-4 inline-flex items-center gap-2 font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.16em] text-emerald-300 transition hover:text-emerald-100"
      >
        Open {orgAbbr} prospect board
        <ChevronRight className="h-3.5 w-3.5" />
      </Link>
    </section>
  );
}

import { useQuery } from "@tanstack/react-query";
import { Clock, Radio } from "lucide-react";
import { boostImpactByLeverage, calculateLeverageIndex, clutchLabel } from "@/lib/leverage-index";
import { rankDailySlate } from "@/lib/daily-slate-engine";
import { KeyPerformerCard } from "@/src/components/game/KeyPerformerCard";
import { PageShell, SectionHeader } from "@/src/components/layout/PageShell";
import { InsightTag } from "@/src/components/player/InsightTag";
import { getImpactPlayers } from "@/lib/data-engine";
import { currentMlbDate, LIVE_REFRESH_MS, NEAR_REALTIME_REFRESH_MS } from "@/src/lib/live";

type ScheduleGame = {
  gamePk: number;
  status?: { detailedState?: string; abstractGameState?: string };
  teams?: {
    away?: { team?: { name?: string }; score?: number };
    home?: { team?: { name?: string }; score?: number };
  };
  linescore?: { currentInningOrdinal?: string; outs?: number };
};

async function fetchSchedule() {
  const response = await fetch(`https://statsapi.mlb.com/api/v1/schedule?sportId=1&hydrate=linescore&date=${currentMlbDate()}`, { cache: "no-store" });
  if (!response.ok) throw new Error("Unable to load game center");
  const data = await response.json() as { dates?: Array<{ games?: ScheduleGame[] }> };
  return data.dates?.flatMap((date) => date.games || []) || [];
}

function stateTone(state: string) {
  const lower = state.toLowerCase();
  if (lower.includes("progress")) return "live" as const;
  if (lower.includes("final")) return "positive" as const;
  return "warning" as const;
}

export function GameCenterPage() {
  const schedule = useQuery({
    queryKey: ["game-center-schedule"],
    queryFn: fetchSchedule,
    staleTime: LIVE_REFRESH_MS,
    refetchInterval: (query) => (query.state.data || []).some((game) => String(game.status?.detailedState || "").toLowerCase().includes("progress")) ? LIVE_REFRESH_MS : NEAR_REALTIME_REFRESH_MS,
  });
  const performers = useQuery({
    queryKey: ["game-center-performers"],
    queryFn: () => getImpactPlayers(8),
    staleTime: NEAR_REALTIME_REFRESH_MS,
  });
  const games = schedule.data || [];
  const slate = rankDailySlate(games.map((game) => ({
    id: game.gamePk,
    awayTeam: game.teams?.away?.team?.name || "Away",
    homeTeam: game.teams?.home?.team?.name || "Home",
    awayScore: game.teams?.away?.score,
    homeScore: game.teams?.home?.score,
    status: game.status?.detailedState || "Scheduled",
  })));

  return (
    <PageShell>
      <section className="surface-primary">
        <SectionHeader
          eyebrow="Game center"
          title="Today’s live baseball board"
          copy="A compact scoreboard surface designed for live state, final summaries, and reusable performer cards."
        />
        <div className="grid grid-cols-1 gap-px bg-white/8 lg:grid-cols-[minmax(0,1.618fr)_minmax(20rem,1fr)]">
          <div className="bg-[#090f19] p-4">
            <div className="mb-3 flex items-center gap-2">
              <Radio className="h-4 w-4 text-cyan-200" />
              <div className="mb-label">Scoreboard</div>
            </div>
            <div className="space-y-2">
              {games.length ? games.map((game) => {
                const away = game.teams?.away;
                const home = game.teams?.home;
                const status = game.status?.detailedState || "Scheduled";
                const context = {
                  inning: Number(String(game.linescore?.currentInningOrdinal || "1").replace(/\D/g, "")) || 1,
                  outs: game.linescore?.outs || 0,
                  awayScore: away?.score,
                  homeScore: home?.score,
                  battingTeamIsHome: true,
                };
                const leverageIndex = calculateLeverageIndex(context);
                return (
                  <div key={game.gamePk} className="grid grid-cols-[1fr_auto_1fr_auto] items-center gap-3 border border-white/8 bg-white/[0.025] p-3">
                    <div className="truncate text-sm text-slate-300">{away?.team?.name || "Away"}</div>
                    <div className="font-['Bebas_Neue'] text-3xl leading-none tracking-[0.06em] text-white">{away?.score ?? "-"}</div>
                    <div className="truncate text-sm text-slate-300">{home?.team?.name || "Home"}</div>
                    <div className="text-right">
                      <div className="font-['Bebas_Neue'] text-3xl leading-none tracking-[0.06em] text-white">{home?.score ?? "-"}</div>
                      <InsightTag tone={stateTone(status)}>{status}</InsightTag>
                    </div>
                    <div className="col-span-full flex items-center gap-2 text-xs text-slate-500">
                      <Clock className="h-3.5 w-3.5" />
                      {game.linescore?.currentInningOrdinal || "Pregame"} | Outs {game.linescore?.outs ?? 0} | LI {leverageIndex} | {clutchLabel(leverageIndex)}
                    </div>
                  </div>
                );
              }) : <div className="text-sm text-slate-500">No MLB games loaded for today yet.</div>}
            </div>
          </div>
          <div className="bg-[#0b121d] p-4">
            <div className="mb-label">Key performers</div>
            <div className="mt-3 space-y-2">
              {(performers.data || []).slice(0, 5).map((player) => <KeyPerformerCard key={player.id} player={player} />)}
            </div>
            <div className="mb-label mt-5 text-cyan-200">Daily slate priority</div>
            <div className="mt-3 space-y-2">
              {slate.slice(0, 4).map((game) => (
                <div key={game.id} className="border border-white/8 bg-white/[0.025] p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="truncate text-sm text-slate-300">{game.awayTeam} @ {game.homeTeam}</div>
                    <div className="font-['Bebas_Neue'] text-3xl leading-none text-emerald-300">{game.watchScore}</div>
                  </div>
                  <div className="mt-1 text-xs text-slate-500">{game.label} · clutch boosted sample {boostImpactByLeverage(game.watchScore, { inning: 8, homeScore: 3, awayScore: 2, outs: 1 }).toString()}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  );
}

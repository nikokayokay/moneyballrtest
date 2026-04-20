import type { GameLogEntry, PlayerProfile } from "@/src/lib/mlb";
import { InsightTag } from "@/src/components/player/InsightTag";

type GamePerformanceCardProps = {
  profile: PlayerProfile;
};

function summarizeGame(game: GameLogEntry | undefined) {
  if (!game) return null;
  return {
    line: game.statLine,
    date: game.date,
    opponent: game.opponent,
    impact: game.impact && game.impact !== "Unavailable" ? game.impact : null,
  };
}

function liveTone(state: PlayerProfile["liveGame"]["state"]) {
  if (state === "LIVE") return "live";
  if (state === "FINAL") return "positive";
  if (state === "UPCOMING") return "warning";
  return "neutral";
}

function liveLine(profile: PlayerProfile) {
  const values = profile.liveGame.line
    .filter(([, value]) => value && value !== "Unavailable" && value !== "0")
    .map(([label, value]) => `${value} ${label}`)
    .join(", ");
  if (!values) return null;
  return `${values}${profile.liveGame.state === "LIVE" && profile.liveGame.inning ? ` (${profile.liveGame.inning})` : ""}`;
}

export function GamePerformanceCard({ profile }: GamePerformanceCardProps) {
  const recent = summarizeGame(profile.recentGames[0]);
  const timeline = profile.recentGames.slice(0, 5);

  return (
    <section className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1.618fr)_minmax(18rem,1fr)]">
      <div className="bg-[#0b121d] p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.18em] text-cyan-200">Player Today</div>
          <InsightTag tone={liveTone(profile.liveGame.state)}>{profile.liveGame.state === "NO_GAME" ? "No game today" : profile.liveGame.state}</InsightTag>
        </div>
        {profile.liveGame.state !== "NO_GAME" && liveLine(profile) ? (
          <div className="mt-4">
            <div className="font-['Bebas_Neue'] text-[clamp(2.15rem,4vw,3.5rem)] leading-none tracking-[0.05em] text-white">{liveLine(profile)}</div>
            <div className="mt-2 text-sm text-slate-400">{profile.liveGame.opponent} - {profile.liveGame.status}</div>
            <div className="mt-3 flex flex-wrap gap-2">
              <InsightTag tone={liveTone(profile.liveGame.state)}>{profile.liveGame.note}</InsightTag>
            </div>
          </div>
        ) : recent ? (
          <div className="mt-4">
            <div className="font-['Bebas_Neue'] text-[clamp(2.15rem,4vw,3.5rem)] leading-none tracking-[0.05em] text-white">{recent.line}</div>
            <div className="mt-2 text-sm text-slate-400">{recent.date} vs {recent.opponent}</div>
            <div className="mt-3 flex flex-wrap gap-2">
              {recent.impact ? <InsightTag tone="positive">Impact {recent.impact}</InsightTag> : null}
              <InsightTag tone={profile.confidence.trend === "HOT" ? "positive" : profile.confidence.trend === "COLD" ? "negative" : "neutral"}>{profile.recentFormSummary}</InsightTag>
            </div>
          </div>
        ) : (
          <div className="mt-4 text-sm text-slate-400">Not enough data for a recent MLB game summary.</div>
        )}
      </div>

      <div className="bg-[#0b121d] p-4">
        <div className="font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.18em] text-slate-500">Last 5 games</div>
        <div className="mt-3 space-y-2">
          {timeline.length ? timeline.map((game) => (
            <div key={`${game.date}-${game.opponent}-${game.statLine}`} className="grid grid-cols-[4.5rem_1fr_auto] items-center gap-3 border-t border-white/8 pt-2 text-sm">
              <div className="text-slate-500">{game.date}</div>
              <div className="truncate text-slate-200">{game.statLine}</div>
              <div className="text-xs text-slate-500">{game.opponent}</div>
            </div>
          )) : <div className="text-sm text-slate-400">Not enough data.</div>}
        </div>
      </div>
    </section>
  );
}

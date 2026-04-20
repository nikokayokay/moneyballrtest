import { Link } from "react-router-dom";
import type { SpherePlayer } from "@/src/services/impactPlayers";
import { InsightTag } from "@/src/components/player/InsightTag";

function tone(trend: SpherePlayer["trend"]) {
  if (trend === "hot") return "positive" as const;
  if (trend === "cold") return "negative" as const;
  if (trend === "volatile") return "warning" as const;
  return "neutral" as const;
}

export function KeyPerformerCard({ player }: { player: SpherePlayer }) {
  return (
    <Link to={`/player/${player.id}`} className="grid grid-cols-[3rem_1fr_auto] items-center gap-3 border border-white/8 bg-white/[0.03] p-3 transition hover:border-emerald-300/25 hover:bg-white/[0.05]">
      <img src={player.src} alt={player.alt} className="player-headshot aspect-square w-full bg-slate-900" loading="lazy" />
      <div className="min-w-0">
        <div className="truncate font-['Barlow_Condensed'] text-xl font-semibold uppercase tracking-[0.06em] text-white">{player.title}</div>
        <div className="truncate text-xs text-slate-500">{player.description}</div>
      </div>
      <InsightTag tone={tone(player.trend)}>{player.trend}</InsightTag>
    </Link>
  );
}

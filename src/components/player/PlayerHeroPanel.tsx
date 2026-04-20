import type { PlayerProfile } from "@/src/lib/mlb";
import { InsightTag } from "@/src/components/player/InsightTag";

type PlayerHeroPanelProps = {
  profile: PlayerProfile;
};

function trendTone(trend: PlayerProfile["confidence"]["trend"]) {
  if (trend === "HOT") return "positive";
  if (trend === "COLD") return "negative";
  return "neutral";
}

function liveTone(state: PlayerProfile["liveGame"]["state"]) {
  if (state === "LIVE") return "live";
  if (state === "FINAL") return "positive";
  if (state === "UPCOMING") return "warning";
  return "neutral";
}

export function PlayerHeroPanel({ profile }: PlayerHeroPanelProps) {
  const metadata = [
    profile.identity.team,
    profile.identity.position,
    [profile.identity.bats, profile.identity.throws].filter(Boolean).join("/"),
    profile.identity.age ? `Age ${profile.identity.age}` : null,
  ].filter(Boolean);

  return (
    <section className="bg-[#080d16]">
      <div className="grid grid-cols-1 border-b border-white/8 lg:grid-cols-[minmax(0,1.618fr)_minmax(22rem,1fr)]">
        <div className="flex min-w-0 gap-4 px-4 py-5 sm:px-6 lg:px-8">
          <div className="h-[clamp(5.2rem,9vw,7.5rem)] w-[clamp(5.2rem,9vw,7.5rem)] shrink-0 overflow-hidden rounded-sm bg-slate-900">
            <img src={profile.identity.headshotUrl} alt={profile.identity.fullName} className="player-headshot h-full w-full" />
          </div>
          <div className="min-w-0 self-end">
            <div className="flex flex-wrap gap-2">
              <InsightTag tone={profile.liveGame.state === "LIVE" ? "live" : "neutral"}>{profile.identity.status}</InsightTag>
              <InsightTag tone={liveTone(profile.liveGame.state)}>
                {profile.liveGame.state === "NO_GAME" ? "No game today" : profile.liveGame.state}
              </InsightTag>
              <InsightTag tone={trendTone(profile.confidence.trend)}>{profile.confidence.trend}</InsightTag>
            </div>
            <h1 className="mt-3 truncate font-['Bebas_Neue'] text-[clamp(3rem,8vw,6.8rem)] leading-[0.82] tracking-[0.035em] text-white">
              {profile.identity.fullName}
            </h1>
            <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 font-['Barlow_Condensed'] text-sm uppercase tracking-[0.14em] text-slate-400">
              {metadata.map((item) => <span key={item}>{item}</span>)}
            </div>
          </div>
        </div>

        <aside className="border-t border-white/8 bg-[#0b121d] px-4 py-4 sm:px-6 lg:border-l lg:border-t-0 lg:px-6">
          <div className="font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.18em] text-slate-500">Current Form</div>
          <div className="mt-3 flex items-end justify-between gap-5">
            <div>
              <div className="font-['Bebas_Neue'] text-[clamp(3rem,6vw,5.5rem)] leading-none tracking-[0.06em] text-white">{profile.confidence.score}</div>
              <div className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-500">Rating</div>
            </div>
            <div className="text-right">
              <InsightTag tone={trendTone(profile.confidence.trend)}>{profile.confidence.trend}</InsightTag>
              <div className="mt-3 max-w-sm text-sm leading-6 text-slate-300">{profile.decisionInsight}</div>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}

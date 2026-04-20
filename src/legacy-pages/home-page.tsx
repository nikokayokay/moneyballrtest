import { useQueries, useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { LiquidButton, MetalButton } from "@/components/ui/liquid-glass-button";
import { AreaTrendChart } from "@/src/components/charts/AreaTrendChart";
import { LiveGameTicker } from "@/src/components/home/LiveGameTicker";
import { SphereImageGrid } from "@/src/components/home/SphereImageGrid";
import { PageShell } from "@/src/components/layout/PageShell";
import { InsightTag } from "@/src/components/player/InsightTag";
import { PlayerSearch } from "@/src/components/player-search";
import { fetchPlayerProfile, type PlayerProfile } from "@/src/lib/mlb";
import { currentMlbDate, LIVE_REFRESH_MS, NEAR_REALTIME_REFRESH_MS } from "@/src/lib/live";
import { fetchImpactPlayers, type SpherePlayer } from "@/src/services/impactPlayers";
import { useRecentViews } from "@/src/hooks/useRecentViews";

const trackedPlayers = [
  { id: 592450, role: "Impact bat" },
  { id: 701398, role: "Prospect watch" },
  { id: 804606, role: "Prospect watch" },
];

type ScheduleGame = {
  gamePk: number;
  status?: { detailedState?: string };
  teams?: {
    away?: { team?: { name?: string }; score?: number };
    home?: { team?: { name?: string }; score?: number };
  };
};

async function fetchTodaySchedule() {
  const today = currentMlbDate();
  const response = await fetch(`https://statsapi.mlb.com/api/v1/schedule?sportId=1&date=${today}`, { cache: "no-store" });
  if (!response.ok) throw new Error("Unable to load live games");
  const data = await response.json() as { dates?: Array<{ games?: ScheduleGame[] }> };
  return data.dates?.flatMap((date) => date.games || []) || [];
}

function clean(value: string | undefined | null) {
  return value && value !== "Unavailable" && value !== "N/A" ? value : null;
}

function keyMetric(profile: PlayerProfile) {
  return clean(profile.advancedStats.find(([label]) => label === "xwOBA")?.[1])
    ? `xwOBA ${profile.advancedStats.find(([label]) => label === "xwOBA")?.[1]}`
    : clean(profile.advancedStats.find(([label]) => label === "HardHit%")?.[1])
      ? `HardHit ${profile.advancedStats.find(([label]) => label === "HardHit%")?.[1]}`
      : `Rating ${profile.confidence.score}`;
}

function performanceLine(profile: PlayerProfile) {
  return profile.recentGames[0]?.statLine || "Not enough data";
}

function trendTone(profile: PlayerProfile) {
  if (profile.confidence.trend === "HOT") return "positive" as const;
  if (profile.confidence.trend === "COLD") return "negative" as const;
  return "neutral" as const;
}

function sphereTrendTone(player: SpherePlayer) {
  if (player.trend === "hot") return "positive" as const;
  if (player.trend === "cold") return "negative" as const;
  if (player.trend === "volatile") return "warning" as const;
  return "neutral" as const;
}

function compactDescription(description: string) {
  return description.replace("HardHit: Not enough data", "HardHit: source pending");
}

export function HomePage() {
  const recentViews = useRecentViews();
  const playerQueries = useQueries({
    queries: trackedPlayers.map((player) => ({
      queryKey: ["home-impact-player", player.id],
      queryFn: () => fetchPlayerProfile(player.id),
      staleTime: 60_000,
    })),
  });
  const scheduleQuery = useQuery({
    queryKey: ["today-schedule"],
    queryFn: fetchTodaySchedule,
    staleTime: LIVE_REFRESH_MS,
    refetchInterval: (query) => {
      const games = query.state.data || [];
      const hasLive = games.some((game) => String(game.status?.detailedState || "").toLowerCase().includes("in progress"));
      return hasLive ? LIVE_REFRESH_MS : NEAR_REALTIME_REFRESH_MS;
    },
    refetchIntervalInBackground: true,
  });
  const impactQuery = useQuery({
    queryKey: ["impact-sphere-players"],
    queryFn: () => fetchImpactPlayers(48),
    staleTime: NEAR_REALTIME_REFRESH_MS,
    refetchInterval: NEAR_REALTIME_REFRESH_MS,
    refetchIntervalInBackground: true,
  });

  const profiles = playerQueries.map((query) => query.data).filter((profile): profile is PlayerProfile => Boolean(profile));
  const top = profiles[0];
  const otherProfiles = profiles.slice(1);
  const impactPlayers = impactQuery.data || [];
  const featuredImpact = impactPlayers.slice(0, 3);
  const impactTrend = impactPlayers.slice(0, 12).map((player) => ({
    label: `#${player.rank}`,
    value: player.woba,
  })).reverse();
  const games = (scheduleQuery.data || []).slice(0, 10).map((game) => {
    const away = game.teams?.away;
    const home = game.teams?.home;
    const score = away?.score !== undefined && home?.score !== undefined ? `${away.score}-${home.score}` : game.status?.detailedState || "Scheduled";
    return {
      game: `${away?.team?.name || "Away"} @ ${home?.team?.name || "Home"}`,
      score,
      performer: game.status?.detailedState || "Live data pending",
    };
  });

  return (
    <PageShell>
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,0.62fr)]">
        <div className="min-w-0 bg-[#080d16] p-3 sm:p-4">
          <SphereImageGrid players={impactPlayers} isLoading={impactQuery.isLoading} />
        </div>

        <aside className="bg-[#0b121d] p-4 sm:p-5">
          <div className="font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.22em] text-cyan-200">Live leaderboard sphere</div>
          <h1 className="mt-3 font-['Bebas_Neue'] text-[clamp(3.1rem,6vw,6rem)] leading-[0.86] tracking-[0.035em] text-white">
            Today's Impact Players
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            Ranked from live MLB season production plus last-seven-game form. The front of the sphere carries the strongest current signals; dimmer players are still hot enough to make the board.
          </p>
          <div className="mt-4">
            <PlayerSearch />
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <LiquidButton asChild size="lg" className="font-['Barlow_Condensed'] uppercase tracking-[0.18em] text-emerald-200">
              <Link to="/players">Browse Players</Link>
            </LiquidButton>
            <Link to="/dashboard" className="inline-flex">
              <MetalButton variant="success" className="font-['Barlow_Condensed'] uppercase tracking-[0.16em]">
                Live Dashboard
              </MetalButton>
            </Link>
          </div>

          <div className="mt-5 flex items-center justify-between gap-3 border-t border-white/8 pt-4">
            <div className="font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.18em] text-slate-500">Featured signals</div>
            {impactQuery.isError ? <InsightTag tone="warning">Live data temporarily unavailable</InsightTag> : <InsightTag tone="live">5 min refresh</InsightTag>}
          </div>
          <div className="mt-3 space-y-3">
            {featuredImpact.length ? featuredImpact.map((player) => (
              <Link key={player.id} to={`/player/${player.id}`} className="grid grid-cols-[3rem_1fr_auto] items-center gap-3 border-t border-white/8 pt-3 transition hover:border-cyan-300/30">
                <img src={player.src} alt={player.alt} loading="lazy" className="player-headshot aspect-square w-full" />
                <div className="min-w-0">
                  <div className="truncate font-['Barlow_Condensed'] text-xl font-semibold uppercase tracking-[0.06em] text-white">{player.title}</div>
                  <div className="truncate text-xs text-slate-500">{compactDescription(player.description)}</div>
                </div>
                <div className="text-right">
                  <div className="font-['Bebas_Neue'] text-2xl tracking-[0.06em] text-white">#{player.rank}</div>
                  <InsightTag tone={sphereTrendTone(player)}>{player.trend}</InsightTag>
                </div>
              </Link>
            )) : (
              <div className="space-y-3">
                <div className="h-16 animate-pulse bg-white/[0.04]" />
                <div className="h-16 animate-pulse bg-white/[0.04]" />
                <div className="h-16 animate-pulse bg-white/[0.04]" />
              </div>
            )}
          </div>
        </aside>
      </section>

      <div className="mt-4">
        <LiveGameTicker games={games.length ? games : [{ game: "MLB schedule", score: "Pending", performer: "Live games appear here when available" }]} />
      </div>

      <section className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.618fr)_minmax(18rem,1fr)]">
        <div className="bg-[#090f19]">
          <div className="border-b border-white/8 px-4 py-3 font-['Bebas_Neue'] text-[clamp(2rem,3vw,3rem)] tracking-[0.06em] text-white">Players of the day</div>
          {top ? (
            <Link to={`/player/${top.identity.playerId}`} className="grid grid-cols-1 gap-4 p-4 transition hover:bg-white/[0.025] sm:grid-cols-[7rem_1fr]">
              <img src={top.identity.headshotUrl} alt={top.identity.fullName} className="player-headshot h-28 w-28" />
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <InsightTag tone={trendTone(top)}>{top.confidence.trend}</InsightTag>
                  <InsightTag tone="live">{keyMetric(top)}</InsightTag>
                </div>
                <div className="mt-3 font-['Bebas_Neue'] text-[clamp(2.8rem,5vw,5rem)] leading-none tracking-[0.04em] text-white">{top.identity.fullName}</div>
                <div className="mt-2 text-sm text-slate-400">{top.identity.team} - {performanceLine(top)}</div>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">{top.decisionInsight}</p>
              </div>
            </Link>
          ) : <div className="h-44 animate-pulse bg-white/[0.04]" />}
        </div>

        <div className="space-y-3">
          <AreaTrendChart
            eyebrow="Impact curve"
            title="Top-player wOBA signal"
            points={impactTrend}
            valueLabel="wOBA"
          />
          <section className="bg-[#0b121d] p-4">
            <div className="font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.18em] text-slate-500">Trending profiles</div>
            <div className="mt-3 space-y-3">
              {otherProfiles.length ? otherProfiles.map((profile) => (
                <Link key={profile.identity.playerId} to={`/player/${profile.identity.playerId}`} className="block border-t border-white/8 pt-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-['Barlow_Condensed'] text-xl font-semibold uppercase tracking-[0.06em] text-white">{profile.identity.fullName}</div>
                      <div className="text-xs text-slate-500">{keyMetric(profile)}</div>
                    </div>
                    <InsightTag tone={trendTone(profile)}>{profile.confidence.trend}</InsightTag>
                  </div>
                </Link>
              )) : <div className="text-sm text-slate-400">Loading tracked profiles.</div>}
            </div>
          </section>

          <section className="bg-[#0b121d] p-4">
            <div className="font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.18em] text-slate-500">Prospect spotlight</div>
            <div className="mt-3 space-y-2 text-sm text-slate-300">
              {profiles.filter((profile) => profile.sample.tier !== "full_sample").map((profile) => (
                <Link key={profile.identity.playerId} to={`/player/${profile.identity.playerId}`} className="flex items-center justify-between border-t border-white/8 pt-2">
                  <span>{profile.identity.fullName}</span>
                  <span className="text-slate-500">{profile.sample.badgeLabel}</span>
                </Link>
              ))}
            </div>
          </section>
          <section className="bg-[#0b121d] p-4">
            <div className="font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.18em] text-slate-500">Continue tracking</div>
            <div className="mt-3 space-y-2 text-sm text-slate-300">
              {recentViews.items.length ? recentViews.items.slice(0, 5).map((item) => (
                <Link key={item.id} to={`/player/${item.id}`} className="flex items-center justify-between border-t border-white/8 pt-2">
                  <span>{item.label}</span>
                  <span className="text-slate-500">{item.team || "MLB"}</span>
                </Link>
              )) : <div className="text-slate-500">Open a player profile to start a recent tracking list.</div>}
            </div>
          </section>
        </div>
      </section>
    </PageShell>
  );
}

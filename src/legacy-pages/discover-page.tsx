import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { PageShell, SectionHeader } from "@/src/components/layout/PageShell";
import { InsightTag } from "@/src/components/player/InsightTag";
import { PlayerSearch } from "@/src/components/player-search";
import { getImpactPlayers } from "@/lib/data-engine";
import { NEAR_REALTIME_REFRESH_MS } from "@/src/lib/live";

export function DiscoverPage() {
  const query = useQuery({
    queryKey: ["discover-impact"],
    queryFn: () => getImpactPlayers(60),
    staleTime: NEAR_REALTIME_REFRESH_MS,
    refetchInterval: NEAR_REALTIME_REFRESH_MS,
  });
  const players = query.data || [];
  const volatile = players.filter((player) => player.trend === "volatile").slice(0, 6);
  const hot = players.filter((player) => player.trend === "hot").slice(0, 6);
  const cooling = players.filter((player) => player.trend === "cold").slice(0, 6);

  return (
    <PageShell>
      <section className="surface-primary">
        <SectionHeader
          eyebrow="Discovery"
          title="Signals worth checking"
          copy="A scouting-style surface for anomalies, recent spikes, and players whose current shape deserves a profile click."
        />
        <div className="grid grid-cols-1 gap-3 p-3 lg:grid-cols-[minmax(0,1.618fr)_minmax(18rem,1fr)]">
          <div className="surface-secondary p-4">
            <div className="mb-label text-cyan-200">Fast finder</div>
            <div className="mb-title mt-2 text-[clamp(2rem,3vw,3.2rem)] text-white">Search the player universe</div>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">Type any active MLB player and jump straight into the profile system with live state, game logs, and trend context.</p>
            <div className="mt-4 max-w-2xl"><PlayerSearch /></div>
          </div>
          <SignalColumn title="Hot streak watch" players={hot} tone="positive" />
        </div>
      </section>

      <section className="mb-section grid grid-cols-1 gap-3 lg:grid-cols-2">
        <SignalColumn title="Volatility board" players={volatile} tone="warning" />
        <SignalColumn title="Cooling candidates" players={cooling} tone="negative" />
      </section>
    </PageShell>
  );
}

function SignalColumn({ title, players, tone }: { title: string; players: Awaited<ReturnType<typeof getImpactPlayers>>; tone: "positive" | "warning" | "negative" }) {
  return (
    <section className="surface-secondary p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="mb-label">{title}</div>
        <InsightTag tone={tone}>{players.length} signals</InsightTag>
      </div>
      <div className="mt-3 divide-y divide-white/8">
        {players.length ? players.map((player) => (
          <Link key={`${title}-${player.id}`} to={`/player/${player.id}`} className="grid grid-cols-[2.75rem_1fr_auto] items-center gap-3 py-3 transition hover:bg-white/[0.025]">
            <img src={player.src} alt={player.alt} className="player-headshot aspect-square w-full bg-slate-900" loading="lazy" />
            <div className="min-w-0">
              <div className="truncate font-['Barlow_Condensed'] text-xl font-semibold uppercase tracking-[0.06em] text-white">{player.title}</div>
              <div className="truncate text-xs text-slate-500">{player.description}</div>
            </div>
            <div className="font-['Bebas_Neue'] text-xl tracking-[0.08em] text-slate-300">#{player.rank}</div>
          </Link>
        )) : <div className="py-4 text-sm text-slate-500">No current signals in this bucket.</div>}
      </div>
    </section>
  );
}

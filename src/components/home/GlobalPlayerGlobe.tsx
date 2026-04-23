import { useMemo, useState } from "react";
import type { OriginCluster } from "@/src/services/playerOrigins";
import { trackAnalyticsEvent } from "@/src/lib/analytics-events";

type GlobalPlayerGlobeProps = {
  clusters: OriginCluster[];
  isLoading?: boolean;
};

function project(lat: number, lon: number) {
  const x = 50 + (lon / 180) * 42;
  const y = 50 - (lat / 90) * 35;
  return { x, y };
}

export function GlobalPlayerGlobe({ clusters, isLoading = false }: GlobalPlayerGlobeProps) {
  const [active, setActive] = useState<OriginCluster | null>(null);
  const max = Math.max(1, ...clusters.map((cluster) => cluster.count));
  const plotted = useMemo(() => clusters.map((cluster) => ({ ...cluster, ...project(cluster.lat, cluster.lon) })), [clusters]);

  return (
    <section className="surface-primary overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.618fr)_minmax(20rem,1fr)]">
        <div className="relative min-h-[28rem] bg-[#050914] p-4">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(14,116,144,0.18),transparent_34%),radial-gradient(circle_at_50%_50%,rgba(52,211,153,0.08),transparent_52%)]" />
          <div className="relative mx-auto aspect-square w-full max-w-[42rem]">
            <div className="absolute inset-0 rounded-full border border-cyan-300/16 bg-[radial-gradient(circle_at_35%_28%,rgba(103,232,249,0.16),rgba(8,13,22,0.18)_35%,rgba(2,6,23,0.88)_72%)] shadow-[inset_0_0_70px_rgba(103,232,249,0.08)]" />
            <div className="absolute inset-[9%] rounded-full border border-white/8" />
            <div className="absolute inset-[18%] rounded-full border border-white/6" />
            <div className="absolute left-1/2 top-[8%] h-[84%] w-px -translate-x-1/2 bg-white/8" />
            <div className="absolute left-[8%] top-1/2 h-px w-[84%] -translate-y-1/2 bg-white/8" />
            {isLoading ? (
              <div className="absolute inset-[18%] animate-pulse rounded-full bg-white/[0.04]" />
            ) : plotted.map((cluster) => {
              const intensity = cluster.count / max;
              const size = 0.65 + intensity * 1.15;
              return (
                <button
                  key={cluster.country}
                  type="button"
                  onMouseEnter={() => setActive(cluster)}
                  onFocus={() => setActive(cluster)}
                  onClick={() => {
                    setActive(cluster);
                    trackAnalyticsEvent("region_explore", cluster.country, { count: cluster.count });
                  }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full outline-none"
                  style={{ left: `${cluster.x}%`, top: `${cluster.y}%` }}
                  aria-label={`${cluster.country}: ${cluster.count} players`}
                >
                  <span
                    className="block animate-pulse rounded-full border border-cyan-100/30 bg-cyan-300 shadow-[0_0_24px_rgba(103,232,249,0.45)]"
                    style={{ width: `${size}rem`, height: `${size}rem`, opacity: 0.38 + intensity * 0.56 }}
                  />
                </button>
              );
            })}
          </div>
        </div>

        <aside className="bg-[#0b121d] p-4 sm:p-5">
          <div className="mb-label text-cyan-200">Global Impact of the Game</div>
          <div className="mb-title mt-2 text-[clamp(2.4rem,4vw,4.4rem)] text-white">Where MLB talent comes from</div>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            Birthplace clusters from the active MLB player pool. Brighter regions indicate more current major leaguers.
          </p>
          <div className="mt-5 border border-white/8 bg-white/[0.03] p-4">
            {active ? (
              <>
                <div className="mb-label">Selected region</div>
                <div className="mt-2 font-['Bebas_Neue'] text-4xl tracking-[0.06em] text-white">{active.country}</div>
                <div className="mt-2 text-sm text-slate-300">{active.count} active MLB players</div>
                <div className="mt-1 text-sm text-slate-500">Example: {active.topPlayer}</div>
              </>
            ) : (
              <div className="text-sm leading-6 text-slate-400">Hover or tap a hotspot to inspect the region.</div>
            )}
          </div>
          <div className="mt-4 space-y-2">
            {clusters.slice(0, 5).map((cluster) => (
              <button
                key={cluster.country}
                type="button"
                onClick={() => {
                  setActive(cluster);
                  trackAnalyticsEvent("region_explore", cluster.country, { count: cluster.count });
                }}
                className="grid w-full grid-cols-[1fr_auto] items-center gap-3 border-t border-white/8 pt-2 text-left"
              >
                <span className="text-sm text-slate-300">{cluster.country}</span>
                <span className="font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.14em] text-cyan-200">{cluster.count}</span>
              </button>
            ))}
          </div>
        </aside>
      </div>
    </section>
  );
}

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { GlobePulse, type PulseMarker } from "@/components/ui/cobe-globe-pulse";
import type { HomePerformer } from "@/src/data/home-discovery";
import { performerOrigins } from "@/src/data/home-discovery";

export function PlayerOriginGlobe({
  performers,
  selectedCountry,
  onSelectCountry,
  className,
}: {
  performers: HomePerformer[];
  selectedCountry: string | null;
  onSelectCountry: (country: string | null) => void;
  className?: string;
}) {
  const [hovered, setHovered] = useState<string | null>(null);
  const points = useMemo(() => performerOrigins(performers), [performers]);
  const pulseMarkers = useMemo(() => performerMarkers(performers), [performers]);
  const activeLabel = hovered || (selectedCountry ? `Filtered: ${selectedCountry}` : "Hover a country");

  return (
    <section className={cn("overflow-hidden rounded-[32px] border border-white/10 bg-[#070d16] p-[20px]", className)}>
      <div className="flex flex-wrap items-end justify-between gap-[20px]">
        <div>
          <div className="font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.18em] text-cyan-200">Global performer map</div>
          <h2 className="mt-[8px] font-['Bebas_Neue'] text-[32px] leading-none tracking-[0.06em] text-white">Where today&apos;s impact starts</h2>
        </div>
        <div className="rounded-full border border-white/8 bg-white/[0.025] px-[12px] py-[8px] text-xs text-slate-400">
          {activeLabel}
        </div>
      </div>

      <div className="mt-[20px] grid grid-cols-1 gap-[20px] lg:grid-cols-[1.1fr_.9fr]">
        <div className="relative flex min-h-[520px] items-center justify-center overflow-hidden rounded-[32px] bg-[#03060d]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(103,232,249,.10),transparent_42%),radial-gradient(circle_at_65%_30%,rgba(52,211,153,.08),transparent_24%)]" />
          {pulseMarkers.length ? (
            <GlobePulse markers={pulseMarkers} speed={0.0017} className="relative z-10 w-full max-w-[520px]" />
          ) : (
            <div className="relative z-10 rounded-[20px] border border-white/8 bg-white/[0.025] p-[20px] text-center">
              <div className="font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.16em] text-cyan-200">Updating data...</div>
              <p className="mt-[8px] max-w-[320px] text-[12px] leading-[20px] text-slate-500">Origin map appears once today&apos;s official performer pool is available.</p>
            </div>
          )}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-[84px] bg-gradient-to-t from-[#03060d] via-[#03060d]/92 to-transparent" />
          <div className="absolute bottom-[20px] left-[20px] right-[20px] z-30 grid grid-cols-2 gap-[8px] sm:grid-cols-4">
            {points.map((point) => (
              <button
                key={point.country}
                type="button"
                onMouseEnter={() => setHovered(`${point.country}: ${point.count} players - ${point.topPerformer}`)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => onSelectCountry(selectedCountry === point.country ? null : point.country)}
                className={cn(
                  "rounded-[20px] border px-[12px] py-[8px] text-left backdrop-blur transition hover:-translate-y-0.5",
                  selectedCountry === point.country ? "border-cyan-300/35 bg-cyan-300/10" : "border-white/8 bg-[#070d16]/72",
                )}
              >
                <div className="truncate font-['JetBrains_Mono'] text-[8px] uppercase tracking-[0.14em] text-slate-500">{point.country}</div>
                <div className="font-['Bebas_Neue'] text-[32px] leading-none text-emerald-300">{point.count}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-[8px]">
          {points.map((point) => (
            <button
              key={point.country}
              type="button"
              onMouseEnter={() => setHovered(`${point.country}: ${point.count} players - ${point.topPerformer}`)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => onSelectCountry(selectedCountry === point.country ? null : point.country)}
              className={cn(
                "w-full rounded-[20px] border p-[12px] text-left transition hover:-translate-y-0.5",
                selectedCountry === point.country ? "border-cyan-300/30 bg-cyan-300/10" : "border-white/8 bg-white/[0.025]",
              )}
            >
              <div className="flex items-center justify-between gap-[12px]">
                <div>
                  <div className="font-['Barlow_Condensed'] text-[20px] font-semibold uppercase tracking-[0.08em] text-white">{point.country}</div>
                  <div className="mt-[4px] text-xs text-slate-500">Top performer: {point.topPerformer}</div>
                </div>
                <div className="font-['Bebas_Neue'] text-[32px] leading-none text-emerald-300">{point.count}</div>
              </div>
            </button>
          ))}
          {!points.length ? <div className="rounded-[20px] border border-white/8 bg-white/[0.025] p-[20px] text-sm text-slate-500">Updating data...</div> : null}
        </div>
      </div>
    </section>
  );
}

function performerMarkers(performers: HomePerformer[]): PulseMarker[] {
  const coords: Record<string, [number, number]> = {
    "United States": [39, -98],
    "Dominican Republic": [18.7, -70.2],
    Venezuela: [6.4, -66.6],
    Japan: [36.2, 138.2],
    Cuba: [21.5, -78.9],
    Mexico: [23.6, -102.5],
    Canada: [56.1, -106.3],
    Colombia: [4.6, -74.1],
    Curacao: [12.2, -69],
    Panama: [8.5, -80.8],
    Puerto: [18.2, -66.5],
  };
  return Array.from(new Set(performers.map((player) => player.country).filter((country) => country && country !== "Unknown"))).map((country, index) => {
    const players = performers.filter((player) => player.country === country);
    const avgImpact = players.reduce((sum, player) => sum + player.impactScore, 0) / Math.max(1, players.length);
    return {
      id: `performer-map-origin-${index + 1}`,
      location: coords[country] || [20, 0],
      delay: index * 0.55,
      size: Math.min(0.075, 0.018 + players.length * 0.008 + avgImpact / 4200),
    };
  });
}

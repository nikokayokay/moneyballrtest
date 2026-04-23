import { useMemo, useState } from "react";
import Globe from "react-globe.gl";
import { cn } from "@/lib/utils";
import { internationalPipeline } from "@/src/data/milb";

const coords: Record<string, { lat: number; lng: number }> = {
  "United States": { lat: 39, lng: -98 },
  "Dominican Republic": { lat: 18.7, lng: -70.2 },
  Venezuela: { lat: 6.4, lng: -66.6 },
  Japan: { lat: 36.2, lng: 138.2 },
  Canada: { lat: 56.1, lng: -106.3 },
};

export function PlayerGlobe({ className }: { className?: string }) {
  const [active, setActive] = useState<string | null>(null);
  const points = useMemo(() => internationalPipeline().map((region) => ({
    ...region,
    lat: coords[region.origin]?.lat || 20,
    lng: coords[region.origin]?.lng || 0,
    size: 0.25 + region.count * 0.08,
  })), []);

  return (
    <section className={cn("overflow-hidden rounded-3xl border border-white/10 bg-[#070d16] p-4", className)}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.18em] text-cyan-200">Origin map</div>
          <h2 className="mt-2 font-['Bebas_Neue'] text-4xl leading-none tracking-[0.06em] text-white">Player origin globe</h2>
        </div>
        <div className="max-w-xs text-right text-xs leading-5 text-slate-500">
          {active || "Hover a region to see concentration"}
        </div>
      </div>
      <div className="mt-4 h-[360px] rounded-2xl bg-[#03060d]">
        <Globe
          width={undefined}
          height={360}
          backgroundColor="rgba(0,0,0,0)"
          globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
          bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
          pointsData={points}
          pointLat="lat"
          pointLng="lng"
          pointAltitude="size"
          pointRadius={(point) => Math.max(0.12, Number((point as { count: number }).count) * 0.08)}
          pointColor={() => "#34d399"}
          onPointHover={(point) => {
            const region = point as { origin: string; count: number } | null;
            setActive(region ? `${region.origin}: ${region.count} tracked players` : null);
          }}
          onPointClick={(point) => {
            const region = point as { origin: string } | null;
            if (region) window.location.hash = `/minor-leagues/international?region=${encodeURIComponent(region.origin)}`;
          }}
        />
      </div>
    </section>
  );
}

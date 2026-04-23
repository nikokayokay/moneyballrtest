import { Link } from "react-router-dom";
import { Globe2 } from "lucide-react";
import { ProspectCard } from "@/src/components/milb/ProspectCard";
import { PageShell, SectionHeader } from "@/src/components/layout/PageShell";
import { internationalPipeline } from "@/src/data/milb";

export function MinorLeagueInternationalPage() {
  const regions = internationalPipeline();

  return (
    <PageShell>
      <section className="surface-primary">
        <SectionHeader
          eyebrow="International pipeline"
          title="Where future value enters the system"
          copy="MiLB origin data connects the prospect layer to the global discovery model. Regions brighten as tracked prospect concentration grows."
        />
        <div className="grid grid-cols-1 gap-px bg-white/8 lg:grid-cols-[1fr_1.618fr]">
          <div className="bg-[#080d16] p-5">
            <div className="relative aspect-square overflow-hidden rounded-full border border-cyan-300/10 bg-[radial-gradient(circle_at_40%_35%,rgba(103,232,249,.22),transparent_32%),radial-gradient(circle_at_60%_65%,rgba(52,211,153,.16),transparent_26%),#050914]">
              <div className="absolute inset-8 rounded-full border border-white/8" />
              {regions.map((region, index) => (
                <div
                  key={region.origin}
                  className="absolute rounded-full bg-emerald-300 shadow-[0_0_28px_rgba(52,211,153,.45)]"
                  style={{
                    width: `${16 + region.intensity * 26}px`,
                    height: `${16 + region.intensity * 26}px`,
                    left: `${26 + index * 17}%`,
                    top: `${34 + (index % 3) * 15}%`,
                    opacity: 0.55 + region.intensity * 0.4,
                  }}
                  title={`${region.origin}: ${region.count} tracked`}
                />
              ))}
              <div className="absolute bottom-5 left-5 flex items-center gap-2 font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.16em] text-cyan-200">
                <Globe2 className="h-4 w-4" />
                MiLB origin layer
              </div>
            </div>
          </div>
          <div className="bg-[#080d16] p-4">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {regions.map((region) => (
                <section key={region.origin} className="border border-white/8 bg-white/[0.025] p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="mb-label text-cyan-200">Region</div>
                      <div className="font-['Barlow_Condensed'] text-2xl font-semibold uppercase tracking-[0.08em] text-white">{region.origin}</div>
                    </div>
                    <div className="font-['Bebas_Neue'] text-4xl leading-none text-emerald-300">{region.count}</div>
                  </div>
                  <div className="mb-label mt-3 text-[8px]">Orgs: {region.organizations.join(", ")}</div>
                  <div className="mt-3 space-y-2">
                    {region.topProspects.map((prospect) => (
                      <Link key={prospect.id} to={`/minor-leagues/players/${prospect.id}`} className="block text-sm text-slate-400 transition hover:text-emerald-200">
                        {prospect.name} · {prospect.orgAbbr} · {prospect.level}
                      </Link>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </div>
        </div>
      </section>
    </PageShell>
  );
}

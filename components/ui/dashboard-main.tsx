import { motion } from "framer-motion";
import { Suspense, lazy, useEffect, useRef, useState } from "react";
import { AffiliateLadder } from "@/components/ui/affiliate-ladder";
import { PlayerCompare } from "@/components/ui/player-compare";
import { StatLeaders } from "@/components/ui/stat-leaders";
import { TeamAnalytics } from "@/components/ui/team-analytics";
import { TeamIdentityPanel } from "@/components/ui/team-identity-panel";
import { TeamSelector } from "@/components/ui/team-selector";
import type { DashboardTeam } from "@/src/data/team-dashboard";

const ExportCard = lazy(() => import("@/components/ui/export-card").then((module) => ({ default: module.ExportCard })));
const PlayerGlobe = lazy(() => import("@/components/ui/player-globe").then((module) => ({ default: module.PlayerGlobe })));

function ModuleFallback({ label }: { label: string }) {
  return (
    <section className="rounded-3xl border border-white/10 bg-[#070d16] p-4">
      <div className="font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.18em] text-slate-500">{label}</div>
      <div className="mt-4 h-48 animate-pulse rounded-2xl bg-white/[0.035]" />
    </section>
  );
}

export function DashboardMain({ teams, selectedTeam, onSelectTeam }: { teams: DashboardTeam[]; selectedTeam: DashboardTeam; onSelectTeam: (team: DashboardTeam) => void }) {
  const globeSentinelRef = useRef<HTMLDivElement | null>(null);
  const [loadGlobe, setLoadGlobe] = useState(false);

  useEffect(() => {
    const target = globeSentinelRef.current;
    if (!target || loadGlobe) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setLoadGlobe(true);
    }, { rootMargin: "300px" });
    observer.observe(target);
    return () => observer.disconnect();
  }, [loadGlobe]);

  return (
    <div className="h-full overflow-y-auto scrollbar-thin">
      <div className="mx-auto flex w-full max-w-[112rem] flex-col gap-4 p-3 sm:p-4 lg:p-5">
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28 }}
          className="grid grid-cols-1 gap-4 xl:hidden"
        >
          <TeamIdentityPanel team={selectedTeam} />
        </motion.section>

        <TeamSelector teams={teams} selected={selectedTeam} onSelect={onSelectTeam} />

        <section className="grid grid-cols-1 gap-4 2xl:grid-cols-[1.618fr_1fr]">
          <TeamAnalytics team={selectedTeam} />
          <Suspense fallback={<ModuleFallback label="Loading export engine" />}>
            <ExportCard title="Shareable team card" filename={`${selectedTeam.abbr}-dashboard-card`}>
              <div className="flex h-full flex-col justify-between">
                <div>
                  <div className="font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.18em] text-cyan-200">Moneyballr team snapshot</div>
                  <div className="mt-3 flex items-center gap-4">
                    <img src={selectedTeam.logoUrl} alt="" className="h-20 w-20 object-contain" />
                    <div>
                      <div className="font-['Bebas_Neue'] text-6xl leading-none tracking-[0.06em] text-white">{selectedTeam.abbr}</div>
                      <div className="text-sm text-slate-400">{selectedTeam.name} · {selectedTeam.record}</div>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-px overflow-hidden rounded-2xl bg-white/10">
                  {[
                    ["OPS", selectedTeam.ops.toFixed(3).replace(/^0/, "")],
                    ["ERA", selectedTeam.era.toFixed(2)],
                    ["DIFF", selectedTeam.runDifferential > 0 ? `+${selectedTeam.runDifferential}` : selectedTeam.runDifferential],
                    ["FARM", `#${selectedTeam.farmRank}`],
                  ].map(([label, value]) => (
                    <div key={label} className="bg-[#080d16] p-3">
                      <div className="font-['Bebas_Neue'] text-4xl leading-none text-emerald-300">{value}</div>
                      <div className="mt-1 font-['JetBrains_Mono'] text-[8px] uppercase tracking-[0.16em] text-slate-500">{label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </ExportCard>
          </Suspense>
        </section>

        <AffiliateLadder team={selectedTeam} />

        <section className="grid grid-cols-1 gap-4 2xl:grid-cols-[1fr_1.618fr]">
          <PlayerCompare />
          <StatLeaders />
        </section>

        <div ref={globeSentinelRef}>
          {loadGlobe ? (
            <Suspense fallback={<ModuleFallback label="Loading player origin globe" />}>
              <PlayerGlobe />
            </Suspense>
          ) : (
            <ModuleFallback label="Player origin globe loads on scroll" />
          )}
        </div>
      </div>
    </div>
  );
}

import type { PlayerProfile } from "@/src/lib/mlb";
import { AreaTrendChart } from "@/src/components/charts/AreaTrendChart";
import { GamePerformanceCard } from "@/src/components/player/GamePerformanceCard";
import { InsightTag } from "@/src/components/player/InsightTag";
import { PlayerHeroPanel } from "@/src/components/player/PlayerHeroPanel";
import { StatStripRow } from "@/src/components/player/StatStripRow";

type ProfileViewProps = {
  profile: PlayerProfile;
};

function isReal(value: string | null | undefined) {
  return Boolean(value && value !== "Unavailable" && value !== "N/A" && !value.includes("unavailable"));
}

function pickStat(items: Array<[string, string]>, label: string) {
  const value = items.find(([stat]) => stat === label)?.[1];
  return isReal(value) ? value : null;
}

function numeric(value: string | null) {
  if (!value) return null;
  const parsed = Number(value.replace(/[^0-9.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function processTone(delta: number | null) {
  if (delta === null) return "neutral" as const;
  if (delta > 0.025) return "warning" as const;
  if (delta < -0.025) return "positive" as const;
  return "neutral" as const;
}

function MiniTable({ title, rows }: { title: string; rows: Array<[string, string]> }) {
  const clean = rows.filter(([, value]) => isReal(value));
  if (!clean.length) return null;

  return (
    <section className="bg-[#090f19]">
      <div className="border-b border-white/8 px-4 py-3 font-['Bebas_Neue'] text-[clamp(1.7rem,2.4vw,2.4rem)] tracking-[0.06em] text-white">{title}</div>
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6">
        {clean.map(([label, value]) => (
          <div key={`${title}-${label}`} className="border-b border-r border-white/8 px-3 py-2.5">
            <div className="font-['JetBrains_Mono'] text-[9px] uppercase tracking-[0.15em] text-slate-500">{label}</div>
            <div className="mt-1 font-['Barlow_Condensed'] text-xl font-semibold tracking-[0.04em] text-slate-100">{value}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function ProcessVsResults({ profile }: { profile: PlayerProfile }) {
  const rows = profile.expectedActual.filter((item) => item.expected !== null && item.actual !== null && ["wOBA", "SLG", "BA"].includes(item.label));
  if (!rows.length) return null;
  const averageDelta = rows.reduce((sum, item) => sum + (item.delta || 0), 0) / rows.length;
  const label = averageDelta > 0.02 ? "Overperforming" : averageDelta < -0.02 ? "Underperforming" : "Aligned";

  return (
    <section className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1.618fr)_minmax(16rem,1fr)]">
      <div className="bg-[#090f19] p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="font-['Bebas_Neue'] text-[clamp(1.9rem,2.8vw,2.8rem)] tracking-[0.06em] text-white">Process vs Results</div>
          <InsightTag tone={processTone(averageDelta)}>{label}</InsightTag>
        </div>
        <div className="space-y-3">
          {rows.map((item) => {
            const actual = item.actual || 0;
            const expected = item.expected || 0;
            const max = Math.max(actual, expected, 0.35);
            return (
              <div key={item.label} className="grid grid-cols-[4rem_1fr_4.5rem] items-center gap-3 text-sm">
                <div className="font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.15em] text-slate-500">{item.label}</div>
                <div className="space-y-1">
                  <div className="h-1.5 bg-slate-800"><div className="h-full bg-cyan-300" style={{ width: `${Math.min(100, (actual / max) * 100)}%` }} /></div>
                  <div className="h-1.5 bg-slate-800"><div className="h-full bg-emerald-400" style={{ width: `${Math.min(100, (expected / max) * 100)}%` }} /></div>
                </div>
                <div className="text-right font-['JetBrains_Mono'] text-[10px] text-slate-400">{item.delta !== null ? `${item.delta > 0 ? "+" : ""}${item.delta.toFixed(3)}` : ""}</div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="bg-[#0b121d] p-4 text-sm leading-6 text-slate-300">
        <div className="font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.18em] text-slate-500">Read</div>
        <p className="mt-3">{profile.decisionInsight}</p>
      </div>
    </section>
  );
}

function RollingGraph({ profile }: { profile: PlayerProfile }) {
  const points = profile.trendData.filter((point) => point.woba !== null).slice(-10);
  if (!points.length) return null;

  return (
    <AreaTrendChart
      eyebrow="Rolling form"
      title="15-game wOBA pulse"
      points={points.map((point) => ({ label: point.label, value: point.woba }))}
      valueLabel="wOBA"
    />
  );
}

export function ProfileView({ profile }: ProfileViewProps) {
  const strip = [
    ["AVG", pickStat(profile.standardStats, "AVG")],
    ["OBP", pickStat(profile.standardStats, "OBP")],
    ["SLG", pickStat(profile.standardStats, "SLG")],
    ["OPS", pickStat(profile.standardStats, "OPS")],
    ["wOBA", pickStat(profile.advancedStats, "wOBA")],
    ["xwOBA", pickStat(profile.advancedStats, "xwOBA")],
    ["K%", pickStat(profile.advancedStats, "K%")],
    ["BB%", pickStat(profile.advancedStats, "BB%")],
  ].filter((item): item is [string, string] => item[1] !== null).map(([label, value]) => {
    const delta = label === "wOBA" ? numeric(value) !== null ? `${((numeric(value) || 0) - 0.320 > 0 ? "+" : "")}${((numeric(value) || 0) - 0.320).toFixed(3)} lg` : undefined : undefined;
    return { label, value, delta, tone: delta?.startsWith("+") ? "positive" as const : "neutral" as const };
  });

  const standard = profile.standardStats.filter(([label]) => !["AVG", "OBP", "SLG", "OPS"].includes(label));
  const advanced = profile.advancedStats.filter(([label]) => !["wOBA", "xwOBA", "K%", "BB%"].includes(label));

  return (
    <div className="space-y-3">
      <PlayerHeroPanel profile={profile} />
      <StatStripRow items={strip} />
      <GamePerformanceCard profile={profile} />
      <ProcessVsResults profile={profile} />
      <RollingGraph profile={profile} />
      <div className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1.618fr)_minmax(18rem,1fr)]">
        <MiniTable title={profile.type === "pitcher" ? "Pitching totals" : "Standard stats"} rows={standard} />
        <MiniTable title="Advanced" rows={advanced} />
      </div>
      <MiniTable title="Splits" rows={profile.splits} />
    </div>
  );
}

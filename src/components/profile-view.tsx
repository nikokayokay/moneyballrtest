import type { ReactNode } from "react";
import { Activity, ChevronDown, Crosshair, Info, Radar, ShieldCheck, Sparkles } from "lucide-react";
import type { PlayerProfile } from "@/src/lib/mlb";

type ProfileViewProps = {
  profile: PlayerProfile;
};

function Section({ label, title, copy, children }: { label: string; title: string; copy: string; children: ReactNode }) {
  return (
    <section className="rounded-[28px] border border-white/8 bg-slate-950/72 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.24em] text-slate-500">{label}</div>
          <div className="mt-2 font-['Bebas_Neue'] text-[clamp(2rem,3.2vw,2.85rem)] tracking-[0.08em] text-white">{title}</div>
        </div>
        <div className="max-w-xl text-sm leading-7 text-slate-400">{copy}</div>
      </div>
      {children}
    </section>
  );
}

function MetricCards({ items }: { items: Array<[string, string]> }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {items.map(([label, value]) => (
        <div key={`${label}-${value}`} className="stat-shine rounded-[22px] border border-white/8 p-4">
          <div className="font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.18em] text-slate-500">{label}</div>
          <div className="mt-2 font-['Bebas_Neue'] text-3xl tracking-[0.08em] text-white">{value}</div>
        </div>
      ))}
    </div>
  );
}

function formatMaybe(value: number | null, digits = 1, suffix = "") {
  return Number.isFinite(value) ? `${(value as number).toFixed(digits)}${suffix}` : "Unavailable";
}

function ratingTone(score: number) {
  if (score >= 75) return { accent: "text-emerald-300", soft: "text-emerald-100", ring: "#36d399", panel: "border-emerald-400/20 bg-emerald-400/8", label: "Elite Track" };
  if (score >= 52) return { accent: "text-amber-200", soft: "text-amber-50", ring: "#f6c453", panel: "border-amber-300/20 bg-amber-300/8", label: "Average Track" };
  return { accent: "text-rose-300", soft: "text-rose-100", ring: "#fb7185", panel: "border-rose-400/20 bg-rose-400/8", label: "Struggling Track" };
}

function confidenceTone(label: PlayerProfile["confidenceEngine"]["label"]) {
  if (label === "Reliable") return "text-emerald-300";
  if (label === "Stabilizing") return "text-amber-200";
  return "text-slate-200";
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-slate-400">
      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
      <span>{label}</span>
    </div>
  );
}

function PerformanceMeter({ score }: { score: number }) {
  const tone = ratingTone(score);
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const dash = circumference * (Math.max(0, Math.min(100, score)) / 100);

  return (
    <div className={`relative flex aspect-square w-full max-w-[11rem] items-center justify-center rounded-full border ${tone.panel}`}>
      <svg viewBox="0 0 140 140" className="absolute inset-0 h-full w-full -rotate-90">
        <circle cx="70" cy="70" r={radius} stroke="rgba(255,255,255,0.08)" strokeWidth="10" fill="none" />
        <circle cx="70" cy="70" r={radius} stroke={tone.ring} strokeWidth="10" strokeLinecap="round" fill="none" strokeDasharray={`${dash} ${circumference - dash}`} className="transition-all duration-700 ease-out" />
      </svg>
      <div className="text-center">
        <div className={`font-['Bebas_Neue'] text-6xl tracking-[0.08em] ${tone.accent}`}>{score}</div>
        <div className="font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.22em] text-slate-400">Player Rating</div>
        <div className={`mt-1 text-xs uppercase tracking-[0.18em] ${tone.soft}`}>{tone.label}</div>
      </div>
    </div>
  );
}

function ConfidenceMeter({ engine }: { engine: PlayerProfile["confidenceEngine"] }) {
  const width = `${Math.max(6, Math.min(100, engine.percent))}%`;

  return (
    <div className="rounded-[24px] border border-white/8 bg-white/[0.03] p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.2em] text-slate-500">
            Confidence Engine
            <span className="group relative inline-flex">
              <Info className="h-3.5 w-3.5 text-slate-400" />
              <span className="pointer-events-none absolute left-1/2 top-full z-10 mt-2 hidden w-56 -translate-x-1/2 rounded-xl border border-white/8 bg-slate-950/95 p-3 text-[11px] normal-case leading-5 tracking-normal text-slate-300 shadow-[0_18px_40px_rgba(0,0,0,0.4)] group-hover:block">
                {engine.explanation}
              </span>
            </span>
          </div>
          <div className="mt-3 flex items-end gap-3">
            <div className="font-['Bebas_Neue'] text-6xl tracking-[0.08em] text-white">{engine.percent}<span className="text-3xl text-slate-400">%</span></div>
            <div className={`pb-2 font-['Barlow_Condensed'] text-xl uppercase tracking-[0.12em] ${confidenceTone(engine.label)}`}>{engine.label}</div>
          </div>
        </div>
        <ShieldCheck className="mt-1 h-5 w-5 text-slate-400" />
      </div>
      <div className="mt-4 h-3 overflow-hidden rounded-full bg-white/6">
        <div className={`h-full rounded-full transition-all duration-700 ${engine.label === "Reliable" ? "bg-emerald-400" : engine.label === "Stabilizing" ? "bg-amber-300" : "bg-slate-300"}`} style={{ width }} />
      </div>
      <div className="mt-3 text-sm leading-7 text-slate-400">{engine.explanation}</div>
    </div>
  );
}

function TrendGraph({ data }: { data: PlayerProfile["trendData"] }) {
  const valid = data.filter((point) => point.woba !== null || point.hardHit !== null || point.kRate !== null);

  if (!valid.length) {
    return <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4 text-sm text-slate-400">Trend detail becomes available after tracked MLB game activity is recorded.</div>;
  }

  const width = 720;
  const height = 260;
  const paddingX = 36;
  const paddingY = 24;
  const chartWidth = width - (paddingX * 2);
  const chartHeight = height - (paddingY * 2);

  const makePoints = (values: Array<number | null>, max: number) => values.map((value, index) => {
    const x = paddingX + ((chartWidth / Math.max(1, values.length - 1)) * index);
    const normalized = value === null ? 0.5 : Math.max(0, Math.min(1, value / max));
    const y = paddingY + ((1 - normalized) * chartHeight);
    return `${x},${y}`;
  }).join(" ");

  const labels = valid.map((point) => point.label);
  const wobaPoints = makePoints(valid.map((point) => point.woba), 0.6);
  const hardHitPoints = makePoints(valid.map((point) => point.hardHit), 100);
  const kRatePoints = makePoints(valid.map((point) => point.kRate), 60);

  return (
    <div className="rounded-[24px] border border-white/8 bg-white/[0.03] p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm leading-7 text-slate-400">Rolling read on quality of contact, swing damage, and swing-and-miss pressure from the most recent MLB games.</div>
        <div className="flex flex-wrap gap-4">
          <LegendDot color="#67e8f9" label="wOBA" />
          <LegendDot color="#34d399" label="Hard Hit%" />
          <LegendDot color="#f87171" label="K%" />
        </div>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-64 w-full">
        {[0.25, 0.5, 0.75].map((step) => (
          <line key={step} x1={paddingX} y1={paddingY + ((1 - step) * chartHeight)} x2={width - paddingX} y2={paddingY + ((1 - step) * chartHeight)} stroke="rgba(255,255,255,0.08)" strokeDasharray="4 6" />
        ))}
        <polyline fill="none" stroke="#67e8f9" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" points={wobaPoints} />
        <polyline fill="none" stroke="#34d399" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" points={hardHitPoints} />
        <polyline fill="none" stroke="#f87171" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" points={kRatePoints} />
        {labels.map((label, index) => {
          const x = paddingX + ((chartWidth / Math.max(1, labels.length - 1)) * index);
          return <text key={label} x={x} y={height - 2} textAnchor="middle" className="fill-slate-500 text-[10px] uppercase tracking-[0.16em]">{label}</text>;
        })}
      </svg>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {valid.slice(-3).map((point) => (
          <div key={point.label} className="rounded-2xl border border-white/8 bg-slate-950/60 p-4">
            <div className="font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.18em] text-slate-500">{point.label}</div>
            <div className="mt-2 text-sm leading-7 text-slate-300">
              <div>wOBA {formatMaybe(point.woba, 3)}</div>
              <div>Hard Hit {formatMaybe(point.hardHit, 1, "%")}</div>
              <div>K% {formatMaybe(point.kRate, 1, "%")}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ZoneHeatmap({ zone }: { zone: PlayerProfile["zoneIntelligence"] }) {
  const cellTone = (damage: number | null) => {
    if (!Number.isFinite(damage)) return "rgba(148,163,184,0.14)";
    if ((damage as number) >= 0.42) return "rgba(16,185,129,0.42)";
    if ((damage as number) >= 0.32) return "rgba(245,158,11,0.34)";
    return "rgba(244,63,94,0.32)";
  };

  return (
    <div className="rounded-[24px] border border-white/8 bg-white/[0.03] p-5">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div className="text-sm leading-7 text-slate-400">Swing, miss, and damage by strike-zone bucket. Stronger greens indicate more damage when the ball is put in play.</div>
        <div className="font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.18em] text-slate-500">{zone.sampleLabel}</div>
      </div>
      <div className="mx-auto grid max-w-[420px] grid-cols-3 gap-3">
        {zone.cells.map((cell) => (
          <div key={cell.label} className="rounded-[20px] border border-white/8 p-4 text-center" style={{ background: cellTone(cell.damage) }}>
            <div className="font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.18em] text-slate-300">Zone {cell.label}</div>
            <div className="mt-3 space-y-1 text-sm leading-6 text-white/90">
              <div>Swing {formatMaybe(cell.swingPct, 0, "%")}</div>
              <div>Whiff {formatMaybe(cell.whiffPct, 0, "%")}</div>
              <div>Damage {formatMaybe(cell.damage, 3)}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ExpectedActualPanel({ profile }: { profile: PlayerProfile }) {
  return (
    <div className="rounded-[24px] border border-white/8 bg-white/[0.03] p-5">
      <div className="space-y-4">
        {profile.expectedActual.map((item) => {
          const widthActual = `${Math.max(10, Math.min(100, (item.actual ?? 0) * (profile.type === "pitcher" ? 140 : 180)))}%`;
          const widthExpected = `${Math.max(10, Math.min(100, (item.expected ?? 0) * (profile.type === "pitcher" ? 140 : 180)))}%`;
          const positiveGap = (item.delta ?? 0) >= 0;

          return (
            <div key={item.label} className="rounded-2xl border border-white/8 bg-slate-950/60 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.18em] text-slate-500">{item.label}</div>
                <div className={`text-xs uppercase tracking-[0.16em] ${positiveGap ? "text-emerald-300" : "text-rose-300"}`}>{item.delta === null ? "Delta unavailable" : `${positiveGap ? "+" : ""}${item.delta.toFixed(3)}`}</div>
              </div>
              <div className="mt-4 space-y-3">
                <div>
                  <div className="mb-1 flex items-center justify-between text-sm text-slate-300">
                    <span>Actual</span>
                    <span>{formatMaybe(item.actual, 3)}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/6">
                    <div className="h-full rounded-full bg-cyan-300" style={{ width: widthActual }} />
                  </div>
                </div>
                <div>
                  <div className="mb-1 flex items-center justify-between text-sm text-slate-300">
                    <span>Expected</span>
                    <span>{formatMaybe(item.expected, 3)}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/6">
                    <div className="h-full rounded-full bg-emerald-400" style={{ width: widthExpected }} />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function IdentityLine({ children }: { children: ReactNode }) {
  return <span className="font-['Barlow_Condensed'] text-base uppercase tracking-[0.16em] text-slate-300">{children}</span>;
}

export function ProfileView({ profile }: ProfileViewProps) {
  const tone = ratingTone(profile.confidence.score);

  return (
    <div className="space-y-6">
      <section className="panel-glow overflow-hidden rounded-[34px] border border-white/8 bg-slate-950/82 p-6 shadow-[0_26px_80px_rgba(0,0,0,0.5)] lg:p-8">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-6 xl:grid-cols-12 xl:items-start">
          <div className="rounded-[28px] border border-white/8 bg-white/[0.03] p-5 md:col-span-6 xl:col-span-5">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <div className="h-32 w-32 overflow-hidden rounded-full border border-white/10 bg-slate-900 shadow-[0_12px_32px_rgba(0,0,0,0.35)]">
                <img src={profile.identity.headshotUrl} alt={profile.identity.fullName} className="h-full w-full object-cover object-top scale-[1.08]" />
              </div>
              <div className="min-w-0">
                <div className="headline-shadow font-['Bebas_Neue'] text-[clamp(2.75rem,6vw,5.5rem)] leading-none tracking-[0.08em] text-white">{profile.identity.fullName}</div>
                <div className="mt-4 flex flex-wrap gap-x-3 gap-y-2">
                  <IdentityLine>{profile.identity.team}</IdentityLine>
                  <IdentityLine>{profile.identity.position}</IdentityLine>
                  <IdentityLine>{profile.identity.bats || "N/A"}/{profile.identity.throws || "N/A"}</IdentityLine>
                  <IdentityLine>{profile.identity.age ? `Age ${profile.identity.age}` : "Age unavailable"}</IdentityLine>
                </div>
                <div className="mt-3 flex flex-wrap gap-x-3 gap-y-2">
                  <IdentityLine>{profile.identity.jerseyNumber ? `#${profile.identity.jerseyNumber}` : "No number listed"}</IdentityLine>
                  <IdentityLine>{profile.identity.battingOrder ? `Order ${profile.identity.battingOrder}` : "Order unavailable"}</IdentityLine>
                  <IdentityLine>{profile.identity.status}</IdentityLine>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[28px] border border-white/8 bg-white/[0.03] p-5 md:col-span-3 xl:col-span-4">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <div className="font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.2em] text-slate-500">Performance Snapshot</div>
                <div className="mt-2 font-['Bebas_Neue'] text-[clamp(2rem,3vw,2.75rem)] tracking-[0.08em] text-white">Current Level</div>
              </div>
              <Activity className={`h-5 w-5 ${tone.accent}`} />
            </div>
            <div className="flex flex-col items-center gap-5 lg:flex-row lg:items-center">
              <PerformanceMeter score={profile.confidence.score} />
              <div className="flex-1">
                <div className={`inline-flex rounded-full border px-4 py-2 font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.2em] ${tone.panel} ${tone.accent}`}>
                  {profile.archetype}
                </div>
                <div className="mt-4 text-sm leading-7 text-slate-300">{profile.decisionInsight}</div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-white/8 bg-slate-950/60 p-4">
                    <div className="font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.18em] text-slate-500">Trend Signal</div>
                    <div className="mt-2 font-['Bebas_Neue'] text-3xl tracking-[0.08em] text-white">{profile.confidence.trend}</div>
                  </div>
                  <div className="rounded-2xl border border-white/8 bg-slate-950/60 p-4">
                    <div className="font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.18em] text-slate-500">Decision Score</div>
                    <div className="mt-2 font-['Bebas_Neue'] text-3xl tracking-[0.08em] text-white">{profile.confidence.comparisonScore}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="md:col-span-3 xl:col-span-3">
            <ConfidenceMeter engine={profile.confidenceEngine} />
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-6 xl:grid-cols-12">
        <div className="md:col-span-6 xl:col-span-7">
        <Section label="Trend Graph" title="Rolling Performance Pulse" copy="The trend layer is built to show whether contact quality and swing decisions are getting better or worse, not just whether a player had a loud box score.">
          <TrendGraph data={profile.trendData} />
        </Section>
        </div>

        <div className="md:col-span-6 xl:col-span-5">
        <Section label="Decision Insight" title="What The Data Suggests" copy="This module translates current performance, expected metrics, and stability into a short decision-making read instead of a generic player note.">
          <div className="grid gap-4">
            <div className="rounded-[24px] border border-emerald-400/15 bg-gradient-to-br from-emerald-400/10 via-white/[0.03] to-cyan-400/10 p-5">
              <div className="flex items-start gap-3">
                <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-3">
                  <Sparkles className="h-5 w-5 text-emerald-300" />
                </div>
                <div>
                  <div className="font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.18em] text-slate-500">Auto Insight</div>
                  <div className="mt-3 text-base leading-8 text-slate-100">{profile.decisionInsight}</div>
                </div>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                <div className="font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.18em] text-slate-500">Sample Tier</div>
                <div className="mt-2 font-['Bebas_Neue'] text-3xl tracking-[0.08em] text-white">{profile.sample.badgeLabel}</div>
                <div className="mt-2 text-sm leading-7 text-slate-400">{profile.sample.reason}</div>
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                <div className="font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.18em] text-slate-500">Confidence Note</div>
                <div className="mt-2 font-['Bebas_Neue'] text-3xl tracking-[0.08em] text-white">{profile.confidence.dataConfidence}</div>
                <div className="mt-2 text-sm leading-7 text-slate-400">{profile.confidence.insight}</div>
              </div>
            </div>
          </div>
        </Section>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-6 xl:grid-cols-12">
        <div className="md:col-span-3 xl:col-span-6">
        <Section label="Strike Zone Intelligence" title="Swing / Whiff / Damage Map" copy="Zone intelligence updates by player and uses recent pitch-event context so the heatmap reflects how attacks and mistakes are actually showing up.">
          <ZoneHeatmap zone={profile.zoneIntelligence} />
        </Section>
        </div>

        <div className="md:col-span-3 xl:col-span-6">
        <Section label="Expected vs Actual" title="Process Against Results" copy="This panel shows whether outcomes are being supported by underlying contact quality or being dragged by short-term noise.">
          <ExpectedActualPanel profile={profile} />
        </Section>
        </div>
      </div>

      <Section label="Overview" title="Player Overview" copy="Identity and roster details stay source-backed and are kept separate from the performance layer so the page can update live without mis-mapping players.">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {[
            ["Bats / Throws", `${profile.identity.bats || "N/A"} / ${profile.identity.throws || "N/A"}`],
            ["Height / Weight", profile.identity.height && profile.identity.weight ? `${profile.identity.height} / ${profile.identity.weight} lb` : "Unavailable"],
            ["MLB Debut", profile.identity.debutDate || "Unavailable"],
            ["Team Status", profile.identity.status],
            ["Sample", profile.sample.sampleLabel],
            ["Comparison Score", String(profile.confidence.comparisonScore)],
          ].map(([label, value]) => (
            <div key={label} className="stat-shine rounded-[22px] border border-white/8 p-4">
              <div className="font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.18em] text-slate-500">{label}</div>
              <div className="mt-2 font-['Bebas_Neue'] text-3xl tracking-[0.08em] text-white">{value}</div>
            </div>
          ))}
        </div>
      </Section>

      <Section label="Integrity" title="Sources + Validation" copy="If multiple live sources disagree, the profile surfaces the conflict here instead of pretending the data is cleaner than it is.">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {Object.entries(profile.sources).map(([label, value]) => (
            <div key={label} className="stat-shine rounded-[22px] border border-white/8 p-4">
              <div className="font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.18em] text-slate-500">{label}</div>
              <div className="mt-2 text-sm leading-7 text-slate-300">{value}</div>
            </div>
          ))}
        </div>
        <div className="mt-4 grid gap-3">
          {profile.validation.map((message) => (
            <div key={message.text} className={`rounded-2xl border px-4 py-3 text-sm leading-7 ${message.level === "ok" ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-200" : message.level === "warn" ? "border-amber-300/20 bg-amber-300/10 text-amber-100" : "border-rose-400/20 bg-rose-400/10 text-rose-100"}`}>
              {message.text}
            </div>
          ))}
        </div>
      </Section>

      <Section label="Standard Stats" title={profile.type === "pitcher" ? "Pitching Totals" : "Hitting Totals"} copy="Core season production stays visible, but the header no longer asks the user to do all the interpretation alone.">
        <MetricCards items={profile.standardStats} />
      </Section>

      <Section label="Advanced Stats" title="Quality + Advanced Metrics" copy="Expected outcomes, discipline, quality of contact, and advanced run value metrics stay explicit and null-safe.">
        <MetricCards items={profile.advancedStats} />
      </Section>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-6 xl:grid-cols-12">
        <div className="md:col-span-3 xl:col-span-6">
        <Section label="Splits" title="Handedness + Venue" copy="Splits remain comparison-ready, while low-sample noise is handled in the confidence layer rather than hidden.">
          <div className="grid gap-3 sm:grid-cols-2">
            {profile.splits.map(([label, value]) => (
              <div key={label} className="stat-shine rounded-[22px] border border-white/8 p-4">
                <div className="font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.18em] text-slate-500">{label}</div>
                <div className="mt-3 text-sm leading-7 text-slate-300">{value}</div>
              </div>
            ))}
          </div>
        </Section>
        </div>

        <div className="md:col-span-3 xl:col-span-6">
        <Section label="Rolling Windows" title="Last 7 / 15 / 30" copy="Rolling windows are derived from the same source family as the full season log so the story stays internally consistent.">
          <div className="grid gap-3">
            {profile.windows.map(([label, value]) => (
              <div key={label} className="stat-shine rounded-[22px] border border-white/8 p-4">
                <div className="font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.18em] text-slate-500">{label}</div>
                <div className="mt-2 flex items-center justify-between gap-4">
                  <div className="font-['Bebas_Neue'] text-3xl tracking-[0.08em] text-white">{value}</div>
                  <ChevronDown className="h-4 w-4 rotate-[-90deg] text-slate-500" />
                </div>
              </div>
            ))}
          </div>
        </Section>
        </div>
      </div>

      {profile.type === "pitcher" ? (
        <Section label="Pitch Mix" title="Usage + Movement" copy="Pitch-type mix is based on live recent event feeds when that tracking data is available.">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {(profile.pitchMix.length ? profile.pitchMix : [{ pitchType: "Unavailable", usage: "Unavailable", avgVelo: "Unavailable", hMov: "Unavailable", vMov: "Unavailable" }]).map((pitch) => (
              <div key={pitch.pitchType} className="stat-shine rounded-[22px] border border-white/8 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="font-['Bebas_Neue'] text-3xl tracking-[0.08em] text-white">{pitch.pitchType}</div>
                  <Radar className="h-4 w-4 text-slate-500" />
                </div>
                <div className="mt-3 space-y-1 text-sm text-slate-300">
                  <div>Usage {pitch.usage}</div>
                  <div>Velo {pitch.avgVelo}</div>
                  <div>HB {pitch.hMov} • VB {pitch.vMov}</div>
                </div>
              </div>
            ))}
          </div>
        </Section>
      ) : null}

      <Section label="Recent Form" title={profile.recentGames.length ? "Most Recent MLB Games" : "No MLB Game Logs"} copy={profile.recentFormSummary}>
        {profile.recentGames.length ? (
          <div className="overflow-hidden rounded-2xl border border-white/8">
            <table className="min-w-full border-collapse">
              <thead className="bg-white/[0.03]">
                <tr>
                  {["Date", "Opponent", "Result", "Stat Line", "Impact"].map((header) => (
                    <th key={header} className="px-4 py-3 text-left font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.2em] text-slate-500">{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {profile.recentGames.map((game) => (
                  <tr key={`${game.date}-${game.opponent}`} className="border-t border-white/8 text-sm text-slate-300">
                    <td className="px-4 py-3">{game.date}</td>
                    <td className="px-4 py-3">{game.opponent}</td>
                    <td className="px-4 py-3">{game.result}</td>
                    <td className="px-4 py-3">{game.statLine}</td>
                    <td className="px-4 py-3">{game.impact}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4 text-sm text-slate-400">No MLB game logs available.</div>
        )}
      </Section>

      <Section label="Game Logs" title={`Full Season Log (${profile.allGames.length} Games)`} copy="Every MLB game played this season is available here. The list is complete and remains aligned with the recent form module above.">
        <div className="max-h-[720px] overflow-auto rounded-2xl border border-white/8 scrollbar-thin">
          <table className="min-w-full border-collapse">
            <thead className="sticky top-0 bg-slate-950">
              <tr>
                {["Date", "Opponent", "Result", "Stat Line", "Impact"].map((header) => (
                  <th key={header} className="px-4 py-3 text-left font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.2em] text-slate-500">{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {profile.allGames.length ? profile.allGames.map((game) => (
                <tr key={`${game.date}-${game.opponent}-${game.statLine}`} className="border-t border-white/8 text-sm text-slate-300">
                  <td className="px-4 py-3">{game.date}</td>
                  <td className="px-4 py-3">{game.opponent}</td>
                  <td className="px-4 py-3">{game.result}</td>
                  <td className="px-4 py-3">{game.statLine}</td>
                  <td className="px-4 py-3">{game.impact}</td>
                </tr>
              )) : (
                <tr><td colSpan={5} className="px-4 py-6 text-sm text-slate-400">No MLB games this season.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Section>

      <Section label="Live Game" title="Today's Status" copy={profile.liveGame.note}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="stat-shine rounded-[22px] border border-white/8 p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.18em] text-slate-500">Status</div>
              <Crosshair className="h-4 w-4 text-slate-500" />
            </div>
            <div className="mt-2 font-['Bebas_Neue'] text-3xl tracking-[0.08em] text-white">{profile.liveGame.status}</div>
          </div>
          <div className="stat-shine rounded-[22px] border border-white/8 p-4">
            <div className="font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.18em] text-slate-500">Opponent</div>
            <div className="mt-2 font-['Bebas_Neue'] text-3xl tracking-[0.08em] text-white">{profile.liveGame.opponent}</div>
          </div>
          {profile.liveGame.line.map(([label, value]) => (
            <div key={label} className="stat-shine rounded-[22px] border border-white/8 p-4">
              <div className="font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.18em] text-slate-500">{label}</div>
              <div className="mt-2 font-['Bebas_Neue'] text-3xl tracking-[0.08em] text-white">{value}</div>
            </div>
          ))}
        </div>
      </Section>

      <div className="text-right font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.18em] text-slate-500">
        Last refreshed {new Date(profile.fetchedAt).toLocaleString()}
      </div>
    </div>
  );
}

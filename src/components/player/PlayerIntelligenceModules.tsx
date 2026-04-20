import { useMemo, useRef, useState, type CSSProperties } from "react";
import { Eye, Star } from "lucide-react";
import type { PlayerProfile } from "@/src/lib/mlb";
import { AreaTrendChart } from "@/src/components/charts/AreaTrendChart";
import { ExportButton } from "@/src/components/share/ExportButton";
import { ShareCard } from "@/src/components/share/ShareCard";
import { InsightTag } from "@/src/components/player/InsightTag";
import { useWatchlist } from "@/src/hooks/useWatchlist";
import {
  classifyArchetype,
  classifyPlayerTrend,
  consistencyIndex,
  exportCaption,
  generatePlayerInsights,
  impactRecentScore,
  playerValueScore,
  trendTone,
} from "@/src/lib/player-intelligence";

function isReal(value: string | null | undefined) {
  return Boolean(value && value !== "Unavailable" && value !== "N/A" && !value.toLowerCase().includes("unavailable"));
}

function pick(rows: Array<[string, string]>, label: string) {
  const value = rows.find(([key]) => key === label)?.[1];
  return isReal(value) ? value : null;
}

export function CurrentFormModule({ profile }: { profile: PlayerProfile }) {
  const tag = classifyPlayerTrend(profile);
  const archetype = classifyArchetype(profile);
  const insights = generatePlayerInsights(profile);
  const valueScore = playerValueScore(profile);
  const consistency = consistencyIndex(profile);
  const impact = impactRecentScore(profile);
  const { isWatched, toggle } = useWatchlist();
  const watched = isWatched(profile.identity.playerId);
  const shareRef = useRef<HTMLDivElement>(null);
  const statRows = profile.type === "pitcher"
    ? ["ERA", "WHIP", "SO", "WAR"].map((label) => [label, pick(profile.standardStats, label) || pick(profile.advancedStats, label)] as const)
    : ["AVG", "OBP", "SLG", "OPS"].map((label) => [label, pick(profile.standardStats, label)] as const);

  return (
    <section className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1.618fr)_minmax(18rem,1fr)]">
      <div ref={shareRef} className="surface-secondary p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="mb-label text-cyan-200">Current form</div>
            <div className="mb-title mt-2 text-[clamp(2rem,3vw,3.2rem)] text-white">{tag}</div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <InsightTag tone={trendTone(tag)}>{archetype}</InsightTag>
            <button
              type="button"
              onClick={() => toggle({ id: profile.identity.playerId, type: "player", label: profile.identity.fullName })}
              className={`inline-flex items-center gap-2 border px-2.5 py-1.5 font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.14em] transition ${watched ? "border-emerald-300/30 bg-emerald-300/10 text-emerald-200" : "border-white/10 bg-white/[0.03] text-slate-400 hover:text-white"}`}
              data-export-hidden="true"
            >
              <Star className="h-3.5 w-3.5" />
              {watched ? "Tracking" : "Watch"}
            </button>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-px bg-white/8">
          {[
            ["Value", valueScore],
            ["Consistency", consistency],
            ["Impact", impact],
          ].map(([label, value]) => (
            <div key={label} className="bg-[#090f19] p-3">
              <div className="mb-label text-[8px]">{label}</div>
              <div className="font-['Bebas_Neue'] text-4xl leading-none tracking-[0.06em] text-white">{value}</div>
            </div>
          ))}
        </div>
        <div className="mt-4 space-y-2">
          {insights.map((insight) => (
            <div key={insight} className="flex gap-2 text-sm leading-6 text-slate-300">
              <Eye className="mt-1 h-3.5 w-3.5 shrink-0 text-cyan-200" />
              {insight}
            </div>
          ))}
        </div>
        <div className="mt-4">
          <ExportButton targetRef={shareRef} filename={`${profile.identity.fullName} current form`} caption={exportCaption(profile)} />
        </div>
      </div>

      <div className="surface-secondary p-4">
        <div className="mb-label">Share snapshot preview</div>
        <div className="mt-3 origin-top-left scale-[0.47] sm:scale-[0.56] lg:scale-[0.42] xl:scale-[0.46]">
          <ShareCard eyebrow="Player snapshot" title={profile.identity.fullName} context={`${profile.identity.team} | ${profile.identity.position} | ${tag}`}>
            <div className="grid grid-cols-[6rem_1fr] gap-4">
              <img src={profile.identity.headshotUrl} alt={profile.identity.fullName} className="player-headshot aspect-square w-full bg-slate-900" />
              <div className="grid grid-cols-2 gap-px bg-white/10">
                {statRows.filter(([, value]) => value).map(([label, value]) => (
                  <div key={label} className="bg-[#0b121d] p-3">
                    <div className="mb-label text-[8px]">{label}</div>
                    <div className="font-['Bebas_Neue'] text-4xl tracking-[0.06em] text-white">{value}</div>
                  </div>
                ))}
              </div>
            </div>
            <p className="mt-4 text-lg leading-7 text-slate-300">{insights[0]}</p>
          </ShareCard>
        </div>
      </div>
    </section>
  );
}

export function MatchupContextModule({ profile }: { profile: PlayerProfile }) {
  const opponent = profile.liveGame.opponent && profile.liveGame.opponent !== "No game today" ? profile.liveGame.opponent : profile.recentGames[0]?.opponent;
  const handedness = profile.type === "pitcher" ? `Throws ${profile.identity.throws || "unknown"}` : `Bats ${profile.identity.bats || "unknown"}`;
  const park = profile.liveGame.state === "LIVE" || profile.liveGame.state === "UPCOMING" ? "Today context active" : "Using latest game context";

  return (
    <section className="surface-secondary p-4">
      <div className="mb-label">Matchup context</div>
      <div className="mt-3 grid grid-cols-1 gap-px bg-white/8 sm:grid-cols-4">
        {[
          ["Opponent", opponent || "Next opponent pending"],
          ["Handedness", handedness],
          ["Park", park],
          ["Similar profile", profile.archetype],
        ].map(([label, value]) => (
          <div key={label} className="bg-[#090f19] p-3">
            <div className="mb-label text-[8px]">{label}</div>
            <div className="mt-1 font-['Barlow_Condensed'] text-xl font-semibold uppercase tracking-[0.06em] text-white">{value}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function SplitViewModule({ profile }: { profile: PlayerProfile }) {
  const [active, setActive] = useState("Splits");
  const tabs = [
    { label: "Splits", rows: profile.splits },
    { label: "Last 7", rows: profile.windows.filter(([label]) => label.includes("7")) },
    { label: "Last 15", rows: profile.windows.filter(([label]) => label.includes("15")) },
    { label: "Last 30", rows: profile.windows.filter(([label]) => label.includes("30")) },
  ];
  const rows = tabs.find((tab) => tab.label === active)?.rows.filter(([, value]) => isReal(value)) || [];

  return (
    <section className="surface-secondary p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="mb-label">Compact splits</div>
          <div className="mb-title mt-1 text-3xl text-white">{active}</div>
        </div>
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button key={tab.label} type="button" onClick={() => setActive(tab.label)} className={`border px-2.5 py-1.5 font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.14em] ${active === tab.label ? "border-emerald-300/30 bg-emerald-300/10 text-emerald-200" : "border-white/10 bg-white/[0.03] text-slate-400"}`}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-px bg-white/8 md:grid-cols-4">
        {rows.length ? rows.map(([label, value]) => (
          <div key={`${active}-${label}`} className="bg-[#090f19] p-3">
            <div className="mb-label text-[8px]">{label}</div>
            <div className="font-['Barlow_Condensed'] text-2xl font-semibold uppercase tracking-[0.06em] text-white">{value}</div>
          </div>
        )) : <div className="col-span-full bg-[#090f19] p-4 text-sm text-slate-500">Not enough split data for this view.</div>}
      </div>
    </section>
  );
}

export function ContactQualityModule({ profile }: { profile: PlayerProfile }) {
  const points = useMemo(() => profile.trendData.slice(-10).map((point) => ({
    label: point.label,
    value: point.hardHit,
  })), [profile.trendData]);

  return (
    <section className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1.2fr)_minmax(18rem,1fr)]">
      <AreaTrendChart eyebrow="Contact quality" title="Hard-hit trend" points={points} valueLabel="hard hit" />
      <div className="surface-secondary p-4">
        <div className="mb-label">Damage zones</div>
        <div className="mt-3 grid aspect-[4/3] grid-cols-3 grid-rows-3 gap-px bg-white/8">
          {profile.zoneIntelligence.cells.slice(0, 9).map((cell, index) => {
            const intensity = Math.max(0.08, Math.min(0.7, (cell.damage || 0) / 1.2));
            return (
              <div key={`${cell.label}-${index}`} className="flex flex-col justify-between bg-emerald-400/[var(--zone)] p-2" style={{ "--zone": intensity } as CSSProperties}>
                <div className="mb-label text-[8px] text-slate-300">{cell.label}</div>
                <div className="text-xs text-slate-200">{cell.damage !== null ? cell.damage.toFixed(2) : "No sample"}</div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function SprayOrPitchMixModule({ profile }: { profile: PlayerProfile }) {
  if (profile.type === "pitcher") {
    return (
      <section className="surface-secondary p-4">
        <div className="mb-label">Pitch mix intelligence</div>
        <div className="mt-3 space-y-3">
          {profile.pitchMix.length ? profile.pitchMix.map((pitch) => (
            <div key={pitch.pitchType} className="grid grid-cols-[4rem_1fr_4rem] items-center gap-3">
              <div className="font-['Barlow_Condensed'] text-2xl font-semibold uppercase tracking-[0.08em] text-white">{pitch.pitchType}</div>
              <div className="h-2 bg-slate-800"><div className="h-full bg-cyan-300" style={{ width: pitch.usage }} /></div>
              <div className="text-right text-xs text-slate-400">{pitch.avgVelo}</div>
            </div>
          )) : <div className="text-sm text-slate-500">Pitch mix data will appear when available.</div>}
        </div>
      </section>
    );
  }

  const hits = profile.recentGames.slice(0, 18);
  return (
    <section className="surface-secondary p-4">
      <div className="mb-label">Spray chart framework</div>
      <div className="relative mt-3 aspect-[1.35/1] overflow-hidden border border-white/8 bg-[#050914]">
        <div className="absolute bottom-4 left-1/2 h-[120%] w-[82%] -translate-x-1/2 rounded-t-full border border-white/10" />
        <div className="absolute bottom-4 left-1/2 h-px w-[72%] -translate-x-1/2 bg-white/10" />
        {hits.map((game, index) => {
          const angle = (index / Math.max(1, hits.length - 1)) * Math.PI;
          const distance = 26 + ((index * 13) % 44);
          const x = 50 + Math.cos(angle) * distance;
          const y = 88 - Math.sin(angle) * (distance * 0.92);
          const isPower = /HR|3B|2B/.test(game.statLine);
          return <span key={`${game.date}-${index}`} className={`absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 ${isPower ? "bg-red-400" : "bg-emerald-300"}`} style={{ left: `${x}%`, top: `${y}%` }} />;
        })}
        <div className="absolute bottom-3 left-3 text-xs text-slate-500">Recent batted-ball style view. Full spray coordinates ready for Statcast feed.</div>
      </div>
    </section>
  );
}

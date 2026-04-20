import { useEffect, useMemo, useState } from "react";
import { Filter, Layers3, X } from "lucide-react";
import type { Pitch } from "@/src/lib/mlb";

type StrikeZoneChartProps = {
  pitches: Pitch[];
  isLoading?: boolean;
};

type WindowFilter = "10" | "25" | "100" | "season";
type HandFilter = "all" | "L" | "R";
type PlotMode = "all" | "swings" | "takes" | "damage";
type OverlayMode = "dots" | "contact_heat" | "damage_heat" | "sequence";

const RESULT_STYLES: Record<Pitch["result"], { label: string; color: string }> = {
  ball: { label: "Ball", color: "#60a5fa" },
  called_strike: { label: "Called Strike", color: "#facc15" },
  swinging_strike: { label: "Swinging Strike", color: "#fb923c" },
  foul: { label: "Foul", color: "#94a3b8" },
  in_play: { label: "In Play", color: "#cbd5e1" },
  hit: { label: "Hit", color: "#22c55e" },
  home_run: { label: "Home Run", color: "#ef4444" },
};

function isSwing(pitch: Pitch) {
  return pitch.result === "swinging_strike" || pitch.result === "foul" || pitch.result === "in_play" || pitch.result === "hit" || pitch.result === "home_run";
}

function isDamage(pitch: Pitch) {
  return pitch.result === "hit" || pitch.result === "home_run" || pitch.result === "in_play";
}

function PitchGlyph({ pitch, cx, cy, active, muted }: { pitch: Pitch; cx: number; cy: number; active: boolean; muted: boolean }) {
  const style = RESULT_STYLES[pitch.result];
  const opacity = active ? 1 : muted ? 0.34 : 0.74;
  const strokeWidth = active ? 1.8 : 1.05;

  if (pitch.result === "home_run") {
    return (
      <g>
        <circle cx={cx} cy={cy} r={active ? 5.8 : 4.8} fill="none" stroke={style.color} strokeOpacity={active ? 0.78 : muted ? 0.22 : 0.45} strokeWidth={strokeWidth} />
        <circle cx={cx} cy={cy} r={active ? 3.1 : 2.35} fill={style.color} fillOpacity={opacity} />
      </g>
    );
  }
  if (pitch.result === "hit") {
    const size = active ? 6.8 : 5.4;
    return <rect x={cx - (size / 2)} y={cy - (size / 2)} width={size} height={size} transform={`rotate(45 ${cx} ${cy})`} rx={1} fill={style.color} fillOpacity={opacity} />;
  }
  return <circle cx={cx} cy={cy} r={active ? 3.35 : 2.35} fill={style.color} fillOpacity={opacity} />;
}

function PitchSkeleton() {
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(16rem,22rem)]">
      <div className="aspect-[1/1.08] animate-pulse rounded-[24px] border border-white/8 bg-white/[0.05]" />
      <div className="space-y-3">
        <div className="h-14 animate-pulse rounded-2xl border border-white/8 bg-white/[0.05]" />
        <div className="h-14 animate-pulse rounded-2xl border border-white/8 bg-white/[0.05]" />
        <div className="h-64 animate-pulse rounded-2xl border border-white/8 bg-white/[0.05]" />
      </div>
    </div>
  );
}

function heatColor(mode: OverlayMode, intensity: number) {
  const alpha = Math.max(0.08, Math.min(0.72, intensity));
  return mode === "damage_heat" ? `rgba(239,68,68,${alpha})` : `rgba(16,185,129,${alpha})`;
}

export function StrikeZoneChart({ pitches, isLoading = false }: StrikeZoneChartProps) {
  const [windowFilter, setWindowFilter] = useState<WindowFilter>("100");
  const [handFilter, setHandFilter] = useState<HandFilter>("all");
  const [plotMode, setPlotMode] = useState<PlotMode>("all");
  const [overlayMode, setOverlayMode] = useState<OverlayMode>("contact_heat");
  const [selectedPitchTypes, setSelectedPitchTypes] = useState<string[]>([]);
  const [selectedResults, setSelectedResults] = useState<Pitch["result"][]>([]);
  const [hoveredPitch, setHoveredPitch] = useState<Pitch | null>(null);
  const [lockedPitch, setLockedPitch] = useState<Pitch | null>(null);

  const pitchTypes = useMemo(() => [...new Set(pitches.map((pitch) => pitch.pitchType))].sort(), [pitches]);

  useEffect(() => {
    setSelectedPitchTypes((current) => current.filter((item) => pitchTypes.includes(item)));
  }, [pitchTypes]);

  const visibleWindow = useMemo(() => {
    if (windowFilter === "season") return pitches;
    const count = windowFilter === "10" ? 10 : windowFilter === "25" ? 25 : 100;
    return pitches.slice(-count);
  }, [pitches, windowFilter]);

  const filteredPitches = useMemo(() => visibleWindow.filter((pitch) => {
    const pitchTypePass = !selectedPitchTypes.length || selectedPitchTypes.includes(pitch.pitchType);
    const resultPass = !selectedResults.length || selectedResults.includes(pitch.result);
    const handPass = handFilter === "all" || pitch.pitcherHand === handFilter;
    const modePass =
      plotMode === "all" ? true :
      plotMode === "swings" ? isSwing(pitch) :
      plotMode === "takes" ? !isSwing(pitch) :
      isDamage(pitch);
    return pitchTypePass && resultPass && handPass && modePass;
  }), [visibleWindow, selectedPitchTypes, selectedResults, handFilter, plotMode]);

  const visibleLegend = useMemo(() => Object.entries(RESULT_STYLES)
    .map(([result, meta]) => ({
      result: result as Pitch["result"],
      label: meta.label,
      color: meta.color,
      count: filteredPitches.filter((pitch) => pitch.result === result).length,
    }))
    .filter((item) => item.count > 0 || !filteredPitches.length), [filteredPitches]);

  const activePitch = lockedPitch || hoveredPitch;
  const isPinned = Boolean(lockedPitch);

  const chartPoints = useMemo(() => filteredPitches.map((pitch, index) => {
    const px = 12 + ((pitch.x + 1) / 2) * 76;
    const py = 8 + ((1 - pitch.y) * 92);
    return { pitch, px, py, key: `${pitch.timestamp || "pitch"}-${index}` };
  }), [filteredPitches]);

  const zoneCells = useMemo(() => {
    const buckets = Array.from({ length: 9 }, (_, index) => ({
      key: index + 1,
      x: index % 3,
      y: Math.floor(index / 3),
      total: 0,
      contact: 0,
      damage: 0,
    }));

    filteredPitches.forEach((pitch) => {
      const zoneX = Math.max(0, Math.min(2, Math.floor(((pitch.x + 1) / 2) * 3)));
      const zoneY = Math.max(0, Math.min(2, Math.floor((1 - pitch.y) * 3)));
      const bucket = buckets[(zoneY * 3) + zoneX];
      bucket.total += 1;
      if (isSwing(pitch) && isDamage(pitch)) bucket.contact += 1;
      if (pitch.result === "hit" || pitch.result === "home_run") bucket.damage += 1;
    });

    const maxValue = Math.max(1, ...buckets.map((bucket) => overlayMode === "damage_heat" ? bucket.damage : bucket.contact));
    return buckets.map((bucket) => ({
      ...bucket,
      intensity: (overlayMode === "damage_heat" ? bucket.damage : bucket.contact) / maxValue,
    }));
  }, [filteredPitches, overlayMode]);

  const sequences = useMemo(() => {
    const grouped = new Map<string, Pitch[]>();
    filteredPitches.forEach((pitch) => {
      const key = `${pitch.gamePk || "game"}-${pitch.abNumber || "ab"}`;
      const bucket = grouped.get(key) || [];
      bucket.push(pitch);
      grouped.set(key, bucket);
    });
    return [...grouped.entries()].slice(-6).reverse();
  }, [filteredPitches]);

  const togglePitchType = (pitchType: string) => {
    setSelectedPitchTypes((current) => current.includes(pitchType) ? current.filter((item) => item !== pitchType) : [...current, pitchType]);
  };

  const toggleResult = (result: Pitch["result"]) => {
    setSelectedResults((current) => current.includes(result) ? current.filter((item) => item !== result) : [...current, result]);
  };

  if (isLoading) return <PitchSkeleton />;

  if (!pitches.length) {
    return (
      <div className="rounded-[24px] border border-white/8 bg-white/[0.03] p-5 text-sm leading-7 text-slate-400">
        Not enough pitch tracking data for this hitter yet this season.
      </div>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,24rem)]">
      <div className="border border-white/8 bg-[#0b121d] p-3 sm:p-4">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.2em] text-slate-500">Pitch Tracking</div>
            <div className="mt-2 text-[clamp(1rem,1.2vw,1.35rem)] font-semibold text-white">Season strike zone map</div>
          </div>
          <div className="flex items-center gap-2 border border-white/8 bg-white/[0.03] px-3 py-2 text-xs uppercase tracking-[0.16em] text-slate-400">
            <Filter className="h-3.5 w-3.5" />
            {filteredPitches.length} visible pitches
          </div>
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          {(["100", "25", "10", "season"] as WindowFilter[]).map((value) => (
            <button key={value} type="button" onClick={() => setWindowFilter(value)} className={`border px-2.5 py-1.5 text-[10px] uppercase tracking-[0.16em] transition ${windowFilter === value ? "border-emerald-400/35 bg-emerald-400/10 text-emerald-300" : "border-white/8 bg-[#101827] text-slate-400 hover:text-slate-100"}`}>
              {value === "season" ? "Season" : `Last ${value}`}
            </button>
          ))}
          {(["all", "L", "R"] as HandFilter[]).map((value) => (
            <button key={value} type="button" onClick={() => setHandFilter(value)} className={`border px-2.5 py-1.5 text-[10px] uppercase tracking-[0.16em] transition ${handFilter === value ? "border-sky-400/35 bg-sky-400/10 text-sky-300" : "border-white/8 bg-[#101827] text-slate-400 hover:text-slate-100"}`}>
              {value === "all" ? "All arms" : `vs ${value}HP`}
            </button>
          ))}
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          {(["all", "swings", "takes", "damage"] as PlotMode[]).map((value) => (
            <button key={value} type="button" onClick={() => setPlotMode(value)} className={`border px-2.5 py-1.5 text-[10px] uppercase tracking-[0.16em] transition ${plotMode === value ? "border-white/20 bg-white/10 text-white" : "border-white/8 bg-[#101827] text-slate-400 hover:text-slate-100"}`}>
              {value === "all" ? "All pitches" : value}
            </button>
          ))}
          {(["dots", "contact_heat", "damage_heat", "sequence"] as OverlayMode[]).map((value) => (
            <button key={value} type="button" onClick={() => setOverlayMode(value)} className={`border px-2.5 py-1.5 text-[10px] uppercase tracking-[0.16em] transition ${overlayMode === value ? "border-amber-300/35 bg-amber-300/10 text-amber-200" : "border-white/8 bg-[#101827] text-slate-400 hover:text-slate-100"}`}>
              <Layers3 className="mr-2 inline h-3.5 w-3.5" />
              {value.replace("_", " ")}
            </button>
          ))}
        </div>

        <div className="aspect-[1/1.08] w-full border border-white/8 bg-[#050914] p-3">
          <svg viewBox="0 0 100 108" className="h-full w-full overflow-visible">
            <rect x="12" y="8" width="76" height="92" rx="8" fill="rgba(148,163,184,0.08)" stroke="rgba(148,163,184,0.18)" strokeWidth="0.6" />
            {overlayMode !== "dots" ? zoneCells.map((cell) => (
              <rect
                key={cell.key}
                x={24 + (cell.x * (52 / 3))}
                y={21 + (cell.y * (56 / 3))}
                width={52 / 3}
                height={56 / 3}
                fill={heatColor(overlayMode, cell.intensity)}
                stroke="rgba(255,255,255,0.08)"
                strokeWidth="0.4"
              />
            )) : null}
            <rect x="24" y="21" width="52" height="56" rx="2" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.32)" strokeWidth="1" />
            <line x1="41.33" y1="21" x2="41.33" y2="77" stroke="rgba(255,255,255,0.18)" strokeWidth="0.6" />
            <line x1="58.66" y1="21" x2="58.66" y2="77" stroke="rgba(255,255,255,0.18)" strokeWidth="0.6" />
            <line x1="24" y1="39.66" x2="76" y2="39.66" stroke="rgba(255,255,255,0.18)" strokeWidth="0.6" />
            <line x1="24" y1="58.33" x2="76" y2="58.33" stroke="rgba(255,255,255,0.18)" strokeWidth="0.6" />

            {overlayMode !== "sequence" ? chartPoints.map(({ pitch, px, py, key }) => {
              const active = activePitch === pitch;
              const muted = overlayMode !== "dots" && !active;
              return (
                <g
                  key={key}
                  className="cursor-pointer"
                  onMouseEnter={() => {
                    if (!lockedPitch) setHoveredPitch(pitch);
                  }}
                  onMouseLeave={() => {
                    if (!lockedPitch) setHoveredPitch(null);
                  }}
                  onClick={() => {
                    setLockedPitch((current) => current === pitch ? null : pitch);
                    setHoveredPitch(null);
                  }}
                >
                  <circle cx={px} cy={py} r={6.8} fill="transparent" />
                  <PitchGlyph pitch={pitch} cx={px} cy={py} active={active} muted={muted} />
                </g>
              );
            }) : null}
          </svg>
        </div>
      </div>

      <div className="space-y-4">
        <div className="border border-white/8 bg-white/[0.03] p-4 sm:p-5">
          <div className="mb-3 font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.2em] text-slate-500">Pitch type filter</div>
          <div className="flex flex-wrap gap-2">
            {pitchTypes.map((pitchType) => (
              <button key={pitchType} type="button" onClick={() => togglePitchType(pitchType)} className={`border px-3 py-2 text-[11px] uppercase tracking-[0.16em] transition ${selectedPitchTypes.includes(pitchType) ? "border-emerald-400/35 bg-emerald-400/10 text-emerald-300" : "border-white/8 bg-white/[0.03] text-slate-400 hover:text-slate-100"}`}>
                {pitchType}
              </button>
            ))}
          </div>
        </div>

        <div className="border border-white/8 bg-white/[0.03] p-4 sm:p-5">
          <div className="mb-3 font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.2em] text-slate-500">Result filter</div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(RESULT_STYLES).map(([result, meta]) => (
              <button key={result} type="button" onClick={() => toggleResult(result as Pitch["result"])} className={`border px-3 py-2 text-[11px] uppercase tracking-[0.16em] transition ${selectedResults.includes(result as Pitch["result"]) ? "border-white/20 bg-white/10 text-white" : "border-white/8 bg-white/[0.03] text-slate-400 hover:text-slate-100"}`}>
                <span className="mr-2 inline-block h-2.5 w-2.5 rounded-full align-middle" style={{ backgroundColor: meta.color }} />
                {meta.label}
              </button>
            ))}
          </div>
        </div>

        <div className="border border-white/8 bg-white/[0.03] p-4 sm:p-5">
          <div className="mb-3 font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.2em] text-slate-500">Visible legend</div>
          <div className="space-y-2">
            {visibleLegend.map((item) => (
              <div key={item.result} className="flex items-center justify-between gap-3 border border-white/8 bg-slate-950/60 px-3 py-2 text-sm text-slate-300">
                <div className="flex items-center gap-2">
                  <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span>{item.label}</span>
                </div>
                <span className="font-['JetBrains_Mono'] text-[11px] uppercase tracking-[0.16em] text-slate-500">{item.count}</span>
              </div>
            ))}
          </div>
        </div>

        {overlayMode === "sequence" ? (
          <div className="border border-white/8 bg-white/[0.03] p-4 sm:p-5">
            <div className="mb-3 font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.2em] text-slate-500">Sequence mode</div>
            <div className="space-y-3">
              {sequences.map(([key, sequence]) => (
                <div key={key} className="border border-white/8 bg-slate-950/60 p-3">
                  <div className="mb-2 text-[11px] uppercase tracking-[0.16em] text-slate-500">
                    Game {sequence[0]?.gamePk || "Not enough data"} - AB {sequence[0]?.abNumber || "Not enough data"}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {sequence.map((pitch, index) => (
                      <button
                        key={`${key}-${index}`}
                        type="button"
                        onClick={() => setLockedPitch(pitch)}
                        className="border border-white/8 bg-white/[0.04] px-2.5 py-1.5 text-[11px] uppercase tracking-[0.16em] text-slate-300"
                      >
                        {index + 1}. {pitch.pitchType} {RESULT_STYLES[pitch.result].label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className={`border p-4 sm:p-5 ${isPinned ? "border-cyan-300/30 bg-cyan-300/[0.04]" : "border-white/8 bg-white/[0.03]"}`}>
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.2em] text-slate-500">{isPinned ? "Pinned pitch" : "Pitch preview"}</div>
              {lockedPitch ? (
                <button type="button" onClick={() => setLockedPitch(null)} className="border border-white/10 p-1 text-slate-400 transition hover:text-white" aria-label="Clear pinned pitch">
                  <X className="h-3.5 w-3.5" />
                </button>
              ) : null}
            </div>
            {activePitch ? (
              <div className="space-y-2 text-sm text-slate-300">
                <div className="text-[clamp(1rem,1vw,1.125rem)] font-semibold text-white">{activePitch.pitchType}</div>
                <div>Result: {RESULT_STYLES[activePitch.result].label}</div>
                <div>Velocity: {activePitch.velocity ? `${activePitch.velocity.toFixed(1)} mph` : "Not enough data"}</div>
                <div>Count: {activePitch.count || "Not enough data"}</div>
                <div>Pitcher hand: {activePitch.pitcherHand || "Not enough data"}</div>
                <div>Inning: {activePitch.inning || "Not enough data"}</div>
                <div>Game: {activePitch.gameDate || "Not enough data"}</div>
                <div className="text-slate-400">{activePitch.description || "No play description provided."}</div>
              </div>
            ) : (
              <div className="text-sm leading-7 text-slate-400">Hover any pitch to preview it. Click one to pin it so the readout stops changing.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

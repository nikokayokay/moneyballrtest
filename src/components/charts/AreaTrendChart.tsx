import { useMemo, useState } from "react";

export type AreaTrendPoint = {
  label: string;
  value: number | null;
  secondary?: number | null;
};

type AreaTrendChartProps = {
  title: string;
  eyebrow?: string;
  points: AreaTrendPoint[];
  valueLabel?: string;
  className?: string;
};

function fmt(value: number | null | undefined) {
  if (!Number.isFinite(value)) return "Not enough data";
  const numeric = Number(value);
  return numeric < 1 ? numeric.toFixed(3).replace(/^0/, "") : numeric.toFixed(1);
}

export function AreaTrendChart({ title, eyebrow = "Trend", points, valueLabel = "value", className = "" }: AreaTrendChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const usable = points.filter((point) => Number.isFinite(point.value));
  const chart = useMemo(() => {
    if (!usable.length) return null;
    const max = Math.max(...usable.map((point) => point.value || 0), 0.45);
    const min = Math.min(...usable.map((point) => point.value || 0), 0.18);
    const range = Math.max(0.01, max - min);
    const line = usable.map((point, index) => {
      const x = (index / Math.max(1, usable.length - 1)) * 100;
      const y = 82 - (((point.value || min) - min) / range) * 68;
      return { ...point, x, y };
    });
    const area = `0,88 ${line.map((point) => `${point.x},${point.y}`).join(" ")} 100,88`;
    return { line, area };
  }, [usable]);

  if (!chart) {
    return (
      <section className={`surface-secondary p-4 ${className}`}>
        <div className="mb-label">{eyebrow}</div>
        <div className="mb-title mt-2 text-[clamp(1.8rem,2.5vw,2.6rem)] text-white">{title}</div>
        <div className="mt-6 text-sm text-slate-500">Not enough data to draw this trend yet.</div>
      </section>
    );
  }

  const active = activeIndex !== null ? chart.line[activeIndex] : chart.line[chart.line.length - 1];

  return (
    <section className={`surface-secondary p-4 ${className}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="mb-label">{eyebrow}</div>
          <div className="mb-title mt-2 text-[clamp(1.8rem,2.5vw,2.6rem)] text-white">{title}</div>
        </div>
        <div className="text-right">
          <div className="font-['Bebas_Neue'] text-4xl leading-none tracking-[0.06em] text-emerald-300">{fmt(active?.value)}</div>
          <div className="mt-1 font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.14em] text-slate-500">{active?.label} {valueLabel}</div>
        </div>
      </div>

      <div className="relative mt-4">
        <svg viewBox="0 0 100 92" className="h-44 w-full overflow-visible" preserveAspectRatio="none">
          {[18, 36, 54, 72].map((y) => (
            <line key={y} x1="0" y1={y} x2="100" y2={y} stroke="rgba(255,255,255,.07)" strokeDasharray="1.5 3" />
          ))}
          <polygon points={chart.area} fill="url(#mb-area-fill)" opacity="0.82" />
          <polyline
            points={chart.line.map((point) => `${point.x},${point.y}`).join(" ")}
            fill="none"
            stroke="#34d399"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
          {chart.line.map((point, index) => (
            <circle
              key={`${point.label}-${index}`}
              cx={point.x}
              cy={point.y}
              r={activeIndex === index ? 2.3 : 1.45}
              fill={activeIndex === index ? "#67e8f9" : "#34d399"}
              onMouseEnter={() => setActiveIndex(index)}
              onMouseLeave={() => setActiveIndex(null)}
              className="cursor-pointer transition"
            />
          ))}
          <defs>
            <linearGradient id="mb-area-fill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#34d399" stopOpacity="0.34" />
              <stop offset="55%" stopColor="#0e7490" stopOpacity="0.13" />
              <stop offset="100%" stopColor="#020617" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </section>
  );
}

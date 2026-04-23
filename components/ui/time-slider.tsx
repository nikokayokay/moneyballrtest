"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import type { TimeWindow } from "@/lib/temporal-data";

const windows: Array<{ value: TimeWindow; label: string; helper: string }> = [
  { value: "last7", label: "Last 7", helper: "recent signal" },
  { value: "last30", label: "Last 30", helper: "trend shape" },
  { value: "season", label: "Season", helper: "full baseline" },
];

export function TimeSlider({
  value,
  onValueChange,
  className,
}: {
  value: TimeWindow;
  onValueChange: (value: TimeWindow) => void;
  className?: string;
}) {
  return (
    <div className={cn("rounded-2xl border border-white/10 bg-white/[0.03] p-2", className)}>
      <div className="grid grid-cols-3 gap-2">
        {windows.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => onValueChange(item.value)}
            className={cn(
              "rounded-xl border px-3 py-2 text-left transition",
              value === item.value
                ? "border-emerald-300/35 bg-emerald-300/10 text-emerald-100"
                : "border-white/8 bg-[#07101b] text-slate-400 hover:border-cyan-300/25 hover:text-white",
            )}
          >
            <div className="font-['Barlow_Condensed'] text-xl font-semibold uppercase tracking-[0.08em]">{item.label}</div>
            <div className="font-['JetBrains_Mono'] text-[9px] uppercase tracking-[0.14em] opacity-70">{item.helper}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

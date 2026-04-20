import type { ReactNode } from "react";

type InsightTagProps = {
  tone?: "positive" | "negative" | "warning" | "live" | "neutral";
  children: ReactNode;
};

export function InsightTag({ tone = "neutral", children }: InsightTagProps) {
  const toneClass = {
    positive: "border-emerald-400/25 bg-emerald-400/10 text-emerald-300",
    negative: "border-red-400/25 bg-red-400/10 text-red-300",
    warning: "border-yellow-300/25 bg-yellow-300/10 text-yellow-200",
    live: "border-cyan-300/25 bg-cyan-300/10 text-cyan-200",
    neutral: "border-slate-500/30 bg-slate-800/50 text-slate-300",
  }[tone];

  return (
    <span className={`inline-flex items-center border px-2.5 py-1 font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.16em] ${toneClass}`}>
      {children}
    </span>
  );
}

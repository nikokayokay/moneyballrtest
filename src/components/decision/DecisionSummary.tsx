type DecisionSummaryProps = {
  label: string;
  value: string;
  detail: string;
  tone?: "emerald" | "rose" | "amber" | "slate" | "sky";
};

export function DecisionSummary({ label, value, detail, tone = "slate" }: DecisionSummaryProps) {
  const toneClass = tone === "emerald"
    ? "border-emerald-400/15 bg-emerald-400/8"
    : tone === "rose"
      ? "border-rose-400/15 bg-rose-400/8"
      : tone === "amber"
        ? "border-amber-300/15 bg-amber-300/8"
        : tone === "sky"
          ? "border-sky-400/15 bg-sky-400/8"
          : "border-white/8 bg-white/[0.03]";

  return (
    <div className={`rounded-[24px] border p-4 ${toneClass}`}>
      <div className="font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.18em] text-slate-500">{label}</div>
      <div className="mt-2 text-[clamp(1.4rem,2.2vw,2.2rem)] font-['Bebas_Neue'] tracking-[0.08em] text-white">{value}</div>
      <div className="mt-2 text-sm leading-7 text-slate-300">{detail}</div>
    </div>
  );
}

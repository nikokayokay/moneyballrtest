type StatStripItem = {
  label: string;
  value: string;
  delta?: string;
  tone?: "positive" | "negative" | "warning" | "neutral";
};

type StatStripRowProps = {
  items: StatStripItem[];
};

export function StatStripRow({ items }: StatStripRowProps) {
  if (!items.length) return null;

  const toneClass = {
    positive: "text-emerald-300",
    negative: "text-red-300",
    warning: "text-yellow-200",
    neutral: "text-slate-500",
  };

  return (
    <section className="border-y border-white/8 bg-[#090f19]">
      <div className="grid grid-cols-2 divide-x divide-y divide-white/8 sm:grid-cols-4 lg:grid-cols-8 lg:divide-y-0">
        {items.map((item) => (
          <div key={item.label} className="min-w-0 px-3 py-2.5">
            <div className="font-['JetBrains_Mono'] text-[9px] uppercase tracking-[0.16em] text-slate-500">{item.label}</div>
            <div className="mt-1 flex items-baseline gap-2">
              <div className="font-['Bebas_Neue'] text-[clamp(1.55rem,2.1vw,2.1rem)] leading-none tracking-[0.06em] text-white">{item.value}</div>
              {item.delta ? <div className={`truncate text-[11px] ${toneClass[item.tone || "neutral"]}`}>{item.delta}</div> : null}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

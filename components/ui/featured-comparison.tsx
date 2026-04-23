import { Link } from "react-router-dom";
import { featuredProspectComparison } from "@/src/data/home-discovery";

function barWidth(value: number, max: number) {
  return `${Math.max(8, (value / Math.max(max, 1)) * 100)}%`;
}

export function FeaturedComparison() {
  const { left, right } = featuredProspectComparison();
  const rows = [
    ["Dev Score", left.developmentScore, right.developmentScore],
    ["Adj OPS", Math.round((left.adjusted.ops || 0) * 1000), Math.round((right.adjusted.ops || 0) * 1000)],
    ["Age", left.age, right.age],
  ];

  return (
    <section className="rounded-[2rem] border border-white/10 bg-[#070d16] p-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.18em] text-cyan-200">Featured insight</div>
          <h2 className="mt-2 font-['Bebas_Neue'] text-4xl leading-none tracking-[0.06em] text-white">
            {left.name} vs {right.name}
          </h2>
          <p className="mt-2 text-sm text-slate-400">Prospect value comparison: projection upside against proximity and plate-discipline stability.</p>
        </div>
        <Link to="/minor-leagues/compare" className="rounded-full border border-emerald-300/25 bg-emerald-300/10 px-3 py-2 font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.16em] text-emerald-200">
          Open compare
        </Link>
      </div>
      <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-[1fr_1.618fr_1fr]">
        {[left, right].map((prospect) => (
          <Link key={prospect.id} to={`/minor-leagues/players/${prospect.id}`} className="rounded-2xl border border-white/8 bg-white/[0.025] p-4">
            <div className="font-['Barlow_Condensed'] text-2xl font-semibold uppercase tracking-[0.08em] text-white">{prospect.name}</div>
            <div className="mt-1 font-['JetBrains_Mono'] text-[9px] uppercase tracking-[0.14em] text-slate-500">{prospect.orgAbbr} · {prospect.level} · ETA {prospect.eta}</div>
            <div className="mt-4 font-['Bebas_Neue'] text-5xl leading-none text-emerald-300">{prospect.developmentScore}</div>
          </Link>
        ))}
        <div className="space-y-4 rounded-2xl border border-white/8 bg-black/20 p-4 lg:order-none">
          {rows.map(([label, leftValue, rightValue]) => {
            const max = Math.max(Number(leftValue), Number(rightValue), 1);
            return (
              <div key={label.toString()}>
                <div className="mb-2 flex items-center justify-between font-['JetBrains_Mono'] text-[9px] uppercase tracking-[0.14em] text-slate-500">
                  <span>{label}</span>
                  <span>{leftValue} / {rightValue}</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="h-2 overflow-hidden rounded-full bg-white/8"><div className="h-full rounded-full bg-cyan-300" style={{ width: barWidth(Number(leftValue), max) }} /></div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/8"><div className="h-full rounded-full bg-emerald-300" style={{ width: barWidth(Number(rightValue), max) }} /></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

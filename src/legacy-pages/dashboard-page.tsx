import { Link } from "react-router-dom";
import { PlayerSearch } from "@/src/components/player-search";

const compareExamples = [
  { label: "Aaron Judge", id: 592450, note: "Complete hitter page with live advanced metrics and every season game." },
  { label: "Sal Stewart", id: 701398, note: "Partial-sample hitter page with complete logs and clear sample labels." },
  { label: "Konnor Griffin", id: 804606, note: "Limited-data page that still renders in the same premium layout." },
];

export function DashboardPage() {
  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <section className="rounded-[32px] border border-white/8 bg-slate-950/70 p-8 shadow-[0_24px_70px_rgba(0,0,0,0.45)]">
        <div className="font-['JetBrains_Mono'] text-[11px] uppercase tracking-[0.28em] text-emerald-400">Dashboard</div>
        <h1 className="mt-4 font-['Bebas_Neue'] text-6xl tracking-[0.08em] text-white md:text-8xl">Search and jump into any live profile</h1>
        <p className="mt-4 max-w-4xl text-lg leading-8 text-slate-400">This dashboard now serves as a fast player launcher backed by the same live profile system.</p>
        <div className="mt-8 max-w-3xl">
          <PlayerSearch autoFocus />
        </div>
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-3">
        {compareExamples.map((player) => (
          <Link key={player.id} to={`/player/${player.id}`} className="rounded-[28px] border border-white/8 bg-slate-950/70 p-6 transition hover:-translate-y-1 hover:border-emerald-400/20">
            <div className="font-['Bebas_Neue'] text-4xl tracking-[0.08em] text-white">{player.label}</div>
            <p className="mt-4 text-sm leading-7 text-slate-400">{player.note}</p>
            <div className="mt-5 font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.18em] text-emerald-300">Open Profile</div>
          </Link>
        ))}
      </section>
    </main>
  );
}

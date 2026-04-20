import { Link } from "react-router-dom";
import { PlayerSearch } from "@/src/components/player-search";

const featured = [
  { id: 592450, name: "Aaron Judge", team: "NYY", note: "Power benchmark", copy: "Star-level hitter page with full season logs, advanced metrics, and live status." },
  { id: 701398, name: "Sal Stewart", team: "CIN", note: "Rising bat", copy: "Partial-sample page with the same premium layout, explicit sample labels, and complete game logs." },
  { id: 804606, name: "Konnor Griffin", team: "PIT", note: "Future heat", copy: "Limited-data page that still looks complete, stays live, and handles missing MLB data safely." },
];

export function HomePage() {
  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <section className="panel-glow overflow-hidden rounded-[36px] border border-white/8 bg-slate-950/75 p-8 shadow-[0_30px_90px_rgba(0,0,0,0.55)] md:p-10">
        <div className="grid gap-10 xl:grid-cols-[1.2fr_0.8fr] xl:items-end">
          <div>
            <div className="font-['JetBrains_Mono'] text-[11px] uppercase tracking-[0.28em] text-emerald-400">Live MLB Player Hub</div>
            <h1 className="headline-shadow mt-4 max-w-5xl font-['Bebas_Neue'] text-6xl leading-[0.9] tracking-[0.08em] text-white md:text-8xl">Fast player search, full season logs, and premium live profiles for every MLB player.</h1>
            <p className="mt-6 max-w-4xl text-lg leading-8 text-slate-300">The rebuilt player system is now one unified hub: instant search, ID-safe routing, complete season game logs, and a cleaner signal on stars, call-ups, and prospects without sacrificing style.</p>
            <div className="mt-8 max-w-3xl">
              <PlayerSearch />
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/players" className="rounded-full border border-emerald-400 bg-emerald-400 px-5 py-3 font-['Barlow_Condensed'] text-sm font-semibold uppercase tracking-[0.18em] text-black transition hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(0,230,118,0.35)]">Browse Players</Link>
              <Link to="/dashboard" className="rounded-full border border-white/12 bg-white/5 px-5 py-3 font-['Barlow_Condensed'] text-sm font-semibold uppercase tracking-[0.18em] text-slate-100 transition hover:-translate-y-0.5 hover:border-white/20">Open Dashboard</Link>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-1">
            {[
              ["Live Search", "Instant player previews with headshots, team, and position."],
              ["Full Season Logs", "Every MLB game this season remains accessible on the profile page."],
              ["Shared Profile UI", "Judge, Stewart, Griffin, and everyone else now use one premium structure."],
            ].map(([title, body]) => (
              <div key={title} className="stat-shine rounded-[24px] border border-white/8 p-5 shadow-[0_14px_40px_rgba(0,0,0,0.28)]">
                <div className="font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.2em] text-slate-500">Why It Feels Better</div>
                <div className="mt-3 font-['Bebas_Neue'] text-3xl tracking-[0.08em] text-white">{title}</div>
                <p className="mt-3 text-sm leading-7 text-slate-300">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-3">
        {featured.map((player) => (
          <Link key={player.id} to={`/player/${player.id}`} className="group relative overflow-hidden rounded-[30px] border border-white/8 bg-slate-950/80 p-6 transition hover:-translate-y-1 hover:border-emerald-400/20 hover:shadow-[0_24px_70px_rgba(0,0,0,0.45)]">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-emerald-400/70 via-sky-400/50 to-transparent opacity-70" />
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.22em] text-slate-500">{player.team} • {player.note}</div>
                <div className="mt-3 font-['Bebas_Neue'] text-5xl leading-none tracking-[0.08em] text-white">{player.name}</div>
              </div>
              <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.18em] text-slate-300">Featured</div>
            </div>
            <p className="mt-5 text-sm leading-7 text-slate-300">{player.copy}</p>
            <div className="mt-6 flex items-center justify-between">
              <div className="font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.18em] text-emerald-300">Open Profile</div>
              <div className="font-['Barlow_Condensed'] text-sm uppercase tracking-[0.16em] text-slate-400 transition group-hover:text-white">Live Route</div>
            </div>
          </Link>
        ))}
      </section>
    </main>
  );
}

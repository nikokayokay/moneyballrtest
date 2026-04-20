import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { BarChart3, ChevronDown, Gauge, Search, Shield, Trophy, Users } from "lucide-react";

type MenuItem = {
  label: string;
  href: string;
  description: string;
};

type MenuGroup = {
  label: string;
  icon: typeof Users;
  items: MenuItem[];
};

const groups: MenuGroup[] = [
  {
    label: "Players",
    icon: Users,
    items: [
      { label: "Player Search", href: "/players", description: "Active roster index with live profile routing." },
      { label: "Impact Sphere", href: "/", description: "Today’s top weighted performance signals." },
      { label: "Prospect Watch", href: "/discover", description: "Limited-sample players and rising profiles." },
    ],
  },
  {
    label: "Games",
    icon: Gauge,
    items: [
      { label: "Game Center", href: "/games", description: "Live and recent scoreboards with key performer context." },
      { label: "Today’s Slate", href: "/", description: "Scores, status tags, and performers that matter now." },
      { label: "Game Logs", href: "/discover", description: "Newest-player context and recent form surfaces." },
    ],
  },
  {
    label: "Analytics",
    icon: BarChart3,
    items: [
      { label: "Leaderboards", href: "/leaderboards", description: "Hot hitters, process leaders, rolling trends." },
      { label: "Decision Tools", href: "/dashboard", description: "Search-first entry point for model-driven reads." },
      { label: "Trend Discovery", href: "/discover", description: "Anomalies, streaks, and under-the-radar performers." },
    ],
  },
  {
    label: "Teams",
    icon: Shield,
    items: [
      { label: "Team Overview", href: "/teams", description: "Roster context, team identity, and standings framing." },
      { label: "Top Team Bats", href: "/leaderboards", description: "Team leaders through the same player profile system." },
      { label: "Prospect Systems", href: "/discover", description: "Future impact, sample flags, and scouting watch." },
    ],
  },
];

export function MegaMenu() {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <div className="hidden items-center gap-1 lg:flex">
        {[
          ["/", "Today"],
          ["/players", "Players"],
          ["/teams", "Teams"],
          ["/games", "Games"],
          ["/leaderboards", "Leaders"],
          ["/discover", "Discover"],
        ].map(([href, label]) => (
          <NavLink
            key={href}
            to={href}
            className={({ isActive }) =>
              `px-3 py-2 font-['Barlow_Condensed'] text-sm font-semibold uppercase tracking-[0.16em] transition ${
                isActive ? "text-emerald-300" : "text-slate-400 hover:text-white"
              }`
            }
          >
            {label}
          </NavLink>
        ))}
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="ml-1 inline-flex items-center gap-1 border border-white/8 bg-white/[0.03] px-3 py-2 font-['Barlow_Condensed'] text-sm font-semibold uppercase tracking-[0.16em] text-slate-300 transition hover:border-cyan-300/20 hover:text-white"
        >
          Tools <ChevronDown className={`h-3.5 w-3.5 transition ${open ? "rotate-180" : ""}`} />
        </button>
      </div>

      <div className="flex items-center gap-2 lg:hidden">
        <Link to="/players" className="border border-white/8 px-3 py-2 font-['Barlow_Condensed'] text-sm font-semibold uppercase tracking-[0.16em] text-slate-300">
          <Search className="mr-1 inline h-3.5 w-3.5 text-emerald-300" />
          Search
        </Link>
        <Link to="/dashboard" className="border border-cyan-300/20 bg-cyan-300/10 px-3 py-2 font-['Barlow_Condensed'] text-sm font-semibold uppercase tracking-[0.16em] text-cyan-200">
          Live
        </Link>
      </div>

      {open ? (
        <div
          className="absolute right-0 top-[calc(100%+0.75rem)] z-50 hidden w-[min(52rem,calc(100vw-2rem))] border border-white/10 bg-[#070c14]/98 p-3 shadow-[0_28px_80px_rgba(0,0,0,0.55)] backdrop-blur-xl lg:block"
          onMouseLeave={() => setOpen(false)}
        >
          <div className="grid grid-cols-2 gap-2">
            {groups.map((group) => {
              const Icon = group.icon;
              return (
                <section key={group.label} className="border border-white/6 bg-white/[0.025] p-3">
                  <div className="mb-2 flex items-center gap-2">
                    <Icon className="h-4 w-4 text-cyan-200" />
                    <div className="mb-label">{group.label}</div>
                  </div>
                  <div className="space-y-1">
                    {group.items.map((item) => (
                      <Link
                        key={item.label}
                        to={item.href}
                        onClick={() => setOpen(false)}
                        className="block p-2 transition hover:bg-emerald-300/8"
                      >
                        <div className="font-['Barlow_Condensed'] text-lg font-semibold uppercase tracking-[0.08em] text-white">{item.label}</div>
                        <div className="mt-0.5 text-xs leading-5 text-slate-500">{item.description}</div>
                      </Link>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
          <div className="mt-2 flex items-center justify-between border-t border-white/8 pt-3">
            <div className="mb-label">Moneyballr command layer</div>
            <Link to="/leaderboards" onClick={() => setOpen(false)} className="inline-flex items-center gap-2 font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.16em] text-emerald-300">
              <Trophy className="h-3.5 w-3.5" />
              Open leaderboards
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}

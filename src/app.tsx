import { Link, NavLink, Route, Routes } from "react-router-dom";
import { BarChart3, Search } from "lucide-react";
import { HomePage } from "@/src/pages/home-page";
import { PlayersPage } from "@/src/pages/players-page";
import { PlayerPage } from "@/src/pages/player-page";
import { DashboardPage } from "@/src/pages/dashboard-page";

export default function App() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(0,230,118,0.08),transparent_28%),radial-gradient(circle_at_top_right,rgba(83,166,255,0.08),transparent_34%),#060912] text-slate-100">
      <header className="sticky top-0 z-40 border-b border-white/8 bg-[#060912]/80 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-[min(96rem,100%)] items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <Link to="/" className="font-['Bebas_Neue'] text-[clamp(2rem,3vw,2.75rem)] tracking-[0.16em] text-emerald-400">
            Money<span className="text-slate-100">Ballr</span>
          </Link>
          <nav className="flex flex-wrap items-center justify-end gap-2">
            {[
              ["/", "Home"],
              ["/players", "Players"],
              ["/dashboard", "Dashboard"],
            ].map(([href, label]) => (
              <NavLink
                key={href}
                to={href}
                className={({ isActive }) =>
                  `rounded-full border px-4 py-2 font-['Barlow_Condensed'] text-sm font-semibold uppercase tracking-[0.18em] transition ${
                    isActive
                      ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-300"
                      : "border-transparent text-slate-400 hover:border-white/15 hover:bg-white/5 hover:text-slate-100"
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/players" element={<PlayersPage />} />
        <Route path="/player/:playerId" element={<PlayerPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
      </Routes>

      <footer className="border-t border-white/8 py-6">
        <div className="mx-auto flex w-full max-w-[min(96rem,100%)] flex-wrap items-center justify-between gap-4 px-4 text-sm text-slate-400 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-emerald-400" />
            Live MLB player analytics hub
          </div>
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-sky-400" />
            Search, compare, and profile every active player
          </div>
        </div>
      </footer>
    </div>
  );
}

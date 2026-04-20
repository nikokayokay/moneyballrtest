import { Link, NavLink, Route, Routes, useLocation } from "react-router-dom";
import { BarChart3, Search } from "lucide-react";
import { AppBackground, type AppBackgroundVariant } from "@/src/components/AppBackground";
import { MegaMenu } from "@/src/components/layout/MegaMenu";
import { useLiveClock } from "@/src/hooks/useLiveClock";
import { HomePage } from "@/src/legacy-pages/home-page";
import { PlayersPage } from "@/src/legacy-pages/players-page";
import { PlayerPage } from "@/src/legacy-pages/player-page";
import { DashboardPage } from "@/src/legacy-pages/dashboard-page";
import { TeamsPage } from "@/src/legacy-pages/teams-page";
import { LeaderboardsPage } from "@/src/legacy-pages/leaderboards-page";
import { DiscoverPage } from "@/src/legacy-pages/discover-page";
import { GameCenterPage } from "@/src/legacy-pages/game-center-page";

export default function App() {
  const clock = useLiveClock();
  const location = useLocation();
  const backgroundVariant: AppBackgroundVariant = location.pathname.startsWith("/player")
    ? "player"
    : location.pathname.startsWith("/dashboard")
      ? "live"
      : "home";

  return (
    <div className="relative min-h-screen w-full bg-[#050914] text-slate-100">
      <AppBackground variant={backgroundVariant} />

      <div className="relative z-20 min-h-screen">
        <header className="sticky top-0 z-40 border-b border-white/8 bg-[#060912]/88 backdrop-blur-xl">
          <div className="mx-auto flex w-full max-w-[min(96rem,100%)] items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
            <Link to="/" className="font-['Bebas_Neue'] text-[clamp(2rem,3vw,2.75rem)] tracking-[0.16em] text-emerald-400">
              Money<span className="text-slate-100">Ballr</span>
            </Link>
            <div className="flex flex-wrap items-center justify-end gap-3">
            <div className="hidden items-center gap-2 border border-cyan-300/20 bg-cyan-300/10 px-2.5 py-1.5 font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.16em] text-cyan-200 sm:flex">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-300" />
              {clock.label}
            </div>
            <nav className="hidden flex-wrap items-center justify-end gap-2">
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
            <MegaMenu />
            </div>
          </div>
        </header>

        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/players" element={<PlayersPage />} />
          <Route path="/teams" element={<TeamsPage />} />
          <Route path="/games" element={<GameCenterPage />} />
          <Route path="/leaderboards" element={<LeaderboardsPage />} />
          <Route path="/discover" element={<DiscoverPage />} />
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
    </div>
  );
}

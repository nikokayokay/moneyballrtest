import { Suspense, lazy } from "react";
import { Link, NavLink, Route, Routes, useLocation } from "react-router-dom";
import { BarChart3, Search } from "lucide-react";
import { AppBackground, type AppBackgroundVariant } from "@/src/components/AppBackground";
import { MegaMenu } from "@/src/components/layout/MegaMenu";
import { useLiveClock } from "@/src/hooks/useLiveClock";

const HomePage = lazy(() => import("@/src/legacy-pages/home-page").then((module) => ({ default: module.HomePage })));
const PlayersPage = lazy(() => import("@/src/legacy-pages/players-page").then((module) => ({ default: module.PlayersPage })));
const PlayerPage = lazy(() => import("@/src/legacy-pages/player-page").then((module) => ({ default: module.PlayerPage })));
const TeamsPage = lazy(() => import("@/src/legacy-pages/teams-page").then((module) => ({ default: module.TeamsPage })));
const LeaderboardsPage = lazy(() => import("@/src/legacy-pages/leaderboards-page").then((module) => ({ default: module.LeaderboardsPage })));
const DiscoverPage = lazy(() => import("@/src/legacy-pages/discover-page").then((module) => ({ default: module.DiscoverPage })));
const GameCenterPage = lazy(() => import("@/src/legacy-pages/game-center-page").then((module) => ({ default: module.GameCenterPage })));
const ToolsPage = lazy(() => import("@/src/legacy-pages/tools-page").then((module) => ({ default: module.ToolsPage })));
const IntelligenceLensPage = lazy(() => import("@/src/legacy-pages/intelligence-lens-page").then((module) => ({ default: module.IntelligenceLensPage })));
const ProspectsPage = lazy(() => import("@/src/legacy-pages/prospects-page").then((module) => ({ default: module.ProspectsPage })));
const ProspectPage = lazy(() => import("@/src/legacy-pages/prospect-page").then((module) => ({ default: module.ProspectPage })));
const MinorLeagueLeadersPage = lazy(() => import("@/src/legacy-pages/minor-league-leaders-page").then((module) => ({ default: module.MinorLeagueLeadersPage })));
const MinorLeagueOrganizationsPage = lazy(() => import("@/src/legacy-pages/minor-league-organizations-page").then((module) => ({ default: module.MinorLeagueOrganizationsPage })));
const MinorLeagueOrganizationPage = lazy(() => import("@/src/legacy-pages/minor-league-organization-page").then((module) => ({ default: module.MinorLeagueOrganizationPage })));
const MinorLeagueLevelPage = lazy(() => import("@/src/legacy-pages/minor-league-level-page").then((module) => ({ default: module.MinorLeagueLevelPage })));
const MinorLeagueTransactionsPage = lazy(() => import("@/src/legacy-pages/minor-league-transactions-page").then((module) => ({ default: module.MinorLeagueTransactionsPage })));
const MinorLeagueInternationalPage = lazy(() => import("@/src/legacy-pages/minor-league-international-page").then((module) => ({ default: module.MinorLeagueInternationalPage })));
const MinorLeagueComparePage = lazy(() => import("@/src/legacy-pages/minor-league-compare-page").then((module) => ({ default: module.MinorLeagueComparePage })));
const DataHealthPage = lazy(() => import("@/src/legacy-pages/data-health-page").then((module) => ({ default: module.DataHealthPage })));

function RouteFallback() {
  return (
    <main className="mb-shell py-6">
      <section className="surface-primary p-5">
        <div className="mb-label text-cyan-200">Loading Moneyballr module</div>
        <div className="mt-4 h-20 animate-pulse bg-white/[0.04]" />
        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="h-24 animate-pulse bg-white/[0.035]" />
          <div className="h-24 animate-pulse bg-white/[0.035]" />
          <div className="h-24 animate-pulse bg-white/[0.035]" />
        </div>
      </section>
    </main>
  );
}

export default function App() {
  const clock = useLiveClock();
  const location = useLocation();
  const backgroundVariant: AppBackgroundVariant = location.pathname.startsWith("/player")
    ? "player"
    : location.pathname.startsWith("/dashboard") || location.pathname.startsWith("/live") || location.pathname.startsWith("/games")
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

        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/stats" element={<IntelligenceLensPage lens="stats" />} />
            <Route path="/lineups" element={<IntelligenceLensPage lens="lineups" />} />
            <Route path="/dashboard" element={<IntelligenceLensPage lens="dashboard" />} />
            <Route path="/live" element={<GameCenterPage />} />
            <Route path="/trend-shift" element={<IntelligenceLensPage lens="trend-shift" />} />
            <Route path="/players" element={<PlayersPage />} />
            <Route path="/profiles" element={<IntelligenceLensPage lens="profiles" />} />
            <Route path="/showcase" element={<IntelligenceLensPage lens="showcase" />} />
            <Route path="/teams" element={<TeamsPage />} />
            <Route path="/games" element={<GameCenterPage />} />
            <Route path="/matchup-matrix" element={<IntelligenceLensPage lens="matchup-matrix" />} />
            <Route path="/contact-quality" element={<IntelligenceLensPage lens="contact-quality" />} />
            <Route path="/leaderboards" element={<LeaderboardsPage />} />
            <Route path="/discover" element={<DiscoverPage />} />
            <Route path="/tools" element={<ToolsPage />} />
            <Route path="/draft-prospects" element={<IntelligenceLensPage lens="draft-prospects" />} />
            <Route path="/tier-list" element={<IntelligenceLensPage lens="tier-list" />} />
            <Route path="/last-x-games" element={<IntelligenceLensPage lens="last-x-games" />} />
            <Route path="/pvp" element={<IntelligenceLensPage lens="pvp" />} />
            <Route path="/contracts" element={<IntelligenceLensPage lens="contracts" />} />
            <Route path="/lab" element={<IntelligenceLensPage lens="lab" />} />
            <Route path="/feedback" element={<IntelligenceLensPage lens="feedback" />} />
            <Route path="/prospects" element={<ProspectsPage />} />
            <Route path="/prospect/:prospectId" element={<ProspectPage />} />
            <Route path="/minor-leagues" element={<ProspectsPage />} />
            <Route path="/minor-leagues/top-prospects" element={<ProspectsPage />} />
            <Route path="/minor-leagues/leaders" element={<MinorLeagueLeadersPage />} />
            <Route path="/minor-leagues/organizations" element={<MinorLeagueOrganizationsPage />} />
            <Route path="/minor-leagues/organizations/:team" element={<MinorLeagueOrganizationPage />} />
            <Route path="/minor-leagues/levels/:level" element={<MinorLeagueLevelPage />} />
            <Route path="/minor-leagues/players/:prospectId" element={<ProspectPage />} />
            <Route path="/minor-leagues/transactions" element={<MinorLeagueTransactionsPage />} />
            <Route path="/minor-leagues/international" element={<MinorLeagueInternationalPage />} />
            <Route path="/minor-leagues/compare" element={<MinorLeagueComparePage />} />
            <Route path="/admin/data-health" element={<DataHealthPage />} />
            <Route path="/player/:playerId" element={<PlayerPage />} />
          </Routes>
        </Suspense>

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

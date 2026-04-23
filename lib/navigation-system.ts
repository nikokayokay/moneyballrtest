import { BarChart3, Compass, Gauge, Home, Radio, Search, Shield, Sprout, Swords, Trophy, Users, Wrench } from "lucide-react";

export type PrimaryNavKey =
  | "home"
  | "live"
  | "players"
  | "teams"
  | "games"
  | "leaders"
  | "milb"
  | "discover"
  | "tools";

export type IntelligenceModule = {
  id: string;
  label: string;
  href: string;
  description: string;
  engine: string;
};

export type PrimaryNavSection = {
  key: PrimaryNavKey;
  label: string;
  href: string;
  description: string;
  icon: typeof Home;
  modules: IntelligenceModule[];
};

export const PRIMARY_NAV_SECTIONS: PrimaryNavSection[] = [
  {
    key: "home",
    label: "Home",
    href: "/",
    icon: Home,
    description: "Daily baseball signal surface built around who matters now.",
    modules: [
      { id: "top-performers", label: "Top Performers Feed", href: "/", description: "Today or nearest official boxscore impact rankings.", engine: "data-engine.getTopSignals + intelligence-engine" },
      { id: "impact-globe", label: "Impact Globe", href: "/", description: "Origin clusters synced to current performer filters.", engine: "data-engine.getPlayerOriginClusters" },
      { id: "leader-scan", label: "Fast Leaderboard Scan", href: "/leaderboards", description: "Compact leaders driven by recent impact, not static cards.", engine: "data-engine.getImpactPlayers" },
      { id: "trending-teams", label: "Trending Teams Row", href: "/teams", description: "Standings, form, and system identity context.", engine: "data-engine.getStandings + team-identity-engine" },
    ],
  },
  {
    key: "live",
    label: "Live",
    href: "/live",
    icon: Radio,
    description: "Game tracking, key moments, and event-driven signal updates.",
    modules: [
      { id: "live-games", label: "Real-Time Game Tracking", href: "/live", description: "Live score states from official MLB schedule data.", engine: "data-engine.getTodayGames" },
      { id: "event-feed", label: "Event-Driven Updates", href: "/live", description: "Player events reprioritize feeds and visuals.", engine: "event-bus + event-engine" },
      { id: "key-moments", label: "Win Probability + Key Moments", href: "/live", description: "Score, inning, and leverage-aware game context.", engine: "game-context + leverage-index" },
    ],
  },
  {
    key: "players",
    label: "Players",
    href: "/players",
    icon: Users,
    description: "Player intelligence pages with trends, projections, and archetypes.",
    modules: [
      { id: "player-search", label: "Player Intelligence Search", href: "/players", description: "Find MLB and tracked MiLB players quickly.", engine: "intent-navigation + data-engine" },
      { id: "profiles", label: "Player Profiles", href: "/players", description: "Identity, current form, process, charts, and projections.", engine: "player-model + projection-engine" },
      { id: "archetypes", label: "Skill Profile Radar", href: "/tools", description: "Archetype and percentile profiles for comparisons.", engine: "skill-profile-radar + archetypes" },
    ],
  },
  {
    key: "teams",
    label: "Teams",
    href: "/teams",
    icon: Shield,
    description: "Team dashboards with AAA-to-MLB pipeline context.",
    modules: [
      { id: "team-dashboards", label: "Team Dashboards", href: "/teams", description: "Current state, standings, identity, and style.", engine: "data-engine.getStandings + team-identity-engine" },
      { id: "pipeline", label: "AAA to MLB Pipeline", href: "/minor-leagues/organizations", description: "Affiliates, prospects, and org depth.", engine: "milb-fetchers + prospect-score" },
      { id: "depth", label: "System Depth Tracking", href: "/minor-leagues/organizations", description: "Farm strength and near-ready contributors.", engine: "milb-reconciler + development-curves" },
    ],
  },
  {
    key: "games",
    label: "Games",
    href: "/games",
    icon: Swords,
    description: "Matchup previews and pitcher-vs-lineup analysis.",
    modules: [
      { id: "matchup-previews", label: "Matchup Previews", href: "/games", description: "Daily slate and player context.", engine: "daily-slate-engine + matchup-engine" },
      { id: "pitcher-lineup", label: "Pitcher vs Lineup Matrix", href: "/tools", description: "Advantage grid for likely matchup edges.", engine: "matchup-matrix" },
      { id: "last-x-games", label: "Last X Games Tracker", href: "/tools", description: "Rolling form from game logs and current boxscores.", engine: "last-x-games + rolling-windows" },
    ],
  },
  {
    key: "leaders",
    label: "Leaders",
    href: "/leaderboards",
    icon: Trophy,
    description: "Signal-based leaders that prioritize recent relevance.",
    modules: [
      { id: "impact-leaders", label: "Impact Leaders", href: "/leaderboards", description: "Current weighted signal board.", engine: "data-engine.getImpactPlayers" },
      { id: "dynamic-tiers", label: "Dynamic Tier Lists", href: "/tools", description: "Tiered player ranks using scores and confidence.", engine: "tier-list-engine" },
      { id: "trend-shifts", label: "Trend Shift Engine", href: "/discover", description: "Stat movement, acceleration, and cooling flags.", engine: "trend-shift-engine + trend-detection" },
    ],
  },
  {
    key: "milb",
    label: "MiLB",
    href: "/minor-leagues",
    icon: Sprout,
    description: "Development, promotions, and prospect intelligence.",
    modules: [
      { id: "minor-hub", label: "Minor League System", href: "/minor-leagues", description: "Prospects, leaders, promotions, and org pipeline.", engine: "milb-fetchers + milb-reconciler" },
      { id: "development", label: "Development Tracking", href: "/minor-leagues/transactions", description: "Movement logs and promotion watch.", engine: "milb-movement + development-curves" },
      { id: "projection", label: "Promotion Intelligence", href: "/minor-leagues/top-prospects", description: "Readiness and future value scoring.", engine: "prospect-score + projection-engine" },
    ],
  },
  {
    key: "discover",
    label: "Discover",
    href: "/discover",
    icon: Compass,
    description: "Breakouts, hidden value, anomalies, and contextual signals.",
    modules: [
      { id: "breakouts", label: "Breakout Players", href: "/discover", description: "Recent form compared against baseline.", engine: "trend-detection + intelligence-engine" },
      { id: "hidden-value", label: "Hidden Value Detection", href: "/discover", description: "Context and confidence adjusted discovery.", engine: "context-engine + confidence-scoring" },
      { id: "contact-quality", label: "Contact Quality System", href: "/tools", description: "xStats-style process signal layer.", engine: "contact-quality" },
    ],
  },
  {
    key: "tools",
    label: "Tools",
    href: "/tools",
    icon: Wrench,
    description: "Comparison, export, and custom intelligence workbench.",
    modules: [
      { id: "compare", label: "PvP Comparisons", href: "/tools", description: "Player-vs-player context with percentiles and radar profiles.", engine: "pvp-comparison + skill-profile-radar" },
      { id: "exports", label: "Screenshot / Export System", href: "/tools", description: "Share-ready cards and comparisons.", engine: "export-card + html2canvas" },
      { id: "custom-dashboard", label: "Custom Dashboards", href: "/dashboard", description: "Configurable command surface.", engine: "personalization + data-engine" },
      { id: "contract-value", label: "Contract Value System", href: "/tools", description: "Surplus value and cost-per-impact modeling.", engine: "contract-value" },
      { id: "data-health", label: "Data Health", href: "/admin/data-health", description: "Validation, identity, and source reliability diagnostics.", engine: "data-validator + source-health" },
    ],
  },
];

export const PRIMARY_NAV_LINKS = PRIMARY_NAV_SECTIONS.map(({ href, label }) => ({ href, label }));

export const LENS_NAV_LINKS = [
  { href: "/stats", label: "Stats", description: "Traditional, advanced, expected, and situational stat browsing.", engine: "data-engine.getIntelligenceLensData(stats)" },
  { href: "/lineups", label: "Lineups", description: "Lineup impact, order construction, and batting-order synergy.", engine: "lineup-impact-matrix + intelligence-engine" },
  { href: "/dashboard", label: "Dashboard", description: "User-configurable control center for pinned intelligence modules.", engine: "personalization + data-engine" },
  { href: "/trend-shift", label: "Trend Shift", description: "Fastest recent movement versus season baseline.", engine: "trend-shift-engine + intelligence-engine" },
  { href: "/profiles", label: "Profiles", description: "Archetype discovery across player types and skill shapes.", engine: "player-model + skill-profile-radar" },
  { href: "/showcase", label: "Showcase", description: "Curated editorial layer for the strongest current reads.", engine: "insight-engine + story-generator" },
  { href: "/matchup-matrix", label: "Matchup Matrix", description: "Slate prep, lineup-vs-game context, and player edge mapping.", engine: "matchup-matrix + context-engine" },
  { href: "/contact-quality", label: "Contact Quality", description: "Process-quality view for expected damage and contact shape.", engine: "contact-quality + trend-detection" },
  { href: "/draft-prospects", label: "Draft / Prospects", description: "Future-value board connecting prospects, org ladders, and near-ready talent.", engine: "prospect-score + projection-engine" },
  { href: "/tier-list", label: "Tier List", description: "Dynamic player, prospect, and team tiering.", engine: "tier-list-engine + confidence-scoring" },
  { href: "/last-x-games", label: "Last X Games", description: "Rolling short-window form isolation.", engine: "time-engine + rolling-windows" },
  { href: "/pvp", label: "PvP", description: "Player-vs-player comparison with current form and archetype context.", engine: "pvp-comparison + player-model" },
  { href: "/contracts", label: "Contracts", description: "Salary, impact, efficiency, and surplus value lens.", engine: "contract-value + player-value-model" },
  { href: "/lab", label: "Beta / Lab", description: "Experimental model outputs and validation surfaces.", engine: "model-tuning + source-health" },
  { href: "/feedback", label: "Feedback", description: "Product-quality feedback connected to live system context.", engine: "data-health + user feedback" },
];

export const TOP_NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/stats", label: "Stats" },
  { href: "/lineups", label: "Lineups" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/live", label: "Live" },
  { href: "/trend-shift", label: "Trend Shift" },
  { href: "/teams", label: "Teams" },
  { href: "/profiles", label: "Profiles" },
  { href: "/showcase", label: "Showcase" },
  { href: "/matchup-matrix", label: "Matrix" },
  { href: "/contact-quality", label: "Contact" },
  { href: "/minor-leagues", label: "MiLB" },
  { href: "/tier-list", label: "Tiers" },
  { href: "/last-x-games", label: "Last X" },
  { href: "/pvp", label: "PvP" },
  { href: "/contracts", label: "Contracts" },
  { href: "/lab", label: "Lab" },
];

export const FEATURE_GROUPS = [
  {
    label: "Live Intelligence",
    icon: Gauge,
    items: [
      ...PRIMARY_NAV_SECTIONS.find((section) => section.key === "live")!.modules,
      ...PRIMARY_NAV_SECTIONS.find((section) => section.key === "games")!.modules,
    ],
  },
  {
    label: "Player Systems",
    icon: Users,
    items: [
      ...PRIMARY_NAV_SECTIONS.find((section) => section.key === "players")!.modules,
      ...PRIMARY_NAV_SECTIONS.find((section) => section.key === "leaders")!.modules,
    ],
  },
  {
    label: "Team + Pipeline",
    icon: Shield,
    items: [
      ...PRIMARY_NAV_SECTIONS.find((section) => section.key === "teams")!.modules,
      ...PRIMARY_NAV_SECTIONS.find((section) => section.key === "milb")!.modules,
    ],
  },
  {
    label: "Discovery + Tools",
    icon: Search,
    items: [
      ...PRIMARY_NAV_SECTIONS.find((section) => section.key === "discover")!.modules,
      ...PRIMARY_NAV_SECTIONS.find((section) => section.key === "tools")!.modules,
    ],
  },
  {
    label: "Specialized Lenses",
    icon: Compass,
    items: LENS_NAV_LINKS,
  },
  {
    label: "Daily Surface",
    icon: BarChart3,
    items: PRIMARY_NAV_SECTIONS.find((section) => section.key === "home")!.modules,
  },
];

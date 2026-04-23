import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { AreaTrendChart } from "@/src/components/charts/AreaTrendChart";
import { PageShell, SectionHeader } from "@/src/components/layout/PageShell";
import { getIntelligenceLensData, type IntelligenceLensKey } from "@/lib/data-engine";
import { buildDynamicTierList, groupByTier } from "@/lib/tier-list-engine";
import { buildLineupImpactMatrix } from "@/lib/lineup-impact-matrix";
import { rankTrendShifts } from "@/lib/trend-shift-engine";
import { evaluateContactQuality } from "@/lib/contact-quality";
import { buildSkillProfile, skillProfileScore } from "@/lib/skill-profile-radar";
import { comparePlayersPvp } from "@/lib/pvp-comparison";
import { calculateContractValue } from "@/lib/contract-value";
import { estimateWinProbability } from "@/lib/win-probability";
import { NEAR_REALTIME_REFRESH_MS } from "@/src/lib/live";

type LensConfig = {
  eyebrow: string;
  title: string;
  copy: string;
  primaryLabel: string;
  secondaryLabel: string;
};

const LENS_COPY: Record<IntelligenceLensKey, LensConfig> = {
  stats: {
    eyebrow: "Stats hub",
    title: "League-wide statistical backbone",
    copy: "Browse impact, form, and percentile-style context from the same official player feed that powers the homepage and leaderboards.",
    primaryLabel: "Stat table",
    secondaryLabel: "Advanced context",
  },
  lineups: {
    eyebrow: "Lineup impact",
    title: "Order construction and player gravity",
    copy: "A baseball translation of WOWY thinking: with-player impact, lineup balance, and construction lenses from current performance signals.",
    primaryLabel: "Best current construction",
    secondaryLabel: "Balance profile",
  },
  dashboard: {
    eyebrow: "Dashboard",
    title: "Configurable command center",
    copy: "A compact control surface for saved teams, players, leaderboards, games, prospects, and recently viewed intelligence modules.",
    primaryLabel: "Pinned modules",
    secondaryLabel: "Live system state",
  },
  "trend-shift": {
    eyebrow: "Trend shift engine",
    title: "Who is changing fastest",
    copy: "Last-7 form against season baseline, weighted by sample confidence and connected back to player profiles and leaderboards.",
    primaryLabel: "Biggest movement",
    secondaryLabel: "Signal explanation",
  },
  profiles: {
    eyebrow: "Profiles",
    title: "Find player types, not just names",
    copy: "Power bats, OBP engines, contact specialists, speed threats, ace shapes, command arms, and volatile relief profiles.",
    primaryLabel: "Archetype board",
    secondaryLabel: "Skill radar",
  },
  showcase: {
    eyebrow: "Showcase",
    title: "Best current Moneyballr reads",
    copy: "A curated front page for the strongest player signal, trend, comparison, and development-adjacent insight surfaced today.",
    primaryLabel: "Featured signal",
    secondaryLabel: "Share-ready context",
  },
  "matchup-matrix": {
    eyebrow: "Matchup matrix",
    title: "Slate prep and advantage mapping",
    copy: "Live schedule context, team form, win-probability shape, and player signal edges in one prep-oriented surface.",
    primaryLabel: "Game matrix",
    secondaryLabel: "Player edges",
  },
  "contact-quality": {
    eyebrow: "Contact quality",
    title: "Process before results",
    copy: "Expected damage, power process, and recent contact quality proxies derived from current official stat signals.",
    primaryLabel: "Damage board",
    secondaryLabel: "Expected output",
  },
  "draft-prospects": {
    eyebrow: "Draft and prospects",
    title: "Future-value pipeline lens",
    copy: "A broader talent pipeline surface linking prospects, near-MLB players, organization boards, and age-to-level context.",
    primaryLabel: "Pipeline leaders",
    secondaryLabel: "MiLB connections",
  },
  "tier-list": {
    eyebrow: "Tier list",
    title: "Opinionated, data-backed tiers",
    copy: "Hitters, pitchers, prospects, and teams grouped by impact, trend, projection, and confidence rather than raw stat sorting.",
    primaryLabel: "Current form tiers",
    secondaryLabel: "Tier logic",
  },
  "last-x-games": {
    eyebrow: "Last X games",
    title: "Rolling sample isolation",
    copy: "Short-window form lenses for hot bats, cold stretches, power bursts, and stability signals using current rolling data.",
    primaryLabel: "Window board",
    secondaryLabel: "Rolling trend",
  },
  pvp: {
    eyebrow: "PvP",
    title: "Player-versus-player comparison",
    copy: "Compare two to four players by impact, recent form, archetype, skill profile, and export-ready summary.",
    primaryLabel: "Comparison table",
    secondaryLabel: "Who is better now",
  },
  contracts: {
    eyebrow: "Contracts",
    title: "Salary versus performance value",
    copy: "A baseball value surface for surplus production, cost efficiency, payroll allocation, and future prospect surplus integration.",
    primaryLabel: "Surplus board",
    secondaryLabel: "Value model",
  },
  lab: {
    eyebrow: "Beta lab",
    title: "Experimental model room",
    copy: "A softer-labeled area for new model outputs, alternate projections, edge-case tools, and validation views before they graduate.",
    primaryLabel: "Active experiments",
    secondaryLabel: "Model checks",
  },
  feedback: {
    eyebrow: "Feedback",
    title: "Help tune the intelligence system",
    copy: "Report bugs, request lenses, flag confusing stats, and send quick product sentiment without leaving the platform flow.",
    primaryLabel: "Feedback form",
    secondaryLabel: "System context",
  },
};

function rate(value: number | null | undefined) {
  if (value === null || value === undefined) return "-";
  return value.toFixed(3).replace(/^0/, "");
}

function pct(value: number | null | undefined) {
  if (value === null || value === undefined) return 50;
  return Math.round(Math.max(0, Math.min(100, value * 100)));
}

function LensNav() {
  const links: Array<[string, string]> = [
    ["/stats", "Stats"],
    ["/lineups", "Lineups"],
    ["/dashboard", "Dashboard"],
    ["/live", "Live"],
    ["/trend-shift", "Trend Shift"],
    ["/profiles", "Profiles"],
    ["/showcase", "Showcase"],
    ["/matchup-matrix", "Matrix"],
    ["/contact-quality", "Contact"],
    ["/tier-list", "Tiers"],
    ["/last-x-games", "Last X"],
    ["/pvp", "PvP"],
    ["/contracts", "Contracts"],
    ["/lab", "Lab"],
  ];
  return (
    <div className="flex gap-2 overflow-x-auto border-b border-white/8 px-4 py-3">
      {links.map(([href, label]) => (
        <Link key={href} to={href} className="shrink-0 border border-white/8 bg-white/[0.025] px-3 py-2 font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.14em] text-slate-400 transition hover:border-cyan-300/30 hover:text-cyan-100">
          {label}
        </Link>
      ))}
    </div>
  );
}

export function IntelligenceLensPage({ lens }: { lens: IntelligenceLensKey }) {
  const [windowSize, setWindowSize] = useState(7);
  const query = useQuery({
    queryKey: ["intelligence-lens", lens],
    queryFn: () => getIntelligenceLensData(lens),
    staleTime: NEAR_REALTIME_REFRESH_MS,
    refetchInterval: NEAR_REALTIME_REFRESH_MS,
  });
  const data = query.data;
  const players = data?.players || [];
  const signals = data?.signals || [];
  const standings = data?.standings || [];
  const games = data?.games || [];
  const topPlayers = players.slice(0, 16);
  const config = LENS_COPY[lens];

  const tierGroups = useMemo(() => groupByTier(buildDynamicTierList(topPlayers.map((player) => ({
    id: player.id,
    name: player.title,
    team: player.team,
    score: player.score,
    confidence: player.last7Woba ? 78 : 58,
  })))), [topPlayers]);
  const lineup = useMemo(() => buildLineupImpactMatrix(topPlayers.slice(0, 9).map((player) => ({
    id: player.id,
    name: player.title,
    team: player.team,
    withPlayerRuns: player.score,
    withoutPlayerRuns: 45,
    plateAppearances: player.last7Woba ? 90 : 36,
    impactScore: player.score,
  }))), [topPlayers]);
  const shifts = useMemo(() => rankTrendShifts(topPlayers.map((player) => ({
    id: player.id,
    label: player.title,
    baseline: player.woba || 0.315,
    current: player.last7Woba || player.woba || 0.315,
    sampleSize: player.last7Woba ? 24 : 10,
  }))), [topPlayers]);
  const pvp = useMemo(() => comparePlayersPvp(topPlayers.slice(0, 4).map((player) => ({
    id: player.id,
    name: player.title,
    team: player.team,
    score: player.score,
    trendScore: player.last7Woba && player.woba ? (player.last7Woba - player.woba) * 100 : 0,
    skills: { contact: pct(player.woba), power: pct(player.hardHit || player.woba), discipline: pct(player.last7Woba || player.woba), speed: player.trend === "hot" ? 72 : 48 },
  }))), [topPlayers]);
  const leadPlayer = topPlayers[0];
  const leadProfile = leadPlayer ? buildSkillProfile({ contact: pct(leadPlayer.woba), power: pct(leadPlayer.hardHit || leadPlayer.woba), discipline: pct(leadPlayer.last7Woba || leadPlayer.woba), speed: leadPlayer.trend === "hot" ? 75 : 50 }) : [];
  const contact = evaluateContactQuality({ hardHitRate: (leadPlayer?.hardHit || leadPlayer?.woba || 0.36) * 100, barrelRate: leadPlayer?.score ? Math.min(18, leadPlayer.score / 6) : 7, sampleSize: 32 });
  const contract = leadPlayer ? calculateContractValue({ playerId: leadPlayer.id, name: leadPlayer.title, team: leadPlayer.team, valueScore: leadPlayer.score }) : null;
  const liveGame = games.find((game) => game.state === "LIVE") || games[0];
  const winProb = liveGame ? estimateWinProbability(liveGame) : null;

  return (
    <PageShell>
      <section className="surface-primary overflow-hidden">
        <SectionHeader eyebrow={config.eyebrow} title={config.title} copy={config.copy} />
        <LensNav />

        <div className="grid grid-cols-1 gap-5 p-5 xl:grid-cols-[1.618fr_1fr]">
          <section className="surface-secondary overflow-hidden">
            <div className="flex items-center justify-between border-b border-white/8 p-4">
              <div>
                <div className="mb-label text-cyan-200">{config.primaryLabel}</div>
                <h2 className="font-['Bebas_Neue'] text-4xl tracking-[0.08em] text-white">
                  {lens === "lineups" ? "Optimized order 1-9" : lens === "tier-list" ? "Tier board" : lens === "pvp" ? "Comparison board" : "Current impact table"}
                </h2>
              </div>
              <div className="font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.16em] text-slate-500">
                {data?.refreshedAt ? `Updated ${new Date(data.refreshedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}` : "Loading"}
              </div>
            </div>

            {lens === "lineups" ? (
              <div className="grid grid-cols-1 divide-y divide-white/8">
                {lineup.map((player, index) => (
                  <Link key={player.id} to={`/player/${player.id}`} className="grid grid-cols-[2rem_1fr_auto] items-center gap-3 px-4 py-3 transition hover:bg-white/[0.025]">
                    <span className="font-['Bebas_Neue'] text-2xl text-emerald-300">{index + 1}</span>
                    <div>
                      <div className="font-['Barlow_Condensed'] text-2xl font-semibold uppercase tracking-[0.08em] text-white">{player.name}</div>
                      <div className="text-xs text-slate-500">{player.team} · {player.label}</div>
                    </div>
                    <div className="font-['Bebas_Neue'] text-3xl text-white">{player.normalizedImpact}</div>
                  </Link>
                ))}
              </div>
            ) : lens === "tier-list" ? (
              <div className="space-y-4 p-4">
                {(["S", "A", "B", "C"] as const).map((tier) => (
                  <div key={tier} className="grid grid-cols-[2.5rem_1fr] gap-3">
                    <div className="font-['Bebas_Neue'] text-4xl text-emerald-300">{tier}</div>
                    <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                      {tierGroups[tier].slice(0, 4).map((player) => (
                        <Link key={player.id} to={`/player/${player.id}`} className="border border-white/8 bg-white/[0.025] p-3 transition hover:border-emerald-300/30">
                          <div className="font-['Barlow_Condensed'] text-xl uppercase tracking-[0.08em] text-white">{player.name}</div>
                          <div className="text-xs text-slate-500">{player.team} · score {Math.round(player.score)}</div>
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : lens === "pvp" ? (
              <div className="grid grid-cols-1 gap-3 p-4 md:grid-cols-2">
                {pvp.players.map((player) => (
                  <Link key={player.id} to={`/player/${player.id}`} className="border border-white/8 bg-white/[0.025] p-4 transition hover:border-cyan-300/30">
                    <div className="font-['Barlow_Condensed'] text-2xl font-semibold uppercase tracking-[0.08em] text-white">{player.name}</div>
                    <div className="mt-1 text-xs text-slate-500">{player.team} · profile {player.profileScore}</div>
                    <div className="mt-3 h-1.5 bg-white/8"><div className="h-full bg-emerald-300" style={{ width: `${Math.min(100, Math.round(player.score))}%` }} /></div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="divide-y divide-white/8">
                {topPlayers.slice(0, lens === "stats" ? 24 : 12).map((player) => (
                  <Link key={player.id} to={`/player/${player.id}`} className="grid grid-cols-[3rem_1fr_auto] items-center gap-3 px-4 py-3 transition hover:bg-white/[0.025]">
                    <img src={player.src} alt={player.alt} className="player-headshot aspect-square w-full bg-slate-900" loading="lazy" />
                    <div className="min-w-0">
                      <div className="truncate font-['Barlow_Condensed'] text-2xl font-semibold uppercase tracking-[0.08em] text-white">{player.title}</div>
                      <div className="truncate text-xs text-slate-500">{player.team} · wOBA {rate(player.woba)} · Last 7 {rate(player.last7Woba)} · {player.trend}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-['Bebas_Neue'] text-3xl tracking-[0.08em] text-emerald-300">{Math.round(player.score)}</div>
                      <div className="font-['JetBrains_Mono'] text-[9px] uppercase tracking-[0.14em] text-slate-500">impact</div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

          <aside className="space-y-5">
            <section className="surface-secondary p-4">
              <div className="mb-label text-cyan-200">{config.secondaryLabel}</div>
              {lens === "trend-shift" ? (
                <div className="mt-3 space-y-2">
                  {shifts.slice(0, 6).map((shift) => (
                    <div key={shift.id} className="flex items-center justify-between border border-white/8 bg-white/[0.025] p-3">
                      <div className="min-w-0">
                        <div className="truncate font-['Barlow_Condensed'] text-xl uppercase tracking-[0.08em] text-white">{shift.label}</div>
                        <div className="text-xs text-slate-500">{shift.verdict} · {shift.delta.toFixed(3)}</div>
                      </div>
                      <div className={shift.direction === "up" ? "text-emerald-300" : shift.direction === "down" ? "text-rose-300" : "text-slate-400"}>{shift.direction.toUpperCase()}</div>
                    </div>
                  ))}
                </div>
              ) : lens === "contact-quality" ? (
                <div className="mt-4 rounded-2xl border border-white/8 bg-black/20 p-4">
                  <div className="font-['Bebas_Neue'] text-5xl text-white">{contact.damageScore}</div>
                  <div className="text-sm text-slate-400">{contact.label} · xSLG {rate(contact.expectedSlug)}</div>
                </div>
              ) : lens === "contracts" ? (
                <div className="mt-4 rounded-2xl border border-white/8 bg-black/20 p-4">
                  <div className="font-['Bebas_Neue'] text-5xl text-white">{contract?.surplusScore || "-"}</div>
                  <div className="text-sm text-slate-400">{contract ? `${contract.name} · ${contract.label}` : "Waiting for player feed."}</div>
                </div>
              ) : lens === "matchup-matrix" ? (
                <div className="mt-4 rounded-2xl border border-white/8 bg-black/20 p-4">
                  <div className="font-['Barlow_Condensed'] text-2xl uppercase tracking-[0.08em] text-white">{liveGame ? `${liveGame.awayTeam} at ${liveGame.homeTeam}` : "Today slate"}</div>
                  <div className="mt-2 text-sm text-slate-400">{winProb ? `${winProb.leverageHint} · home win ${winProb.homeProbability}%` : "Live schedule context is updating."}</div>
                </div>
              ) : (
                <div className="mt-3 space-y-2">
                  {leadProfile.map((point) => (
                    <div key={point.axis}>
                      <div className="flex justify-between text-xs text-slate-400"><span>{point.label}</span><span>{point.value}</span></div>
                      <div className="mt-1 h-1.5 bg-white/8"><div className="h-full bg-cyan-300" style={{ width: `${point.value}%` }} /></div>
                    </div>
                  ))}
                  <div className="pt-2 text-xs text-slate-500">Composite {skillProfileScore(leadProfile)}</div>
                </div>
              )}
            </section>

            <section className="surface-secondary p-4">
              <div className="mb-label text-cyan-200">Connected exits</div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <Link to="/leaderboards" className="border border-white/8 bg-white/[0.025] p-3 text-xs text-slate-300 hover:border-emerald-300/30">Leaderboards</Link>
                <Link to="/players" className="border border-white/8 bg-white/[0.025] p-3 text-xs text-slate-300 hover:border-emerald-300/30">Profiles</Link>
                <Link to="/minor-leagues" className="border border-white/8 bg-white/[0.025] p-3 text-xs text-slate-300 hover:border-emerald-300/30">MiLB</Link>
                <Link to="/tools" className="border border-white/8 bg-white/[0.025] p-3 text-xs text-slate-300 hover:border-emerald-300/30">Tools</Link>
              </div>
            </section>
          </aside>
        </div>

        <div className="grid grid-cols-1 gap-5 border-t border-white/8 p-5 lg:grid-cols-[1.618fr_1fr]">
          <AreaTrendChart
            eyebrow={`Last ${windowSize} view`}
            title="Impact shape"
            points={topPlayers.slice(0, windowSize).reverse().map((player) => ({ label: player.title.split(" ").slice(-1)[0] || player.title, value: Math.round(player.score) }))}
            valueLabel="Impact"
          />
          <section className="surface-secondary p-4">
            <div className="mb-label text-cyan-200">Window control</div>
            <div className="mt-3 flex flex-wrap gap-2">
              {[3, 5, 7, 10, 15].map((value) => (
                <button key={value} type="button" onClick={() => setWindowSize(value)} className={`border px-3 py-2 font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.14em] ${windowSize === value ? "border-emerald-300/30 bg-emerald-300/10 text-emerald-200" : "border-white/10 bg-white/[0.03] text-slate-400"}`}>
                  Last {value}
                </button>
              ))}
            </div>
            <div className="mt-4 space-y-2">
              {signals.slice(0, 3).map((signal) => (
                <div key={signal.id} className="border border-white/8 bg-white/[0.025] p-3">
                  <div className="font-['Barlow_Condensed'] text-xl uppercase tracking-[0.08em] text-white">{signal.name}</div>
                  <div className="mt-1 text-xs leading-5 text-slate-500">{signal.insight.whyItMatters}</div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {lens === "feedback" ? (
          <div className="border-t border-white/8 p-5">
            <div className="surface-secondary p-4">
              <div className="mb-label text-cyan-200">Feedback intake</div>
              <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-4">
                {["Bug report", "Feature request", "Confusing stat", "Favorite feature"].map((item) => (
                  <button key={item} type="button" className="border border-white/8 bg-white/[0.025] p-4 text-left font-['Barlow_Condensed'] text-xl uppercase tracking-[0.08em] text-white transition hover:border-emerald-300/30">
                    {item}
                  </button>
                ))}
              </div>
              <p className="mt-4 text-sm text-slate-500">This panel stays lightweight but still shows live system context: {standings.length} teams, {players.length} players, {games.length} games currently hydrated.</p>
            </div>
          </div>
        ) : null}
      </section>
    </PageShell>
  );
}

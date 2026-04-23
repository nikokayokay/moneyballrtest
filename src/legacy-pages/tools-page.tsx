import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { PageShell, SectionHeader } from "@/src/components/layout/PageShell";
import { getImpactPlayers, getTodayGames } from "@/lib/data-engine";
import { buildDynamicTierList, groupByTier } from "@/lib/tier-list-engine";
import { buildSkillProfile, skillProfileScore } from "@/lib/skill-profile-radar";
import { comparePlayersPvp } from "@/lib/pvp-comparison";
import { buildLineupImpactMatrix } from "@/lib/lineup-impact-matrix";
import { calculateContractValue } from "@/lib/contract-value";
import { rankTrendShifts } from "@/lib/trend-shift-engine";
import { evaluateContactQuality } from "@/lib/contact-quality";
import { summarizeLastXGames } from "@/lib/last-x-games";
import { estimateWinProbability } from "@/lib/win-probability";
import { NEAR_REALTIME_REFRESH_MS } from "@/src/lib/live";

function pct(value: number | null | undefined) {
  if (value === null || value === undefined) return 50;
  return Math.round(Math.max(0, Math.min(100, value * 100)));
}

export function ToolsPage() {
  const impactQuery = useQuery({
    queryKey: ["tools-impact-players"],
    queryFn: () => getImpactPlayers(36),
    staleTime: NEAR_REALTIME_REFRESH_MS,
    refetchInterval: NEAR_REALTIME_REFRESH_MS,
  });
  const gamesQuery = useQuery({
    queryKey: ["tools-live-games"],
    queryFn: () => getTodayGames(),
    staleTime: NEAR_REALTIME_REFRESH_MS,
    refetchInterval: NEAR_REALTIME_REFRESH_MS,
  });

  const players = impactQuery.data || [];
  const topPlayers = players.slice(0, 8);
  const tierGroups = groupByTier(buildDynamicTierList(players.slice(0, 20).map((player) => ({
    id: player.id,
    name: player.title,
    team: player.team,
    score: player.score,
    confidence: player.last7Woba ? 78 : 58,
  }))));
  const pvp = comparePlayersPvp(topPlayers.slice(0, 4).map((player) => ({
    id: player.id,
    name: player.title,
    team: player.team,
    score: player.score,
    trendScore: player.last7Woba && player.woba ? (player.last7Woba - player.woba) * 100 : 0,
    skills: {
      contact: pct(player.woba),
      power: pct(player.hardHit || player.woba),
      discipline: pct(player.last7Woba || player.woba),
      speed: player.trend === "hot" ? 72 : 48,
    },
  })));
  const lineup = buildLineupImpactMatrix(topPlayers.map((player) => ({
    id: player.id,
    name: player.title,
    team: player.team,
    withPlayerRuns: player.score,
    withoutPlayerRuns: 45,
    plateAppearances: player.last7Woba ? 90 : 36,
    impactScore: player.score,
  }))).slice(0, 5);
  const trendShifts = rankTrendShifts(topPlayers.map((player) => ({
    id: player.id,
    label: player.title,
    baseline: player.woba || 0.32,
    current: player.last7Woba || player.woba || 0.32,
    sampleSize: player.last7Woba ? 24 : 8,
  }))).slice(0, 5);
  const liveGame = gamesQuery.data?.find((game) => game.state === "LIVE") || gamesQuery.data?.[0];
  const winProb = liveGame ? estimateWinProbability(liveGame) : null;
  const leadProfile = topPlayers[0]
    ? buildSkillProfile({
        contact: pct(topPlayers[0].woba),
        power: pct(topPlayers[0].hardHit || topPlayers[0].woba),
        discipline: pct(topPlayers[0].last7Woba || topPlayers[0].woba),
        speed: topPlayers[0].trend === "hot" ? 76 : 50,
      })
    : [];
  const contactQuality = evaluateContactQuality({
    hardHitRate: (topPlayers[0]?.hardHit || topPlayers[0]?.woba || 0.36) * 100,
    barrelRate: topPlayers[0]?.score ? Math.min(18, topPlayers[0].score / 6) : 7,
    sampleSize: 32,
  });
  const contract = topPlayers[0]
    ? calculateContractValue({ playerId: topPlayers[0].id, name: topPlayers[0].title, team: topPlayers[0].team, salaryMillions: undefined, valueScore: topPlayers[0].score })
    : null;
  const lastX = summarizeLastXGames(topPlayers.slice(0, 10).map((player, index) => ({
    date: new Date(Date.now() - index * 86_400_000).toISOString().slice(0, 10),
    opponent: player.team,
    value: Math.round(player.score / 10),
    contextScore: player.score,
  })), 5);

  return (
    <PageShell>
      <section className="surface-primary overflow-hidden">
        <SectionHeader
          eyebrow="Tools"
          title="Intelligence workbench"
          copy="Comparison, tiering, lineup impact, contact quality, and export-ready modules fed by the same impact player and live game engines."
        />

        <div className="grid grid-cols-1 gap-5 p-5 xl:grid-cols-[1.618fr_1fr]">
          <div className="surface-secondary p-4">
            <div className="mb-label text-cyan-200">PvP comparison engine</div>
            <h2 className="mt-2 font-['Bebas_Neue'] text-4xl tracking-[0.08em] text-white">{pvp.leader?.name || "Updating"}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">{pvp.summary}</p>
            <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
              {pvp.players.map((player) => (
                <Link key={player.id} to={`/player/${player.id}`} className="border border-white/8 bg-white/[0.025] p-3 transition hover:border-emerald-300/30 hover:bg-emerald-300/8">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="font-['Barlow_Condensed'] text-2xl font-semibold uppercase tracking-[0.08em] text-white">{player.name}</div>
                      <div className="text-xs text-slate-500">{player.team || "MLB"} · profile {player.profileScore}</div>
                    </div>
                    <div className="font-['Bebas_Neue'] text-4xl tracking-[0.08em] text-emerald-300">{Math.round(player.score)}</div>
                  </div>
                  <div className="mt-3 h-1.5 bg-white/8">
                    <div className="h-full bg-emerald-300" style={{ width: `${Math.min(100, Math.round(player.score))}%` }} />
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className="surface-secondary p-4">
            <div className="mb-label text-cyan-200">Live context module</div>
            <div className="mt-3 rounded-2xl border border-white/8 bg-black/20 p-4">
              <div className="font-['Barlow_Condensed'] text-2xl font-semibold uppercase tracking-[0.08em] text-white">
                {liveGame ? `${liveGame.awayTeam} at ${liveGame.homeTeam}` : "No live game loaded"}
              </div>
              <div className="mt-2 text-sm text-slate-400">
                {liveGame ? `${liveGame.state} · ${liveGame.inning || "Pregame"} · ${liveGame.awayScore ?? "-"}-${liveGame.homeScore ?? "-"}` : "The same live endpoint powers Game Center."}
              </div>
              {winProb ? (
                <div className="mt-4">
                  <div className="flex items-center justify-between font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.16em] text-slate-400">
                    <span>{liveGame?.awayTeam} {winProb.awayProbability}%</span>
                    <span>{winProb.leverageHint}</span>
                    <span>{liveGame?.homeTeam} {winProb.homeProbability}%</span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/8">
                    <div className="h-full bg-cyan-300" style={{ width: `${winProb.homeProbability}%` }} />
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 border-t border-white/8 p-5 lg:grid-cols-3">
          <section className="surface-secondary p-4">
            <div className="mb-label text-cyan-200">Dynamic tier list</div>
            <div className="mt-4 space-y-3">
              {(["S", "A", "B"] as const).map((tier) => (
                <div key={tier} className="grid grid-cols-[2rem_1fr] gap-3">
                  <div className="font-['Bebas_Neue'] text-3xl text-emerald-300">{tier}</div>
                  <div className="space-y-2">
                    {tierGroups[tier].slice(0, 3).map((player) => (
                      <div key={player.id} className="flex items-center justify-between border border-white/8 bg-white/[0.025] px-3 py-2">
                        <span className="truncate font-['Barlow_Condensed'] text-lg uppercase tracking-[0.08em] text-white">{player.name}</span>
                        <span className="font-['JetBrains_Mono'] text-[10px] text-slate-500">{Math.round(player.score)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="surface-secondary p-4">
            <div className="mb-label text-cyan-200">Lineup impact matrix</div>
            <div className="mt-4 space-y-2">
              {lineup.map((player) => (
                <div key={player.id} className="border border-white/8 bg-white/[0.025] p-3">
                  <div className="flex items-center justify-between gap-4">
                    <span className="truncate font-['Barlow_Condensed'] text-xl uppercase tracking-[0.08em] text-white">{player.name}</span>
                    <span className="font-['Bebas_Neue'] text-2xl text-emerald-300">{player.normalizedImpact}</span>
                  </div>
                  <div className="mt-1 text-xs text-slate-500">{player.label} · delta {player.delta.toFixed(1)}</div>
                </div>
              ))}
            </div>
          </section>

          <section className="surface-secondary p-4">
            <div className="mb-label text-cyan-200">Trend shift engine</div>
            <div className="mt-4 space-y-2">
              {trendShifts.map((trend) => (
                <div key={trend.id} className="flex items-center justify-between border border-white/8 bg-white/[0.025] p-3">
                  <div className="min-w-0">
                    <div className="truncate font-['Barlow_Condensed'] text-xl uppercase tracking-[0.08em] text-white">{trend.label}</div>
                    <div className="text-xs text-slate-500">{trend.verdict} · {(trend.delta).toFixed(3)}</div>
                  </div>
                  <div className={trend.direction === "up" ? "text-emerald-300" : trend.direction === "down" ? "text-rose-300" : "text-slate-400"}>
                    {trend.direction.toUpperCase()}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="grid grid-cols-1 gap-5 border-t border-white/8 p-5 lg:grid-cols-4">
          <section className="surface-secondary p-4">
            <div className="mb-label text-cyan-200">Skill radar primitive</div>
            <div className="mt-3 space-y-2">
              {leadProfile.map((point) => (
                <div key={point.axis}>
                  <div className="flex justify-between text-xs text-slate-400"><span>{point.label}</span><span>{point.value}</span></div>
                  <div className="mt-1 h-1.5 bg-white/8"><div className="h-full bg-cyan-300" style={{ width: `${point.value}%` }} /></div>
                </div>
              ))}
            </div>
            <div className="mt-3 text-xs text-slate-500">Composite {skillProfileScore(leadProfile)}</div>
          </section>
          <section className="surface-secondary p-4">
            <div className="mb-label text-cyan-200">Contact quality</div>
            <div className="mt-3 font-['Bebas_Neue'] text-4xl tracking-[0.08em] text-white">{contactQuality.damageScore}</div>
            <div className="text-sm text-slate-400">{contactQuality.label} · xSLG {contactQuality.expectedSlug.toFixed(3).replace(/^0/, "")}</div>
          </section>
          <section className="surface-secondary p-4">
            <div className="mb-label text-cyan-200">Contract value</div>
            <div className="mt-3 font-['Bebas_Neue'] text-4xl tracking-[0.08em] text-white">{contract?.label || "Updating"}</div>
            <div className="text-sm text-slate-400">{contract ? `${contract.name} · value ${contract.surplusScore}` : "Waiting for player feed."}</div>
          </section>
          <section className="surface-secondary p-4">
            <div className="mb-label text-cyan-200">Last X games</div>
            <div className="mt-3 font-['Bebas_Neue'] text-4xl tracking-[0.08em] text-white">{lastX.average}</div>
            <div className="text-sm text-slate-400">{lastX.trend} trend · best {lastX.best?.opponent || "loading"}</div>
          </section>
        </div>
      </section>
    </PageShell>
  );
}

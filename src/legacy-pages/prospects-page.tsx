import { Link, useSearchParams } from "react-router-dom";
import { ArrowRight, Globe2, Sparkles, TrendingUp } from "lucide-react";
import { AreaTrendChart } from "@/src/components/charts/AreaTrendChart";
import { FarmSystemPanel } from "@/src/components/milb/FarmSystemPanel";
import { ProspectCard } from "@/src/components/milb/ProspectCard";
import { ProspectSearch } from "@/src/components/milb/ProspectSearch";
import { PageShell, SectionHeader } from "@/src/components/layout/PageShell";
import { FARM_SYSTEMS, LEAGUE_LEVELS, hiddenGems, milbLeaderboard, nearMlbReady, PROSPECTS, trendingProspects } from "@/src/data/milb";

const recentMoves = [
  { label: "Promotion watch", text: "Sal Stewart's AAA approach and OBP signal keep him near the MLB-ready queue.", tone: "text-emerald-200" },
  { label: "Development note", text: "Konnor Griffin's adjusted power-speed profile is rising despite Single-A translation drag.", tone: "text-cyan-200" },
  { label: "Command risk", text: "Chase Hampton stays tracked, but walk pressure lowers the current development score.", tone: "text-yellow-200" },
];

function orgPipelineCounts() {
  return Object.keys(FARM_SYSTEMS)
    .map((org) => ({
      org,
      count: PROSPECTS.filter((prospect) => prospect.orgAbbr === org).length,
      avg: PROSPECTS.filter((prospect) => prospect.orgAbbr === org).reduce((sum, prospect) => sum + prospect.developmentScore, 0)
        / Math.max(1, PROSPECTS.filter((prospect) => prospect.orgAbbr === org).length),
    }))
    .sort((a, b) => b.avg - a.avg);
}

function originCounts() {
  return Array.from(new Set(PROSPECTS.map((prospect) => prospect.origin))).map((origin) => {
    const players = PROSPECTS.filter((prospect) => prospect.origin === origin);
    return { origin, count: players.length, top: players.sort((a, b) => b.developmentScore - a.developmentScore)[0] };
  });
}

export function ProspectsPage() {
  const [searchParams] = useSearchParams();
  const requestedTeam = searchParams.get("team") || "PIT";
  const topProspects = [...PROSPECTS].sort((a, b) => b.developmentScore - a.developmentScore).slice(0, 5);
  const trend = topProspects.map((prospect) => ({ label: prospect.orgAbbr, value: prospect.developmentScore }));
  const pipelineCounts = orgPipelineCounts();

  return (
    <PageShell>
      <section className="surface-primary panel-glow overflow-hidden">
        <div className="grid grid-cols-1 gap-px bg-white/8 lg:grid-cols-[1.618fr_1fr]">
          <div className="bg-[#080d16] p-4 sm:p-5">
            <div className="mb-label text-cyan-200">Minor league intelligence</div>
            <h1 className="mb-title mt-3 max-w-4xl text-[clamp(3rem,7vw,7rem)] text-white">
              Future value, tracked like current performance.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-400">
              Moneyballr now connects prospects to MLB context through affiliate mapping, level-adjusted production, development timelines, and pipeline scoring.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {["AAA", "AA", "High-A", "Single-A"].map((level) => (
                <span key={level} className="border border-white/10 bg-white/[0.035] px-3 py-1.5 font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.16em] text-slate-300">
                  {level}
                </span>
              ))}
            </div>
          </div>
          <div className="bg-[#0a101a] p-4 sm:p-5">
            <div className="mb-label text-emerald-300">Top development signal</div>
            <div className="mt-4 space-y-3">
              {topProspects.slice(0, 3).map((prospect, index) => (
                <Link
                  key={prospect.id}
                  to={`/minor-leagues/players/${prospect.id}`}
                  className="grid grid-cols-[2rem_1fr_auto] items-center gap-3 border border-white/8 bg-white/[0.025] p-3 transition hover:border-emerald-300/25"
                >
                  <div className="font-['Bebas_Neue'] text-3xl leading-none text-slate-500">{index + 1}</div>
                  <div className="min-w-0">
                    <div className="truncate font-['Barlow_Condensed'] text-xl font-semibold uppercase tracking-[0.08em] text-white">{prospect.name}</div>
                    <div className="mb-label mt-1 text-[8px]">{prospect.orgAbbr} · {prospect.level} · ETA {prospect.eta}</div>
                  </div>
                  <div className="font-['Bebas_Neue'] text-3xl leading-none tracking-[0.06em] text-emerald-300">{prospect.developmentScore}</div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mb-section grid grid-cols-2 gap-px bg-white/8 md:grid-cols-4">
        {[
          ["Top Prospects", "/minor-leagues/top-prospects", `${PROSPECTS.length} tracked`],
          ["Prospect Leaders", "/minor-leagues/leaders", `${milbLeaderboard("Dev Score").length} ranked`],
          ["Recent Moves", "/minor-leagues/transactions", "movement wire"],
          ["Near Ready", "/minor-leagues/leaders", `${nearMlbReady().length} callup watch`],
        ].map(([label, href, meta]) => (
          <Link key={label} to={href} className="group bg-[#080d16] p-4 transition hover:bg-[#0b1421]">
            <div className="mb-label text-cyan-200">{meta}</div>
            <div className="mt-2 font-['Barlow_Condensed'] text-2xl font-semibold uppercase tracking-[0.08em] text-white">{label}</div>
            <div className="mt-3 h-px w-10 bg-emerald-300/40 transition group-hover:w-16" />
          </Link>
        ))}
      </section>

      <section className="mb-section surface-strip p-4">
        <div className="mb-label text-cyan-200">Browse by level</div>
        <div className="mt-3 flex flex-wrap gap-2">
          {LEAGUE_LEVELS.map((level) => (
            <Link key={level} to={`/minor-leagues/levels/${level.toLowerCase().replace("single-a", "a")}`} className="border border-white/8 bg-white/[0.025] px-3 py-2 font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.16em] text-slate-300 transition hover:border-cyan-300/25 hover:text-white">
              {level}
            </Link>
          ))}
        </div>
      </section>

      <section className="mb-section grid grid-cols-1 gap-3 lg:grid-cols-[1.618fr_1fr]">
        <section className="surface-primary">
          <SectionHeader
            eyebrow="Top 100 style board"
            title="Prospect command hub"
            copy="Filter by organization, level, position, and scouting/development tags without losing the dense Moneyballr hierarchy."
          />
          <ProspectSearch prospects={PROSPECTS} />
        </section>
        <div className="space-y-3">
          <AreaTrendChart eyebrow="Pipeline score" title="Top org signal" points={pipelineCounts.map((item) => ({ label: item.org, value: item.avg }))} valueLabel="avg" />
          <section className="surface-secondary p-4">
            <div className="mb-label text-cyan-200">Recent moves feed</div>
            <div className="mt-3 space-y-3">
              {recentMoves.map((move) => (
                <div key={move.label} className="border-t border-white/8 pt-3">
                  <div className={`font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.16em] ${move.tone}`}>{move.label}</div>
                  <p className="mt-2 text-sm leading-6 text-slate-400">{move.text}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </section>

      <section className="mb-section grid grid-cols-1 gap-3 lg:grid-cols-3">
        <section className="surface-secondary p-4 lg:col-span-2">
          <div className="mb-label text-emerald-300">Trending prospects</div>
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
            {trendingProspects().map((prospect) => <ProspectCard key={prospect.id} prospect={prospect} compact />)}
          </div>
        </section>
        <section className="surface-secondary p-4">
          <div className="mb-label text-yellow-200">Hidden gems</div>
          <div className="mt-4 space-y-2">
            {hiddenGems().map((prospect) => (
              <Link key={prospect.id} to={`/minor-leagues/players/${prospect.id}`} className="flex items-center justify-between gap-3 border border-white/8 bg-white/[0.025] p-3 transition hover:border-yellow-200/25">
                <div>
                  <div className="font-['Barlow_Condensed'] text-lg font-semibold uppercase tracking-[0.08em] text-white">{prospect.name}</div>
                  <div className="mb-label mt-1 text-[8px]">{prospect.orgAbbr} · {prospect.level}</div>
                </div>
                <div className="font-['Bebas_Neue'] text-3xl text-yellow-100">{prospect.developmentScore}</div>
              </Link>
            ))}
          </div>
        </section>
      </section>

      <section className="mb-section grid grid-cols-1 gap-3 lg:grid-cols-[1fr_1.618fr]">
        <section className="surface-secondary p-4">
          <div className="flex items-center gap-2">
            <Globe2 className="h-4 w-4 text-cyan-200" />
            <div className="mb-label text-cyan-200">International pipeline</div>
          </div>
          <div className="mt-4 space-y-3">
            {originCounts().map((item) => (
              <div key={item.origin} className="border-t border-white/8 pt-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="font-['Barlow_Condensed'] text-xl font-semibold uppercase tracking-[0.08em] text-white">{item.origin}</div>
                  <div className="font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.16em] text-cyan-200">{item.count} tracked</div>
                </div>
                <div className="mt-1 text-sm text-slate-500">Top tracked player: {item.top.name}</div>
              </div>
            ))}
          </div>
        </section>
        <FarmSystemPanel orgAbbr={requestedTeam} />
      </section>

      <section className="mb-section surface-strip p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="mb-label text-emerald-300">Development engine</div>
            <div className="mt-2 flex items-center gap-2 text-sm text-slate-400">
              <Sparkles className="h-4 w-4 text-emerald-300" />
              Adjusted stats use level translation factors so Single-A outliers do not overpower MLB-ready AAA signals.
            </div>
          </div>
          <Link to="/leaderboards" className="inline-flex items-center gap-2 font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.16em] text-emerald-300">
            Compare with MLB leaders
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </section>
    </PageShell>
  );
}

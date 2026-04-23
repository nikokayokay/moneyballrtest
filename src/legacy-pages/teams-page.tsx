import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { AreaTrendChart } from "@/src/components/charts/AreaTrendChart";
import { PageShell, SectionHeader } from "@/src/components/layout/PageShell";
import { FarmSystemPanel } from "@/src/components/milb/FarmSystemPanel";
import { FARM_SYSTEMS, farmSystemScore, orgName } from "@/src/data/milb";
import { fetchRosterDirectory, type PlayerSearchItem } from "@/src/lib/mlb";

const teamMeta: Record<string, { market: string; note: string }> = {
  NYY: { market: "New York", note: "Power and pressure baseline" },
  LAD: { market: "Los Angeles", note: "Depth and run prevention model" },
  ATL: { market: "Atlanta", note: "Contact damage engine" },
  HOU: { market: "Houston", note: "Process-first contender profile" },
  CIN: { market: "Cincinnati", note: "Young-hit tool watch" },
  PIT: { market: "Pittsburgh", note: "Prospect acceleration board" },
};

function teamLogoUrl(teamId: number | null) {
  return teamId ? `https://www.mlbstatic.com/team-logos/${teamId}.svg` : null;
}

export function TeamsPage() {
  const rosterQuery = useQuery({
    queryKey: ["roster-directory"],
    queryFn: fetchRosterDirectory,
    staleTime: 10 * 60_000,
  });
  type TeamBucket = {
    abbr: string;
    name: string;
    id: number | null;
    count: number;
    players: PlayerSearchItem[];
  };

  const teams = Object.values((rosterQuery.data || []).reduce<Record<string, TeamBucket>>((acc, player) => {
    const key = player.teamAbbr || player.team;
    acc[key] ||= { abbr: key, name: player.team, id: player.teamId, count: 0, players: [] };
    const bucket = acc[key];
    if (!bucket.id && player.teamId) bucket.id = player.teamId;
    bucket.count += 1;
    bucket.players.push(player);
    return acc;
  }, {})).sort((a, b) => a.abbr.localeCompare(b.abbr));
  const heartbeat = teams.slice(0, 8).map((team, index) => ({
    label: team.abbr,
    value: 3.8 + ((team.count % 9) * 0.38) + (index % 3) * 0.22,
  }));

  return (
    <PageShell>
      <section className="surface-primary">
        <SectionHeader
          eyebrow="Teams"
          title="Roster command board"
          copy="A scalable team surface that groups active rosters and opens directly into player-level analytics."
        />
        <div className="grid grid-cols-1 gap-px bg-white/8 md:grid-cols-2 xl:grid-cols-3">
          {teams.map((team) => (
            <section key={team.abbr} className="bg-[#090f19] p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 gap-4">
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center border border-white/8 bg-white/[0.035] p-3">
                    {teamLogoUrl(team.id) ? (
                      <img
                        src={teamLogoUrl(team.id) || ""}
                        alt={`${team.name} logo`}
                        className="h-full w-full object-contain"
                        loading="lazy"
                      />
                    ) : (
                      <div className="font-['Bebas_Neue'] text-4xl tracking-[0.08em] text-slate-500">{team.abbr}</div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="mb-label">{teamMeta[team.abbr]?.market || team.name}</div>
                    <div className="mb-title mt-2 text-[clamp(2.4rem,4vw,4rem)] text-white">{team.abbr}</div>
                    <p className="mt-2 text-sm leading-6 text-slate-500">{teamMeta[team.abbr]?.note || "Active roster profile and team context."}</p>
                  </div>
                </div>
                <div className="border border-white/8 bg-white/[0.03] px-3 py-2 text-right">
                  <div className="font-['Bebas_Neue'] text-3xl leading-none tracking-[0.06em] text-emerald-300">{FARM_SYSTEMS[team.abbr] ? farmSystemScore(team.abbr) : team.count}</div>
                  <div className="mb-label mt-1 text-[8px]">{FARM_SYSTEMS[team.abbr] ? "farm" : "players"}</div>
                </div>
              </div>
              <div className="mt-4 space-y-2">
                {team.players.slice(0, 3).map((player) => (
                  <Link key={player.playerId} to={`/player/${player.playerId}`} className="grid grid-cols-[2.5rem_1fr_auto] items-center gap-3 border-t border-white/8 pt-2 transition hover:border-cyan-300/20">
                    <img src={player.headshotUrl} alt={player.fullName} className="player-headshot aspect-square w-full bg-slate-900" loading="lazy" />
                    <div className="truncate font-['Barlow_Condensed'] text-lg font-semibold uppercase tracking-[0.06em] text-white">{player.fullName}</div>
                    <div className="text-xs text-slate-500">{player.position}</div>
                  </Link>
                ))}
              </div>
              {FARM_SYSTEMS[team.abbr] ? (
                <Link to={`/minor-leagues?team=${team.abbr}`} className="mt-3 inline-flex items-center font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.16em] text-emerald-300 transition hover:text-emerald-100">
                  Open farm system
                </Link>
              ) : null}
            </section>
          ))}
        </div>
      </section>
      <section className="mb-section surface-primary">
        <SectionHeader
          eyebrow="Farm systems"
          title="Development pipeline by organization"
          copy="Mapped affiliates render AAA through Single-A, with tracked prospects translated through the same development scoring layer."
        />
        <div className="grid grid-cols-1 gap-3 p-3 xl:grid-cols-2">
          {Object.keys(FARM_SYSTEMS).map((orgAbbr) => (
            <FarmSystemPanel key={orgAbbr} orgAbbr={orgAbbr} teamName={orgName(orgAbbr)} compact />
          ))}
        </div>
      </section>
      <section className="mb-section weighted-grid">
        <AreaTrendChart eyebrow="Team heartbeat" title="Rising club signal" points={heartbeat} valueLabel="form" />
        <section className="surface-secondary p-4">
          <div className="mb-label">Team style utility</div>
          <div className="mt-3 space-y-3 text-sm leading-6 text-slate-300">
            <p><span className="text-emerald-300">Power-heavy</span> clubs show higher recent roster impact and top-end hitter density.</p>
            <p><span className="text-cyan-200">Run prevention</span> clubs will pull from pitching trend feeds as staff data expands.</p>
            <p><span className="text-yellow-200">Top-heavy</span> clubs surface when the first three roster signals dominate team context.</p>
          </div>
        </section>
      </section>
    </PageShell>
  );
}

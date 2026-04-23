import { AreaTrendChart, type AreaTrendPoint } from "@/src/components/charts/AreaTrendChart";
import type { HomePerformer } from "@/src/data/home-discovery";
import type { ValidatedStandingTeam } from "@/lib/data-validator";

function shortName(name: string) {
  const parts = name.split(" ");
  return parts.length > 1 ? `${parts[0][0]}. ${parts.slice(-1)[0]}` : name;
}

function performerPoints(performers: HomePerformer[]): AreaTrendPoint[] {
  return performers
    .slice(0, 12)
    .reverse()
    .map((player) => ({
      label: shortName(player.name),
      value: player.impactScore,
    }));
}

function teamSpreadPoints(teams: ValidatedStandingTeam[]): AreaTrendPoint[] {
  return teams
    .slice()
    .sort((a, b) => (a.wins - a.losses) - (b.wins - b.losses))
    .slice(-12)
    .map((team) => ({
      label: team.abbreviation,
      value: team.wins - team.losses,
    }));
}

export function HomeAnalyticsGraphs({
  performers,
  standings,
  sourceLabel,
}: {
  performers: HomePerformer[];
  standings: ValidatedStandingTeam[];
  sourceLabel?: string;
}) {
  const performerTrend = performerPoints(performers);
  const teamTrend = teamSpreadPoints(standings);

  return (
    <section className="rounded-[32px] border border-white/10 bg-[#070d16] p-[20px]">
      <div className="flex flex-wrap items-end justify-between gap-[20px]">
        <div>
          <div className="font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.18em] text-cyan-200">Signal graphs</div>
          <h2 className="mt-[8px] font-['Bebas_Neue'] text-[32px] leading-none tracking-[0.06em] text-white">Live context curves</h2>
        </div>
        <div className="font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.16em] text-slate-500">
          {sourceLabel || "Official MLB data"}
        </div>
      </div>

      <div className="mt-[20px] grid grid-cols-1 gap-[20px] lg:grid-cols-2">
        <AreaTrendChart
          eyebrow="Performer impact"
          title="Top signal curve"
          points={performerTrend}
          valueLabel="impact"
          className="rounded-[20px] border border-white/8 bg-white/[0.025] p-[20px]"
        />
        <AreaTrendChart
          eyebrow="Standings pulse"
          title="Club spread curve"
          points={teamTrend}
          valueLabel="W-L"
          className="rounded-[20px] border border-white/8 bg-white/[0.025] p-[20px]"
        />
      </div>
    </section>
  );
}

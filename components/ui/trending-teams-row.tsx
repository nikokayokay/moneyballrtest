import { motion } from "framer-motion";
import type { ValidatedStandingTeam } from "@/lib/data-validator";

function Sparkline({ values }: { values: number[] }) {
  const max = Math.max(...values);
  const min = Math.min(...values);
  const points = values.map((value, index) => {
    const x = (index / Math.max(1, values.length - 1)) * 100;
    const y = 26 - ((value - min) / Math.max(1, max - min)) * 22;
    return `${x},${y}`;
  }).join(" ");
  return (
    <svg viewBox="0 0 100 30" className="h-8 w-24" preserveAspectRatio="none">
      <polyline points={points} fill="none" stroke="#67e8f9" strokeWidth="2.2" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

function sparklineSeed(team: ValidatedStandingTeam) {
  const lastTenWins = Number(team.lastTen.split("-")[0]) || 5;
  const streakValue = Number(team.streak.slice(1)) || 1;
  const direction = team.streak.startsWith("W") ? 1 : -1;
  return [4, 5, lastTenWins, lastTenWins + direction, lastTenWins + direction + streakValue].map((value) => Math.max(1, value));
}

export function TrendingTeamsRow({ teams, isUpdating = false }: { teams: ValidatedStandingTeam[]; isUpdating?: boolean }) {
  const sortedTeams = teams
    .slice()
    .sort((a, b) => (b.wins - b.losses) - (a.wins - a.losses))
    .slice(0, 10);

  return (
    <section className="rounded-[32px] border border-white/10 bg-[#070d16] p-[20px]">
      <div className="flex items-end justify-between gap-[20px]">
        <div>
          <div className="font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.18em] text-cyan-200">Trending teams</div>
          <h2 className="mt-[8px] font-['Bebas_Neue'] text-[32px] leading-none tracking-[0.06em] text-white">Club momentum row</h2>
        </div>
        {isUpdating ? <div className="font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.16em] text-cyan-200">Syncing standings</div> : null}
      </div>
      <div className="mt-[20px] flex gap-[20px] overflow-x-auto pb-[8px] scrollbar-thin">
        {sortedTeams.map((team) => (
          <motion.div
            key={team.teamId}
            whileHover={{ y: -3 }}
            className="w-[320px] shrink-0 rounded-[20px] border border-white/8 bg-white/[0.025] p-[12px]"
          >
            <div className="flex items-center justify-between gap-[12px]">
              <div className="flex items-center gap-[12px]">
                <img src={team.logoUrl} alt={`${team.teamName} logo`} className="h-[52px] w-[52px] object-contain" loading="lazy" />
                <div>
                  <div className="font-['Barlow_Condensed'] text-[20px] font-semibold uppercase tracking-[0.08em] text-white">{team.abbreviation}</div>
                  <div className="font-['JetBrains_Mono'] text-[9px] uppercase tracking-[0.14em] text-slate-500">{team.wins}-{team.losses} | GB {team.gamesBack}</div>
                </div>
              </div>
              <Sparkline values={sparklineSeed(team)} />
            </div>
            <div className="mt-[12px] flex items-center justify-between text-xs text-slate-400">
              <span>Last 10 {team.lastTen}</span>
              <span className={team.streak.startsWith("W") ? "text-emerald-300" : "text-rose-300"}>{team.streak}</span>
            </div>
          </motion.div>
        ))}
        {!sortedTeams.length ? <div className="rounded-[20px] border border-white/8 bg-white/[0.025] p-[20px] text-sm text-slate-500">Updating data...</div> : null}
      </div>
    </section>
  );
}

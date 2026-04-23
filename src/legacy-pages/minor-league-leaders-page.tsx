import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { PageShell, SectionHeader } from "@/src/components/layout/PageShell";
import { LEAGUE_LEVELS, milbLeaderboard, type MilbLeaderboardCategory, type MinorLeagueLevel } from "@/src/data/milb";

const categories: MilbLeaderboardCategory[] = ["Dev Score", "OPS", "AVG", "HR", "SB", "BB%", "K%", "ERA", "WHIP", "K/9"];

function formatValue(category: MilbLeaderboardCategory, value: number) {
  const actual = category === "ERA" || category === "WHIP" || (category === "K%" && value < 0) ? Math.abs(value) : value;
  if (category === "OPS" || category === "AVG" || category === "WHIP") return actual.toFixed(3).replace(/^0/, "");
  if (category === "ERA" || category === "K/9") return actual.toFixed(2);
  if (category.includes("%")) return `${actual.toFixed(1)}%`;
  return actual.toFixed(0);
}

export function MinorLeagueLeadersPage() {
  const [category, setCategory] = useState<MilbLeaderboardCategory>("Dev Score");
  const [level, setLevel] = useState<MinorLeagueLevel | "ALL">("ALL");
  const rows = useMemo(() => milbLeaderboard(category, level), [category, level]);

  return (
    <PageShell>
      <section className="surface-primary">
        <SectionHeader
          eyebrow="MiLB leaderboards"
          title="Level-adjusted prospect leaders"
          copy="Leaderboards are built for development context: filter by level, compare adjusted stats, and jump into profiles without a table-dump experience."
        />
        <div className="grid grid-cols-1 gap-px bg-white/8 lg:grid-cols-[1fr_1.618fr]">
          <div className="bg-[#080d16] p-4">
            <div className="mb-label text-cyan-200">Category</div>
            <div className="mt-3 flex flex-wrap gap-2">
              {categories.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setCategory(item)}
                  className={`border px-3 py-2 font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.16em] transition ${
                    category === item ? "border-emerald-300/30 bg-emerald-300/10 text-emerald-200" : "border-white/8 bg-white/[0.025] text-slate-500 hover:text-white"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
            <div className="mb-label mt-5 text-cyan-200">Level</div>
            <div className="mt-3 flex flex-wrap gap-2">
              {(["ALL", ...LEAGUE_LEVELS] as Array<MinorLeagueLevel | "ALL">).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setLevel(item)}
                  className={`border px-3 py-2 font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.16em] transition ${
                    level === item ? "border-cyan-300/30 bg-cyan-300/10 text-cyan-200" : "border-white/8 bg-white/[0.025] text-slate-500 hover:text-white"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
          <div className="bg-[#080d16]">
            {rows.map(({ prospect, value }, index) => (
              <Link
                key={prospect.id}
                to={`/minor-leagues/players/${prospect.id}`}
                className="grid grid-cols-[2.5rem_1fr_auto] items-center gap-4 border-b border-white/8 p-3 transition hover:bg-white/[0.035]"
              >
                <div className="font-['Bebas_Neue'] text-3xl leading-none text-slate-600">{index + 1}</div>
                <div className="min-w-0">
                  <div className="truncate font-['Barlow_Condensed'] text-xl font-semibold uppercase tracking-[0.08em] text-white">{prospect.name}</div>
                  <div className="mb-label mt-1 text-[8px]">{prospect.orgAbbr} · {prospect.level} · {prospect.position}</div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="font-['Bebas_Neue'] text-4xl leading-none tracking-[0.06em] text-emerald-300">{formatValue(category, value)}</div>
                  <ArrowUpRight className="h-4 w-4 text-slate-600" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </PageShell>
  );
}

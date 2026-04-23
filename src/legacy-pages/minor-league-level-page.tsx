import { Link, Navigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { ProspectCard } from "@/src/components/milb/ProspectCard";
import { PageShell, SectionHeader } from "@/src/components/layout/PageShell";
import { LEAGUE_LEVELS, PROSPECTS, type MinorLeagueLevel } from "@/src/data/milb";

function parseLevel(input?: string): MinorLeagueLevel | null {
  const normalized = (input || "").toLowerCase();
  if (normalized === "aaa") return "AAA";
  if (normalized === "aa") return "AA";
  if (normalized === "high-a" || normalized === "higha") return "High-A";
  if (normalized === "single-a" || normalized === "a") return "Single-A";
  return null;
}

export function MinorLeagueLevelPage() {
  const { level } = useParams();
  const parsed = parseLevel(level);
  if (!parsed) return <Navigate to="/minor-leagues" replace />;
  const prospects = PROSPECTS.filter((prospect) => prospect.level === parsed).sort((a, b) => b.developmentScore - a.developmentScore);

  return (
    <PageShell>
      <Link to="/minor-leagues" className="mb-3 inline-flex items-center gap-2 font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.16em] text-slate-400 transition hover:text-emerald-300">
        <ArrowLeft className="h-3.5 w-3.5" />
        MiLB hub
      </Link>
      <section className="surface-primary">
        <SectionHeader
          eyebrow="By level"
          title={`${parsed} development board`}
          copy="Level pages isolate context so AAA readiness, Double-A tests, High-A growth, and Single-A projection do not get flattened into one generic ranking."
        />
        <div className="grid grid-cols-1 gap-px bg-white/8 md:grid-cols-2 xl:grid-cols-3">
          {prospects.map((prospect) => (
            <div key={prospect.id} className="bg-[#080d16]">
              <ProspectCard prospect={prospect} />
            </div>
          ))}
          {!prospects.length ? <div className="bg-[#080d16] p-6 text-sm text-slate-500">No tracked prospects at this level yet.</div> : null}
        </div>
      </section>
      <section className="mb-section surface-strip p-4">
        <div className="mb-label text-cyan-200">Jump levels</div>
        <div className="mt-3 flex flex-wrap gap-2">
          {LEAGUE_LEVELS.map((item) => (
            <Link key={item} to={`/minor-leagues/levels/${item.toLowerCase().replace("single-a", "a")}`} className="border border-white/8 bg-white/[0.025] px-3 py-2 font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.16em] text-slate-300 transition hover:border-cyan-300/25 hover:text-white">
              {item}
            </Link>
          ))}
        </div>
      </section>
    </PageShell>
  );
}

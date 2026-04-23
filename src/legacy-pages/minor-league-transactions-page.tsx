import { Link } from "react-router-dom";
import { ArrowUpRight, GitBranch } from "lucide-react";
import { PageShell, SectionHeader } from "@/src/components/layout/PageShell";
import { MILB_TRANSACTIONS } from "@/src/data/milb";

export function MinorLeagueTransactionsPage() {
  return (
    <PageShell>
      <section className="surface-primary">
        <SectionHeader
          eyebrow="Transactions"
          title="Prospect movement wire"
          copy="Promotions, demotions, injuries, callups, assignments, and rehab movement are treated as development events, not footnotes."
        />
        <div className="divide-y divide-white/8">
          {MILB_TRANSACTIONS.map((move) => (
            <Link
              key={move.id}
              to={`/minor-leagues/players/${move.prospectId}`}
              className="grid grid-cols-1 gap-4 p-4 transition hover:bg-white/[0.025] md:grid-cols-[9rem_1fr_auto]"
            >
              <div>
                <div className="mb-label text-cyan-200">{move.date}</div>
                <div className="mt-2 inline-flex items-center gap-2 border border-white/8 bg-white/[0.03] px-2.5 py-1 font-['JetBrains_Mono'] text-[9px] uppercase tracking-[0.14em] text-slate-300">
                  <GitBranch className="h-3.5 w-3.5 text-emerald-300" />
                  {move.type}
                </div>
              </div>
              <div>
                <div className="font-['Barlow_Condensed'] text-2xl font-semibold uppercase tracking-[0.08em] text-white">{move.playerName}</div>
                <p className="mt-2 text-sm leading-6 text-slate-400">{move.note}</p>
                <div className="mb-label mt-2 text-[8px]">{move.orgAbbr} · {move.from || "Assignment"} to {move.to || "Tracked roster"}</div>
              </div>
              <ArrowUpRight className="hidden h-4 w-4 text-slate-600 md:block" />
            </Link>
          ))}
        </div>
      </section>
    </PageShell>
  );
}

import { Link } from "react-router-dom";
import { PageShell, SectionHeader } from "@/src/components/layout/PageShell";
import { PlayerSearch } from "@/src/components/player-search";

const compareExamples = [
  { label: "Aaron Judge", id: 592450, note: "Complete hitter page with live advanced metrics and every season game." },
  { label: "Sal Stewart", id: 701398, note: "Partial-sample hitter page with complete logs and clear sample labels." },
  { label: "Konnor Griffin", id: 804606, note: "Limited-data page that still renders in the same premium layout." },
];

export function DashboardPage() {
  return (
    <PageShell>
      <section className="surface-primary">
        <SectionHeader
          eyebrow="Live dashboard"
          title="Command-center profile launcher"
          copy="A dense entry point for jumping into active player profiles, model reads, and current-form checks."
        />
        <div className="p-4 sm:p-5">
          <div className="max-w-3xl">
            <PlayerSearch autoFocus />
          </div>
        </div>
      </section>

      <section className="mb-section grid gap-3 lg:grid-cols-3">
        {compareExamples.map((player) => (
          <Link key={player.id} to={`/player/${player.id}`} className="surface-secondary p-4 transition hover:-translate-y-0.5 hover:border-emerald-400/20">
            <div className="mb-title text-4xl text-white">{player.label}</div>
            <p className="mt-4 text-sm leading-7 text-slate-400">{player.note}</p>
            <div className="mb-label mt-5 text-emerald-300">Open Profile</div>
          </Link>
        ))}
      </section>
    </PageShell>
  );
}

import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Building2, RefreshCw } from "lucide-react";
import { fetchAllMlbOrganizations } from "@/lib/milb-fetchers";
import { PageShell, SectionHeader } from "@/src/components/layout/PageShell";

export function MinorLeagueOrganizationsPage() {
  const orgQuery = useQuery({
    queryKey: ["milb", "official-organizations"],
    queryFn: () => fetchAllMlbOrganizations(),
    staleTime: 30 * 60_000,
    refetchInterval: 30 * 60_000,
  });
  const orgs = orgQuery.data || [];

  return (
    <PageShell>
      <section className="surface-primary">
        <SectionHeader
          eyebrow="Organizations"
          title="Farm system command center"
          copy="Every MLB organization gets a structured official affiliate ladder, active roster feed, validation layer, movement tracking, and prospect scoring path."
        />
        {orgQuery.isLoading ? (
          <div className="mb-4 flex items-center gap-3 border border-white/8 bg-white/[0.025] p-4 text-sm text-slate-400">
            <RefreshCw className="h-4 w-4 animate-spin text-cyan-200" />
            Loading official MLB organizations...
          </div>
        ) : null}
        <div className="grid grid-cols-1 gap-px bg-white/8 md:grid-cols-2 xl:grid-cols-3">
          {orgs.map((org, index) => (
            <Link key={org.id} to={`/minor-leagues/organizations/${org.abbr}`} className="group bg-[#080d16] p-4 transition hover:bg-[#0b1421]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="mb-label text-cyan-200">#{index + 1} pipeline</div>
                  <div className="mb-title mt-2 text-[clamp(2.2rem,3vw,3.4rem)] text-white">{org.abbr}</div>
                  <div className="mt-2 text-sm text-slate-400">{org.name}</div>
                </div>
                <div className="text-right">
                  <div className="font-['Bebas_Neue'] text-5xl leading-none tracking-[0.06em] text-emerald-300">4</div>
                  <div className="mb-label mt-1 text-[8px]">levels</div>
                </div>
              </div>
              <p className="mt-4 text-sm leading-6 text-slate-500">
                Open the live farm ladder for official affiliates, current active rosters, IDs, stat lines, movement detection, and validation.
              </p>
              <div className="mt-4 flex items-center justify-between border-t border-white/8 pt-3">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Building2 className="h-4 w-4 text-cyan-200" />
                  official MiLB affiliate map
                </div>
                <ArrowRight className="h-4 w-4 text-slate-600 transition group-hover:text-emerald-300" />
              </div>
            </Link>
          ))}
        </div>
      </section>
    </PageShell>
  );
}

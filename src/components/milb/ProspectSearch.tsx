import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import type { MinorLeagueLevel, Prospect } from "@/src/data/milb";
import { LEAGUE_LEVELS, PROSPECTS } from "@/src/data/milb";
import { ProspectCard } from "@/src/components/milb/ProspectCard";

type ProspectFilters = {
  team: string;
  level: string;
  position: string;
  query: string;
};

export function filterProspects(prospects: Prospect[], filters: ProspectFilters) {
  const query = filters.query.trim().toLowerCase();
  return prospects.filter((prospect) => {
    const matchesQuery = !query || [prospect.name, prospect.organization, prospect.orgAbbr, prospect.position, prospect.tags.join(" ")]
      .join(" ")
      .toLowerCase()
      .includes(query);
    const matchesTeam = filters.team === "ALL" || prospect.orgAbbr === filters.team;
    const matchesLevel = filters.level === "ALL" || prospect.level === filters.level;
    const matchesPosition = filters.position === "ALL" || prospect.position.includes(filters.position);
    return matchesQuery && matchesTeam && matchesLevel && matchesPosition;
  });
}

export function ProspectSearch({ prospects = PROSPECTS }: { prospects?: Prospect[] }) {
  const [filters, setFilters] = useState<ProspectFilters>({ team: "ALL", level: "ALL", position: "ALL", query: "" });
  const teams = useMemo(() => Array.from(new Set(prospects.map((prospect) => prospect.orgAbbr))).sort(), [prospects]);
  const positions = useMemo(() => Array.from(new Set(prospects.flatMap((prospect) => prospect.position.split("/")))).sort(), [prospects]);
  const results = useMemo(() => filterProspects(prospects, filters).sort((a, b) => b.developmentScore - a.developmentScore), [prospects, filters]);

  return (
    <section className="surface-primary">
      <div className="grid grid-cols-1 gap-px bg-white/8 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="bg-[#080d16] p-4">
          <div className="mb-label text-cyan-200">Find prospects</div>
          <div className="mt-3 flex items-center gap-3 border border-white/10 bg-[#050914] px-3 py-2">
            <Search className="h-4 w-4 text-emerald-300" />
            <input
              value={filters.query}
              onChange={(event) => setFilters((current) => ({ ...current, query: event.target.value }))}
              placeholder="Search name, org, tag, position..."
              className="w-full bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-600"
            />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-px bg-white/8">
          <FilterSelect label="Team" value={filters.team} values={["ALL", ...teams]} onChange={(value) => setFilters((current) => ({ ...current, team: value }))} />
          <FilterSelect label="Level" value={filters.level} values={["ALL", ...LEAGUE_LEVELS]} onChange={(value) => setFilters((current) => ({ ...current, level: value as MinorLeagueLevel | "ALL" }))} />
          <FilterSelect label="Position" value={filters.position} values={["ALL", ...positions]} onChange={(value) => setFilters((current) => ({ ...current, position: value }))} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-px bg-white/8 md:grid-cols-2 xl:grid-cols-3">
        {results.map((prospect) => (
          <div key={prospect.id} className="bg-[#080d16]">
            <ProspectCard prospect={prospect} />
          </div>
        ))}
      </div>
      {!results.length ? (
        <div className="p-6 text-sm text-slate-500">No tracked prospects match those filters yet.</div>
      ) : null}
    </section>
  );
}

function FilterSelect({ label, value, values, onChange }: { label: string; value: string; values: string[]; onChange: (value: string) => void }) {
  return (
    <label className="bg-[#080d16] p-3">
      <div className="mb-label text-[8px]">{label}</div>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full bg-transparent font-['Barlow_Condensed'] text-lg font-semibold uppercase tracking-[0.08em] text-white outline-none"
      >
        {values.map((item) => (
          <option key={item} value={item} className="bg-[#080d16] text-white">
            {item}
          </option>
        ))}
      </select>
    </label>
  );
}

import { useMemo, useState } from "react";
import { GitCompare } from "lucide-react";
import { PageShell, SectionHeader } from "@/src/components/layout/PageShell";
import { ProspectCard } from "@/src/components/milb/ProspectCard";
import { PROSPECTS, ageContext, promotionWatch, prospectArchetype } from "@/src/data/milb";

export function MinorLeagueComparePage() {
  const [leftId, setLeftId] = useState(PROSPECTS[0]?.id || "");
  const [rightId, setRightId] = useState(PROSPECTS[1]?.id || "");
  const left = useMemo(() => PROSPECTS.find((prospect) => prospect.id === leftId) || PROSPECTS[0], [leftId]);
  const right = useMemo(() => PROSPECTS.find((prospect) => prospect.id === rightId) || PROSPECTS[1] || PROSPECTS[0], [rightId]);

  const rows = [
    ["Development score", left.developmentScore, right.developmentScore],
    ["Age", left.age, right.age],
    ["Level", left.level, right.level],
    ["Age context", ageContext(left).label, ageContext(right).label],
    ["Archetype", prospectArchetype(left), prospectArchetype(right)],
    ["Promotion status", promotionWatch(left), promotionWatch(right)],
    ["ETA", left.eta, right.eta],
  ];

  return (
    <PageShell>
      <section className="surface-primary">
        <SectionHeader
          eyebrow="Compare"
          title="Prospect comparison lab"
          copy="Compare prospects through age, level, role, trend, projection, and adjusted performance rather than raw stat lines alone."
        />
        <div className="grid grid-cols-1 gap-px bg-white/8 lg:grid-cols-[1fr_auto_1fr]">
          <div className="bg-[#080d16] p-4">
            <ProspectPicker value={left.id} onChange={setLeftId} />
            <div className="mt-3"><ProspectCard prospect={left} /></div>
          </div>
          <div className="hidden items-center justify-center bg-[#080d16] px-3 lg:flex">
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-white/[0.035]">
              <GitCompare className="h-5 w-5 text-cyan-200" />
            </div>
          </div>
          <div className="bg-[#080d16] p-4">
            <ProspectPicker value={right.id} onChange={setRightId} />
            <div className="mt-3"><ProspectCard prospect={right} /></div>
          </div>
        </div>
        <div className="divide-y divide-white/8">
          {rows.map(([label, leftValue, rightValue]) => {
            const leftBetter = typeof leftValue === "number" && typeof rightValue === "number" && leftValue > rightValue;
            const rightBetter = typeof leftValue === "number" && typeof rightValue === "number" && rightValue > leftValue;
            return (
              <div key={label.toString()} className="grid grid-cols-[1fr_8rem_1fr] items-center gap-3 p-3">
                <div className={`text-right font-['Barlow_Condensed'] text-xl font-semibold uppercase tracking-[0.08em] ${leftBetter ? "text-emerald-300" : "text-white"}`}>{leftValue}</div>
                <div className="mb-label text-center text-[8px]">{label}</div>
                <div className={`font-['Barlow_Condensed'] text-xl font-semibold uppercase tracking-[0.08em] ${rightBetter ? "text-emerald-300" : "text-white"}`}>{rightValue}</div>
              </div>
            );
          })}
        </div>
      </section>
    </PageShell>
  );
}

function ProspectPicker({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="w-full border border-white/8 bg-[#050914] px-3 py-2 font-['Barlow_Condensed'] text-lg font-semibold uppercase tracking-[0.08em] text-white outline-none"
    >
      {PROSPECTS.map((prospect) => (
        <option key={prospect.id} value={prospect.id} className="bg-[#080d16] text-white">
          {prospect.name} · {prospect.orgAbbr}
        </option>
      ))}
    </select>
  );
}

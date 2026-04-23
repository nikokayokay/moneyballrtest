import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, Database, RefreshCw } from "lucide-react";
import { fetchAllMlbOrganizations, fetchOrganizationPipeline } from "@/lib/milb-fetchers";
import { validateIdentityResolution } from "@/lib/player-identity-map";
import { mergeStatObjects } from "@/lib/data-reconciler";
import { suggestNavigation } from "@/lib/intent-navigation";
import { alertHistory, createAlert } from "@/lib/alerts";
import { storeDataVersion } from "@/lib/data-versioning";
import { loadModelWeights, tuneSignalScore } from "@/lib/model-tuning";
import { checkSourceHealth } from "@/lib/source-health";
import { PageShell, SectionHeader } from "@/src/components/layout/PageShell";

export function DataHealthPage() {
  const orgQuery = useQuery({
    queryKey: ["admin", "data-health", "orgs"],
    queryFn: () => fetchAllMlbOrganizations(),
    staleTime: 30 * 60_000,
  });
  const sampleOrg = orgQuery.data?.find((org) => org.abbr === "NYY") || orgQuery.data?.[0];
  const pipelineQuery = useQuery({
    queryKey: ["admin", "data-health", "pipeline", sampleOrg?.abbr],
    queryFn: () => fetchOrganizationPipeline(sampleOrg?.abbr || "NYY", { rosterLimit: 24 }),
    enabled: Boolean(sampleOrg?.abbr),
    staleTime: 5 * 60_000,
  });
  const players = pipelineQuery.data?.affiliates.flatMap((affiliate) => affiliate.players) || [];
  const identityReport = useMemo(() => validateIdentityResolution(players.map((player) => ({
    source: "milb" as const,
    id: player.id,
    name: player.name,
    team: player.orgAbbr,
  }))), [players]);
  const reconcileSample = useMemo(() => mergeStatObjects({
    mlbam: { data: { ops: 0.815, hr: 8 }, timestamp: new Date().toISOString(), confidence: 0.92 },
    derived: { data: { ops: 0.812, hr: 8 }, timestamp: new Date().toISOString(), confidence: 0.74 },
  }), []);
  const navSuggestions = suggestNavigation("Yankees prospects");
  const sourceQuery = useQuery({
    queryKey: ["admin", "source-health"],
    queryFn: () => Promise.all([
      checkSourceHealth("MLB Stats API", "https://statsapi.mlb.com/api/v1/sports"),
      checkSourceHealth("MLB Teams", "https://statsapi.mlb.com/api/v1/teams?sportId=1"),
    ]),
    staleTime: 120_000,
  });
  const modelWeights = loadModelWeights();
  const tunedSample = tuneSignalScore({ recency: 86, leverage: 74, baseline: 68, projection: 72 }, modelWeights);
  const versionSample = useMemo(() => storeDataVersion("admin-health-sample", { players: players.length }, "Data health inspection sample"), [players.length]);
  const alerts = useMemo(() => {
    if (!players.length) return alertHistory();
    createAlert({ type: "data-delay", title: "Data health inspected", detail: `${players.length} players validated in sample.` });
    return alertHistory();
  }, [players.length]);

  return (
    <PageShell>
      <section className="surface-primary">
        <SectionHeader
          eyebrow="Admin / data health"
          title="Source integrity console"
          copy="Identity resolution, affiliate validation, reconciliation conflicts, and smart navigation diagnostics in one inspection surface."
        />
        <div className="grid grid-cols-1 gap-3 p-4 lg:grid-cols-3">
          {[
            ["Official orgs", orgQuery.data?.length || 0, orgQuery.isLoading ? "loading" : "resolved"],
            ["Sample players", players.length, pipelineQuery.isLoading ? "loading" : "official roster"],
            ["Unresolved IDs", identityReport.unresolved.length, identityReport.ok ? "clean" : "needs review"],
          ].map(([label, value, meta]) => (
            <div key={label} className="border border-white/8 bg-[#080d16] p-4">
              <div className="mb-label text-cyan-200">{meta}</div>
              <div className="mt-2 font-['Bebas_Neue'] text-6xl leading-none text-white">{value}</div>
              <div className="mb-label mt-2">{label}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-section grid grid-cols-1 gap-3 lg:grid-cols-[1.618fr_1fr]">
        <section className="surface-secondary p-4">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-cyan-200" />
            <div className="mb-label text-cyan-200">Affiliate validation</div>
          </div>
          {pipelineQuery.isLoading ? (
            <div className="mt-4 flex items-center gap-2 text-sm text-slate-400">
              <RefreshCw className="h-4 w-4 animate-spin text-cyan-200" />
              Checking official affiliate and roster responses...
            </div>
          ) : null}
          <div className="mt-4 space-y-3">
            {(pipelineQuery.data?.validation.issues || []).map((issue) => (
              <div key={issue} className="flex items-start gap-3 border border-yellow-200/15 bg-yellow-200/8 p-3 text-sm text-yellow-100">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                {issue}
              </div>
            ))}
            {pipelineQuery.data?.validation.ok ? (
              <div className="flex items-center gap-3 border border-emerald-300/15 bg-emerald-300/8 p-3 text-sm text-emerald-100">
                <CheckCircle2 className="h-4 w-4" />
                {pipelineQuery.data.orgAbbr} passed affiliate count, population, and duplicate-ID checks.
              </div>
            ) : null}
          </div>
        </section>

        <section className="surface-secondary p-4">
          <div className="mb-label text-cyan-200">Identity mismatches</div>
          <div className="mt-4 space-y-2">
            {identityReport.unresolved.slice(0, 8).map((identity) => (
              <div key={identity.canonicalId} className="border border-white/8 bg-white/[0.025] p-3">
                <div className="font-['Barlow_Condensed'] text-xl font-semibold uppercase tracking-[0.08em] text-white">{identity.name}</div>
                <div className="mt-1 text-xs text-slate-500">Confidence {Math.round(identity.confidence * 100)}% · {identity.canonicalId}</div>
              </div>
            ))}
            {!identityReport.unresolved.length ? <div className="text-sm text-slate-500">No unresolved identities in the current inspection sample.</div> : null}
          </div>
        </section>
      </section>

      <section className="mb-section grid grid-cols-1 gap-3 lg:grid-cols-2">
        <section className="surface-secondary p-4">
          <div className="mb-label text-cyan-200">Reconciliation sample</div>
          <div className="mt-3 space-y-2">
            {Object.entries(reconcileSample).map(([field, value]) => (
              <div key={field} className="flex items-center justify-between border border-white/8 bg-white/[0.025] p-3">
                <div className="font-['Barlow_Condensed'] text-xl font-semibold uppercase tracking-[0.08em] text-white">{field}</div>
                <div className="text-right text-sm text-slate-400">{String(value.value)} · {value.source} · {value.conflict ? "conflict tracked" : "clean"}</div>
              </div>
            ))}
          </div>
        </section>
        <section className="surface-secondary p-4">
          <div className="mb-label text-cyan-200">Intent navigation debug</div>
          <div className="mt-3 space-y-2">
            {navSuggestions.map((suggestion) => (
              <div key={suggestion.href} className="flex items-center justify-between border border-white/8 bg-white/[0.025] p-3">
                <div>
                  <div className="font-['Barlow_Condensed'] text-xl font-semibold uppercase tracking-[0.08em] text-white">{suggestion.label}</div>
                  <div className="text-xs text-slate-500">{suggestion.href}</div>
                </div>
                <div className="font-['Bebas_Neue'] text-3xl text-emerald-300">{suggestion.score}</div>
              </div>
            ))}
          </div>
        </section>
      </section>

      <section className="mb-section grid grid-cols-1 gap-3 lg:grid-cols-3">
        <section className="surface-secondary p-4">
          <div className="mb-label text-cyan-200">Source health monitor</div>
          <div className="mt-3 space-y-2">
            {(sourceQuery.data || []).map((source) => (
              <div key={source.source} className="flex items-center justify-between border border-white/8 bg-white/[0.025] p-3">
                <div>
                  <div className="font-['Barlow_Condensed'] text-xl font-semibold uppercase tracking-[0.08em] text-white">{source.source}</div>
                  <div className="text-xs text-slate-500">{source.latencyMs}ms · {new Date(source.checkedAt).toLocaleTimeString()}</div>
                </div>
                <div className={source.ok ? "text-emerald-300" : "text-yellow-200"}>{source.ok ? "OK" : "DELAY"}</div>
              </div>
            ))}
            {sourceQuery.isLoading ? <div className="text-sm text-slate-500">Checking source uptime...</div> : null}
          </div>
        </section>
        <section className="surface-secondary p-4">
          <div className="mb-label text-cyan-200">Model tuning</div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {Object.entries(modelWeights).map(([key, value]) => (
              <div key={key} className="border border-white/8 bg-white/[0.025] p-3">
                <div className="mb-label text-[8px]">{key}</div>
                <div className="font-['Bebas_Neue'] text-4xl leading-none text-white">{Math.round(value * 100)}</div>
              </div>
            ))}
          </div>
          <div className="mt-3 border border-emerald-300/15 bg-emerald-300/8 p-3 text-sm text-emerald-100">
            Tuned sample signal: {tunedSample}
          </div>
        </section>
        <section className="surface-secondary p-4">
          <div className="mb-label text-cyan-200">Versions + alerts</div>
          <div className="mt-3 border border-white/8 bg-white/[0.025] p-3">
            <div className="font-['Barlow_Condensed'] text-xl font-semibold uppercase tracking-[0.08em] text-white">{versionSample.version}</div>
            <div className="mt-1 text-xs text-slate-500">{versionSample.note}</div>
          </div>
          <div className="mt-3 space-y-2">
            {alerts.slice(0, 3).map((alert) => (
              <div key={alert.id} className="border border-white/8 bg-white/[0.025] p-3">
                <div className="text-sm text-slate-300">{alert.title}</div>
                <div className="mt-1 text-xs text-slate-500">{alert.detail}</div>
              </div>
            ))}
          </div>
        </section>
      </section>
    </PageShell>
  );
}

import { Suspense, lazy, useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FeaturedComparison } from "@/components/ui/featured-comparison";
import { GlassCalendar } from "@/components/ui/glass-calendar";
import { HomeAnalyticsGraphs } from "@/components/ui/home-analytics-graphs";
import { HomeStatLeaders } from "@/components/ui/home-stat-leaders";
import { TopPerformers } from "@/components/ui/top-performers";
import { TrendingTeamsRow } from "@/components/ui/trending-teams-row";
import { DATA_REFRESH_INTERVALS, getStandings, getTopSignals, type SignalFilter } from "@/lib/data-engine";

const PlayerOriginGlobe = lazy(() => import("@/components/ui/player-origin-globe").then((module) => ({ default: module.PlayerOriginGlobe })));

function defaultGameDate() {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return date;
}

function GlobeFallback() {
  return (
    <section className="rounded-[2rem] border border-white/10 bg-[#070d16] p-4">
      <div className="font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.18em] text-cyan-200">Global performer map</div>
      <div className="mt-4 h-[420px] animate-pulse rounded-3xl bg-white/[0.035]" />
    </section>
  );
}

export function HomePage() {
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [selectedGameDate, setSelectedGameDate] = useState(defaultGameDate);
  const [signalType, setSignalType] = useState<SignalFilter["signalType"] | "all">("all");
  const [teamFilter, setTeamFilter] = useState("all");
  const [positionFilter, setPositionFilter] = useState("all");
  const [loadGlobe, setLoadGlobe] = useState(false);
  const globeRef = useRef<HTMLDivElement | null>(null);
  const performersQuery = useQuery({
    queryKey: ["moneyballr", "top-signals", selectedGameDate.toDateString(), signalType, teamFilter, positionFilter],
    queryFn: () => getTopSignals(selectedGameDate, {
      signalType: signalType === "all" ? undefined : signalType,
      team: teamFilter === "all" ? undefined : teamFilter,
      position: positionFilter === "all" ? undefined : positionFilter,
    }),
    staleTime: DATA_REFRESH_INTERVALS.liveGames,
    refetchInterval: DATA_REFRESH_INTERVALS.liveGames,
    refetchIntervalInBackground: true,
  });
  const standingsQuery = useQuery({
    queryKey: ["moneyballr", "standings"],
    queryFn: getStandings,
    staleTime: DATA_REFRESH_INTERVALS.standings,
    refetchInterval: DATA_REFRESH_INTERVALS.standings,
    refetchIntervalInBackground: true,
  });
  const performers = performersQuery.data?.performers || [];
  const filteredPerformers = useMemo(
    () => selectedCountry ? performers.filter((player) => player.country === selectedCountry) : performers,
    [performers, selectedCountry],
  );

  useEffect(() => {
    const target = globeRef.current;
    if (!target || loadGlobe) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setLoadGlobe(true);
    }, { rootMargin: "360px" });
    observer.observe(target);
    return () => observer.disconnect();
  }, [loadGlobe]);

  return (
    <main className="mb-shell space-y-[32px] py-[20px] lg:py-[32px]">
      <TopPerformers
        performers={filteredPerformers}
        selectedCountry={selectedCountry}
        onClearCountry={() => setSelectedCountry(null)}
        isUpdating={performersQuery.isLoading || performersQuery.isFetching}
        sourceLabel={performersQuery.data?.label}
        dateControl={(
          <GlassCalendar
            selectedDate={selectedGameDate}
            onDateSelect={(date) => {
              setSelectedCountry(null);
              setSelectedGameDate(date);
            }}
          />
        )}
        signalType={signalType}
        onSignalTypeChange={setSignalType}
        teamFilter={teamFilter}
        onTeamFilterChange={setTeamFilter}
        positionFilter={positionFilter}
        onPositionFilterChange={setPositionFilter}
      />

      <div ref={globeRef}>
        {loadGlobe ? (
          <Suspense fallback={<GlobeFallback />}>
            <PlayerOriginGlobe
              performers={performers}
              selectedCountry={selectedCountry}
              onSelectCountry={setSelectedCountry}
            />
          </Suspense>
        ) : (
          <GlobeFallback />
        )}
      </div>

      <TrendingTeamsRow teams={standingsQuery.data || []} isUpdating={standingsQuery.isLoading || standingsQuery.isFetching} />
      <HomeAnalyticsGraphs performers={performers} standings={standingsQuery.data || []} sourceLabel={performersQuery.data?.label} />
      <HomeStatLeaders countryFilter={selectedCountry} />
      <FeaturedComparison />
    </main>
  );
}

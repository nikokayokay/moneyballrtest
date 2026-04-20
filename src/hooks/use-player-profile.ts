import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { fetchPlayerProfile } from "@/src/lib/mlb";
import { NEAR_REALTIME_REFRESH_MS, refreshIntervalForState } from "@/src/lib/live";

export function usePlayerProfile(playerId: number) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!playerId) return;
    queryClient.prefetchQuery({
      queryKey: ["player-profile", playerId],
      queryFn: () => fetchPlayerProfile(playerId),
      staleTime: 60_000,
    });
  }, [playerId, queryClient]);

  return useQuery({
    queryKey: ["player-profile", playerId],
    queryFn: () => fetchPlayerProfile(playerId),
    enabled: Number.isFinite(playerId) && playerId > 0,
    staleTime: 30_000,
    refetchInterval: (query) => refreshIntervalForState(query.state.data?.liveGame.state || "NO_GAME") || NEAR_REALTIME_REFRESH_MS,
    refetchIntervalInBackground: true,
  });
}

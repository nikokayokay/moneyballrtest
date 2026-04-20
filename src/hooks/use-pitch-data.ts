import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { fetchPlayerPitchData, type Pitch, type PlayerProfile } from "@/src/lib/mlb";
import { LIVE_REFRESH_MS, NEAR_REALTIME_REFRESH_MS } from "@/src/lib/live";

export function usePitchData(playerId: number, playerType: PlayerProfile["type"], isLive = false) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!playerId || playerType !== "hitter") return;
    queryClient.prefetchQuery({
      queryKey: ["player-pitches", playerId],
      queryFn: () => fetchPlayerPitchData(playerId),
      staleTime: 120_000,
    });
  }, [playerId, playerType, queryClient]);

  return useQuery<Pitch[]>({
    queryKey: ["player-pitches", playerId],
    queryFn: () => fetchPlayerPitchData(playerId),
    enabled: Number.isFinite(playerId) && playerId > 0 && playerType === "hitter",
    staleTime: 120_000,
    gcTime: 15 * 60_000,
    refetchInterval: isLive ? LIVE_REFRESH_MS : NEAR_REALTIME_REFRESH_MS,
    refetchIntervalInBackground: true,
  });
}

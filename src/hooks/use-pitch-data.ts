import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { fetchPlayerPitchData, type Pitch, type PlayerProfile } from "@/src/lib/mlb";

export function usePitchData(playerId: number, playerType: PlayerProfile["type"]) {
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
    refetchInterval: 60_000,
  });
}

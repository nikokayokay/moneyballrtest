import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { fetchPlayerProfile } from "@/src/lib/mlb";

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
    refetchInterval: 30_000,
  });
}

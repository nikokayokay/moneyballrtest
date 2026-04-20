import { useQuery } from "@tanstack/react-query";
import { fetchRosterDirectory, filterRoster } from "@/src/lib/mlb";
import { useDebouncedValue } from "@/src/hooks/use-debounced-value";

export function usePlayerSearch(query: string) {
  const debounced = useDebouncedValue(query, 120);
  const rosterQuery = useQuery({
    queryKey: ["roster-directory"],
    queryFn: fetchRosterDirectory,
    staleTime: 10 * 60_000,
  });

  return {
    ...rosterQuery,
    results: debounced ? filterRoster(rosterQuery.data || [], debounced) : [],
    query: debounced,
  };
}

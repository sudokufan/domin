import {
  useQuery,
  type QueryKey,
  type UseQueryResult,
} from "@tanstack/react-query";

/**
 * Project convention for polling a REST endpoint (the `usePolling` node in
 * the architecture diagram).
 *
 * It wraps React Query with a fixed refetch interval and the options that
 * suit a live-monitoring UI: keep the previous data visible while the next
 * poll is in flight (no flicker), and surface when the data last updated.
 * All domain hooks (useStations, useDashboard, …) are built on top of this so
 * polling behaviour is defined in exactly one place.
 */
export interface PollingResult<Data> {
  data: Data | undefined;
  error: Error | null;
  isLoading: boolean;
  isFetching: boolean;
  /** Epoch ms of the last successful fetch, or 0 if none yet. */
  lastUpdated: number;
  refetch: UseQueryResult<Data>["refetch"];
}

export const usePolling = <Data>(
  key: QueryKey,
  fetcher: () => Promise<Data>,
  intervalMs: number,
  options: { enabled?: boolean } = {},
): PollingResult<Data> => {
  const query = useQuery({
    queryKey: key,
    queryFn: fetcher,
    refetchInterval: intervalMs,
    enabled: options.enabled ?? true,
    // Show last-known data while refetching instead of falling back to a
    // loading state on every poll.
    placeholderData: (previous) => previous,
  });

  return {
    data: query.data,
    error: query.error,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    lastUpdated: query.dataUpdatedAt,
    refetch: query.refetch,
  };
};

/** Poll intervals per data domain, in ms. Centralised so cadence is tunable. */
export const POLL_INTERVALS = {
  stations: 3000,
  station: 3000,
  dashboard: 5000,
} as const;

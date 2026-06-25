import { useQuery } from "@tanstack/react-query";
import { api } from "@/api/endpoints";
import { POLL_INTERVALS, usePolling } from "./usePolling";

/** Live detail for a single station (status, telemetry, parts). */
export const useGetStation = (id: string | null) =>
  usePolling(
    ["station", id],
    () => api.getStation(id as string),
    POLL_INTERVALS.station,
    { enabled: !!id },
  );

/** Recent status events for a station, for the detail panel. */
export const useGetStationEvents = (id: string | null) =>
  useQuery({
    queryKey: ["station-events", id],
    queryFn: () => api.getStationEvents(id as string),
    enabled: !!id,
    refetchInterval: POLL_INTERVALS.station,
  });

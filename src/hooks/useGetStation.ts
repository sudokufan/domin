import { useQuery } from "@tanstack/react-query";
import { api } from "@/api/endpoints";
import type { TimeRange } from "@/api/types";
import { POLL_INTERVALS, usePolling } from "./usePolling";

/** Live detail for a single station (status, telemetry, parts). */
export const useStation = (id: string | null) =>
  usePolling(
    ["station", id],
    () => api.getStation(id as string),
    POLL_INTERVALS.station,
    { enabled: !!id },
  );

/** Recent status events for a station, for the detail panel. */
export const useStationEvents = (id: string | null) =>
  useQuery({
    queryKey: ["station-events", id],
    queryFn: () => api.getStationEvents(id as string),
    enabled: !!id,
    refetchInterval: POLL_INTERVALS.station,
  });

/** A station's status history over a range (for inline mini-timelines). */
export const useStationHistory = (id: string | null, range: TimeRange) =>
  useQuery({
    queryKey: ["station-history", id, range],
    queryFn: () => api.getStationHistory(id as string, range),
    enabled: !!id,
    refetchInterval: POLL_INTERVALS.station,
  });

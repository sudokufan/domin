import { api } from "@/api/endpoints";
import type { TimeRange } from "@/api/types";
import { POLL_INTERVALS, usePolling } from "./usePolling";

/** Dashboard aggregates for the selected time range, polled live. */
export const useDashboard = (range: TimeRange) =>
  usePolling(
    ["dashboard", range],
    () => api.getDashboard(range),
    POLL_INTERVALS.dashboard,
  );

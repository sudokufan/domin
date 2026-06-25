import { api } from "@/api/endpoints";
import { POLL_INTERVALS, usePolling } from "./usePolling";

/** Live list of all stations, polled every few seconds. */
export const useGetStations = () =>
  usePolling(["stations"], api.getStations, POLL_INTERVALS.stations);

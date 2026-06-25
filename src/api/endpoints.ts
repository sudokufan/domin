import { apiGet } from "./client";
import type {
  DashboardData,
  Station,
  StationHistory,
  StatusEvent,
  TimeRange,
} from "./types";

/**
 * Typed wrappers around the REST endpoints. Hooks call these; nothing else in
 * the app constructs request paths.
 */
export const api = {
  getStations: () => apiGet<Station[]>("/stations"),

  getStation: (id: string) => apiGet<Station>(`/stations/${id}`),

  getStationEvents: (id: string) =>
    apiGet<StatusEvent[]>(`/stations/${id}/events`),

  getStationHistory: (id: string, range: TimeRange) =>
    apiGet<StationHistory>(`/stations/${id}/history`, { range }),

  getDashboard: (range: TimeRange) =>
    apiGet<DashboardData>("/dashboard", { range }),
};

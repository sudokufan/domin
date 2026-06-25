import type { DashboardData, Station, StatusEvent, TimeRange } from "./types";
import * as mockData from "./mockData";

/**
 * The app's API surface — the functions the React Query hooks call.
 *
 * They're `async` so they look and behave like network calls (React Query
 * awaits them), but today they resolve straight from the static mock dataset.
 * To go live, swap each body for a `fetch()` to the real endpoint — nothing
 * else in the app changes.
 */
export const api = {
  getStations: async (): Promise<Station[]> => mockData.getStations(),

  getStation: async (id: string): Promise<Station> => {
    const station = mockData.getStation(id);
    if (!station) throw new Error(`Station ${id} not found`);
    return station;
  },

  getStationEvents: async (id: string): Promise<StatusEvent[]> =>
    mockData.getStationEvents(id),

  getDashboard: async (range: TimeRange): Promise<DashboardData> =>
    mockData.getDashboard(range),
};

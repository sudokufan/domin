import type { DashboardData, Station, StatusEvent, TimeRange } from "./types";
import { API_BASE_URL, apiGet } from "./client";
import * as mockData from "./mockData";

/**
 * The API client — the "API client (src/api/)" box in src/designs/diagram.png.
 *
 * Each method is one REST endpoint. Right now every call resolves from the
 * in-browser mock (`mockData.ts`), which simulates exactly the JSON the real
 * REST API would return.
 *
 * Switching to the real backend is just redirecting where the API points: set
 * `VITE_API_BASE_URL` and every call goes through `apiGet` to that server over
 * HTTPS/JSON instead. The hooks, pages and components don't change at all —
 * each endpoint shows its real URL and its mock source side by side.
 */
export const api = {
  getStations: async (): Promise<Station[]> =>
    API_BASE_URL ? apiGet("/stations") : mockData.getStations(),

  getStation: async (id: string): Promise<Station> => {
    if (API_BASE_URL) return apiGet(`/stations/${id}`);
    const station = mockData.getStation(id);
    if (!station) throw new Error(`Station ${id} not found`);
    return station;
  },

  getStationEvents: async (id: string): Promise<StatusEvent[]> =>
    API_BASE_URL ? apiGet(`/stations/${id}/events`) : mockData.getStationEvents(id),

  getDashboard: async (range: TimeRange): Promise<DashboardData> =>
    API_BASE_URL ? apiGet(`/dashboard?range=${range}`) : mockData.getDashboard(range),
};

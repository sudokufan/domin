import { ApiError, handleRequest } from "./mock/handlers";

/**
 * HTTP client for the factory-status REST API.
 *
 * This is the one place the front-end is coupled to the data source. When
 * `VITE_API_BASE_URL` is set, requests go to the real API over fetch();
 * otherwise they resolve against the static in-browser mock (mock/). Pointing
 * the app at a real backend is therefore a config change, not a code change.
 */
const BASE_URL = import.meta.env.VITE_API_BASE_URL as string | undefined;
const USE_MOCK = !BASE_URL;

/** Simulated network latency for the mock, so loading states are real. */
const MOCK_LATENCY_MS = 180;

export { ApiError };

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const ensureTrailingSlash = (url: string) =>
  url.endsWith("/") ? url : `${url}/`;

export const apiGet = async <Data>(
  path: string,
  params: Record<string, string> = {},
): Promise<Data> => {
  if (USE_MOCK) {
    await delay(MOCK_LATENCY_MS);
    return handleRequest<Data>(path, params);
  }

  const url = new URL(path.replace(/^\//, ""), ensureTrailingSlash(BASE_URL!));
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  const response = await fetch(url, {
    headers: { Accept: "application/json" },
  });
  if (!response.ok) {
    throw new ApiError(
      response.status,
      `Request failed: ${response.status} ${response.statusText}`,
    );
  }
  return (await response.json()) as Data;
};

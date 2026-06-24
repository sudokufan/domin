import { ApiError, handleRequest } from './mock/handlers'

/**
 * HTTP client for the factory-status REST API.
 *
 * This is the one place the front-end is coupled to the data source. When
 * `VITE_API_BASE_URL` is set, requests go to the real API over fetch();
 * otherwise they resolve against the in-browser simulation (mock/). Pointing
 * the app at a real backend is therefore a config change, not a code change.
 */
const BASE_URL = import.meta.env.VITE_API_BASE_URL as string | undefined
const USE_MOCK = !BASE_URL

/** Simulated network latency for the mock, so loading states are real. */
const MOCK_LATENCY_MS = 180

export { ApiError }

export async function apiGet<T>(
  path: string,
  params: Record<string, string> = {},
): Promise<T> {
  if (USE_MOCK) {
    await delay(MOCK_LATENCY_MS)
    return handleRequest<T>(path, params)
  }

  const url = new URL(path.replace(/^\//, ''), ensureTrailingSlash(BASE_URL!))
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)

  const res = await fetch(url, { headers: { Accept: 'application/json' } })
  if (!res.ok) {
    throw new ApiError(res.status, `Request failed: ${res.status} ${res.statusText}`)
  }
  return (await res.json()) as T
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function ensureTrailingSlash(s: string) {
  return s.endsWith('/') ? s : `${s}/`
}

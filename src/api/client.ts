/**
 * HTTP transport — the JSON/HTTPS arrow into the "API client (src/api/)" box in
 * src/designs/diagram.png.
 *
 * `API_BASE_URL` comes from the `VITE_API_BASE_URL` env var (set in a `.env`
 * file or the shell — see `.env.example`). When it's unset (the default, with
 * no `.env`), the app runs on mock data and `apiGet` is never called. Set it to
 * a real server URL and `endpoints.ts` routes every call through `apiGet` to the
 * live REST API instead.
 */
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as
  | string
  | undefined;

/** GET `<API_BASE_URL><path>` and parse the JSON response as `Data`. */
export const apiGet = async <Data>(path: string): Promise<Data> => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { Accept: "application/json" },
  });
  if (!response.ok) {
    throw new Error(`GET ${path} failed: ${response.status} ${response.statusText}`);
  }
  return (await response.json()) as Data;
};

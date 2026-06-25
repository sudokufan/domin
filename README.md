# DOMIN — Factory Status

A real-time monitoring UI for a hydraulic-valve production line. Engineers use
it to see which machines are running or faulted, where parts are in the process,
and whether the line is hitting its throughput targets — plus utilisation trends
and fault history over time.

Built with React 19, TypeScript, Vite, Tailwind CSS v4, TanStack Query and
Recharts.

## Running it

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # type-check + production build
npm run lint
```

The app ships with an **in-browser mock** of the production line, so there is no
backend to run — it works out of the box, rendering a static snapshot of the
line.

## The three views

| View          | What it answers                                                                                                                                                                         |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Stations**  | Status of every machine at a glance — searchable, filterable, sortable table with 24h utilisation; expand a row for telemetry, parts and events.                                        |
| **Floor map** | Where things physically are. A shop-floor plan with status-coloured machine cards; select one for a detail panel.                                                                       |
| **Dashboard** | Is the line healthy? Headline KPIs (utilisation, stations running, active faults, throughput vs target), a utilisation trend with a target line, and a 24h per-machine status timeline. |

## Architecture

The structure follows the reference diagram in `public/assets/diagram.png`:

```
src/
  api/          the "API client" + the data behind it
    types.ts        domain types (Station, Telemetry union, events, dashboard)
    mockData.ts     static dataset that simulates the API's JSON responses
    client.ts       HTTP transport (real fetch) + API_BASE_URL from the env
    endpoints.ts    the `api`: per endpoint, real fetch OR mock (one switch)
  hooks/        usePolling primitive + useGetStations / useGetStation / useGetDashboard
  layout/       Layout, Sidebar (drawer on mobile), Topbar
  components/   reusable UI — composed into pages:
                  Stations  → StatusSummary, StationFilters, StationsTable
                  Floor map → ProcessFlow, FlowConnector, StationCard,
                              StationInspectorPanel
                  Dashboard → KpiCardContainer, UtilisationChart, StatusTimeline
                  shared    → StatusBadge, Card, KpiCard, Sparkline, states, …
  pages/        StationsPage, FloorMapPage, DashboardPage, StubPage
  lib/          status palette, formatting, CSV export, telemetry presentation
```

Pages stay thin: they own state (filters, selection, range) and compose
components; the components are presentational and reusable.

**Data flows one way:** `pages → hooks → endpoints → (mockData | client → real API)`.
Components never touch the data source; they only depend on the types in
`api/types.ts`.

### Swapping the mock for a real API

`src/api/endpoints.ts` is the **API client** from the diagram, and the only
place that knows where data comes from. Each method is one REST endpoint that
today resolves from `mockData.ts` — but it already contains the real call too,
behind one switch:

```ts
getStations: async () =>
  API_BASE_URL ? apiGet("/stations") : mockData.getStations();
```

So pointing the app at the real backend is just **redirecting where the API
points**: set `VITE_API_BASE_URL` (in a `.env` file — see `.env.example`) and
every call goes through `client.ts`'s `apiGet` to that server over HTTPS/JSON
instead. The hooks, pages and components don't change at all; once live,
`mockData.ts` can be deleted.

> **Env vars** are read by Vite from a `.env` file at the project root (or the
> shell), exposed on `import.meta.env`. There's no `.env` by default, so the app
> uses the mock; copy `.env.example` → `.env` and set the URL to go live.

## Approaches

- **Static in-browser mock behind the API boundary.** `src/api/mockData.ts`
  builds one believable snapshot at load — the 6 machines plus ~24h of
  synthesised history — anchored to a single frozen timestamp, then never
  changes. Reads are deterministic, so repeated polls return identical data and
  the UI renders once and stays put. It lives entirely behind the API boundary,
  so the front-end depends only on the data contract (`api/types.ts`), never on
  the mock.

- **Machine-specific telemetry as a discriminated union.** Telemetry volume
  varies wildly per station (the honing machine reports state only; the test rig
  streams eight fields). A `kind`-tagged union (`api/types.ts`) lets components
  narrow safely and renders each machine's read-outs without `any`.

- **TanStack Query, wrapped in a `usePolling` convention.** Query gives caching,
  background refetch and request de-duplication for free. `hooks/usePolling.ts`
  wraps it with a fixed refetch interval and "keep last data while refetching"
  so polling behaviour (and the diagram's `usePolling` node) lives in one place;
  `useGetStations` / `useGetDashboard` composes it.

- **Single source of truth for status styling.** `lib/status.ts` maps each
  status to colours/labels once; badges, dots, the timeline and charts all read
  from it, so the palette can't drift between views.

- **Hand-built status timeline.** The per-machine timeline is categorical spans,
  not a numeric series, so it's plain positioned divs rather than a chart
  library — lighter and more controllable. Recharts is reserved for the
  utilisation area chart and KPI sparklines.

- **Floor map as a process flow, not a fixed bay grid.** Stations render in
  process order (`ProcessFlow`) linked by `FlowConnector`s coloured by the
  upstream station's status — so a faulted machine visibly breaks the flow
  downstream. This is laid out as a horizontal line on wide screens and a
  vertical stack on small ones, which both expresses the flow and stays legible
  at any width (no overflow). The station cards use a **CSS container query** to
  drop the status label to a dot when a card gets narrow, so they fit whether
  the flow is full-width or sharing space with the inspector panel.

- **Responsive throughout.** The sidebar collapses to a hamburger drawer below
  `lg`; the topbar sheds the breadcrumb/date progressively; the stations table
  drops lower-priority columns (Stage, Type, then time/utilisation) as width
  shrinks and scrolls horizontally as a last resort.

## Accessibility

Semantic table markup, keyboard-operable rows/cards/controls, ARIA labels on
icon-only buttons and the progress bars, and status conveyed by **text + colour**
(never colour alone).

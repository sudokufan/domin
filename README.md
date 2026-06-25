# DOMIN — Factory Status

A real-time monitoring UI for a hydraulic-valve production line. Engineers use
it to see which machines are running or faulted, where parts are in the process,
and whether the line is hitting its throughput targets — plus utilisation trends
and fault history over time.

Built with React 19, TypeScript, Vite, Tailwind CSS v4, TanStack Query and
Recharts.

> **New to the codebase?** Read **[WALKTHROUGH.md](./WALKTHROUGH.md)** — a
> guided, file-by-file tour that follows a piece of data from the mock store all
> the way to the screen.

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

| View | What it answers |
| --- | --- |
| **Stations** | Status of every machine at a glance — searchable, filterable, sortable table with 24h utilisation; expand a row for telemetry, parts and events. |
| **Floor map** | Where things physically are. A shop-floor plan with status-coloured machine cards; select one for a detail panel. |
| **Dashboard** | Is the line healthy? Headline KPIs (utilisation, stations running, active faults, throughput vs target), a utilisation trend with a target line, and a 24h per-machine status timeline. |

## Architecture

The structure follows the reference diagram in `src/designs/diagram.png`:

```
src/
  api/          REST contract + the swappable data source
    types.ts        domain types (Station, Telemetry union, events, dashboard)
    client.ts       the ONE coupling point — mock vs real API
    endpoints.ts    typed wrappers: getStations(), getDashboard(range), …
    mock/           in-browser stand-in for the PostgreSQL + REST backend
      seed.ts         the six machines + initial state
      mockData.ts     static dataset: 6 machines, 24h history, aggregates
      handlers.ts     resolves request paths against the mock data
  hooks/        usePolling primitive + useStations / useStation / useDashboard
  layout/       AppLayout, Sidebar (drawer on mobile), Topbar
  components/   reusable UI — composed into pages:
                  Stations  → StatusSummary, StationFilters, StationsTable
                  Floor map → ProcessFlow, FlowConnector, StationCard,
                              StationInspectorPanel
                  Dashboard → DashboardKpis, UtilisationChart, StatusTimeline
                  shared    → StatusBadge, Card, KpiCard, Sparkline, states, …
  pages/        StationsPage, FloorMapPage, DashboardPage, StubPage
  lib/          status palette, formatting, CSV export, telemetry presentation
```

Pages stay thin: they own state (filters, selection, range) and compose
components; the components are presentational and reusable.

**Data flows one way:** `pages → hooks → endpoints → client → (mock | real API)`.
Components never construct request paths or touch the mock; they only
depend on the types in `api/types.ts`.

### Swapping the mock for a real API

`src/api/client.ts` is the only place that knows where data comes from. Set
`VITE_API_BASE_URL` and every request goes to the real REST API over `fetch()`
instead of the mock — no other code changes. The `mock/` folder can then
be deleted.

## Key decisions & trade-offs

- **Static in-browser mock behind the API boundary.** `src/api/mock/mockData.ts`
  builds one believable snapshot at load — the 6 machines plus ~24h of
  synthesised history — anchored to a single frozen timestamp, then never
  changes. Reads are deterministic, so repeated polls return identical data and
  the UI renders once and stays put. It lives entirely behind the API boundary,
  so the front-end depends only on the data contract (`api/types.ts`), never on
  the mock. (An earlier version was a live ticking simulation; that was removed
  in favour of stable data.)

- **Machine-specific telemetry as a discriminated union.** Telemetry volume
  varies wildly per station (the honing machine reports state only; the test rig
  streams eight fields). A `kind`-tagged union (`api/types.ts`) lets components
  narrow safely and renders each machine's read-outs without `any`.

- **TanStack Query, wrapped in a `usePolling` convention.** Query gives caching,
  background refetch and request de-duplication for free. `hooks/usePolling.ts`
  wraps it with a fixed refetch interval and "keep last data while refetching"
  so polling behaviour (and the diagram's `usePolling` node) lives in one place;
  `useStations` / `useDashboard` compose it.

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

## If I took it further

- Code-split Recharts (it dominates the bundle) and lazy-load routes.
- WebSocket/SSE transport for true push instead of polling (the `client.ts` seam
  makes this a localised change).
- Tests: unit-test the aggregation logic in `mockData.ts` and the formatting
  helpers; component tests for the table filtering/sorting.
- Persist filter/range state in the URL so views are shareable.
- Build out the Production/Account areas currently stubbed in the nav.
```

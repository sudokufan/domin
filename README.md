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

The app ships with an **in-browser simulation** of the production line, so there
is no backend to run — it works out of the box and the data evolves live.

## The three views

| View | What it answers |
| --- | --- |
| **Stations** | Status of every machine at a glance — searchable, filterable, sortable table with 24h utilisation; expand a row for live telemetry, parts and events. |
| **Floor map** | Where things physically are. A shop-floor plan with status-coloured machine cards; select one for a live detail panel. |
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
      simulation.ts   ticking state, 24h history, utilisation aggregates
      handlers.ts     resolves request paths against the simulation
  hooks/        usePolling primitive + useStations / useStation / useDashboard
  layout/       AppLayout, Sidebar, Topbar
  components/   reusable UI (StatusBadge, KpiCard, charts, timeline, …)
  pages/        StationsPage, FloorMapPage, DashboardPage, StubPage
  lib/          status palette, formatting, CSV export, telemetry presentation
```

**Data flows one way:** `pages → hooks → endpoints → client → (mock | real API)`.
Components never construct request paths or touch the simulation; they only
depend on the types in `api/types.ts`.

### Swapping the mock for a real API

`src/api/client.ts` is the only place that knows where data comes from. Set
`VITE_API_BASE_URL` and every request goes to the real REST API over `fetch()`
instead of the simulation — no other code changes. The `mock/` folder can then
be deleted.

## Key decisions & trade-offs

- **In-browser simulation behind the API boundary.** Rather than static
  fixtures, the mock *ticks*: telemetry drifts, statuses transition (logging
  events), parts move through queues, and throughput accrues. It also
  synthesises 24h of history on load so the timeline and utilisation chart have
  depth immediately. This exercises the real-time aspects of the brief while
  keeping the front-end honest about its data contract.

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

## Accessibility

Semantic table markup, keyboard-operable rows/cards/controls, ARIA labels on
icon-only buttons and the progress bars, and status conveyed by **text + colour**
(never colour alone).

## If I took it further

- Code-split Recharts (it dominates the bundle) and lazy-load routes.
- WebSocket/SSE transport for true push instead of polling (the `client.ts` seam
  makes this a localised change).
- Tests: unit-test the aggregation logic in `simulation.ts` and the formatting
  helpers; component tests for the table filtering/sorting.
- Persist filter/range state in the URL so views are shareable.
- Build out the Production/Account areas currently stubbed in the nav.
```

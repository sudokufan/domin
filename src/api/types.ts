/**
 * Domain types for the factory-status API.
 *
 * These mirror the JSON contract the REST API (see src/designs/diagram.png)
 * would serve from the PostgreSQL `stations`, `telemetry`, `parts` and
 * `events` tables. The front-end only ever depends on these types, never on
 * the simulation that currently produces them.
 */

export type StationStatus = 'running' | 'idle' | 'maintenance' | 'faulted'

export const STATION_STATUSES: StationStatus[] = [
  'running',
  'idle',
  'faulted',
  'maintenance',
]

export type ProcessStage = 'Print' | 'Turn' | 'Hone' | 'Test' | 'Mark' | 'Ship'

export type TimeRange = '1h' | '4h' | '24h'

/* ------------------------------------------------------------------ *
 * Machine-specific telemetry
 *
 * Telemetry volume varies per station, so it is modelled as a
 * discriminated union keyed by `kind`. Components narrow on `kind`
 * to render the right read-outs; the honing machine reports state only.
 * ------------------------------------------------------------------ */

export interface PrinterTelemetry {
  kind: 'printer'
  chamberTempC: number
  buildProgressPct: number
  materialRemainingPct: number
  jobId: string | null
}

export interface LatheTelemetry {
  kind: 'lathe'
  spindleRpm: number
  coolantTempC: number
}

export interface HoningTelemetry {
  kind: 'honing'
}

export interface TestRigTelemetry {
  kind: 'test-rig'
  testRunning: boolean
  testResult: 'pass' | 'fail' | null
  inletPressureBar: number
  outletPressureBar: number
  flowRateLpm: number
  fluidTempC: number
  testDurationS: number
  partSerial: string | null
}

export interface MarkerTelemetry {
  kind: 'marker'
  partsMarkedShift: number
}

export interface ShippingTelemetry {
  kind: 'shipping'
  partsDispatchedShift: number
}

export type Telemetry =
  | PrinterTelemetry
  | LatheTelemetry
  | HoningTelemetry
  | TestRigTelemetry
  | MarkerTelemetry
  | ShippingTelemetry

export type TelemetryKind = Telemetry['kind']

/* ------------------------------------------------------------------ *
 * Stations, parts and events
 * ------------------------------------------------------------------ */

export interface Station {
  id: string // e.g. "M01"
  name: string // e.g. "3D Printer"
  stage: ProcessStage // e.g. "Print"
  type: string // human-readable process, e.g. "Metal 3D Print"
  status: StationStatus
  /** ISO timestamp the current status was entered (drives "time in state"). */
  statusSince: string
  /** Rolling 24h running-time fraction, 0..1. */
  utilisation24h: number
  partsQueued: string[]
  partsProcessed: string[]
  telemetry: Telemetry
  /** Placement on the shop-floor plan, in grid cells. */
  layout: { col: number; row: number }
}

export interface StatusEvent {
  id: string
  stationId: string
  timestamp: string
  /** The status that was entered at this event. */
  status: StationStatus
  message: string
}

/** A contiguous run of one status, used to draw the 24h status timeline. */
export interface StatusSegment {
  status: StationStatus
  start: string
  end: string
}

export interface StationHistory {
  stationId: string
  segments: StatusSegment[]
}

/* ------------------------------------------------------------------ *
 * Dashboard aggregates
 * ------------------------------------------------------------------ */

export interface UtilisationSample {
  timestamp: string
  /** Fraction of stations running at this sample, 0..100. */
  utilisationPct: number
}

export interface DashboardData {
  range: TimeRange
  generatedAt: string

  /** Headline factory utilisation over the selected range, 0..100. */
  factoryUtilisationPct: number
  /** Change vs the preceding equivalent window, in percentage points. */
  factoryUtilisationDeltaPp: number
  utilisationTargetPct: number
  utilisationSeries: UtilisationSample[]

  stationsRunning: number
  stationsTotal: number

  activeFaults: Array<{ stationId: string; name: string }>

  throughputToday: number
  throughputTarget: number

  /** Per-station status segments across the selected range. */
  timeline: StationHistory[]
}

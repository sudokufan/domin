import type {
  Station,
  StationHistory,
  StationStatus,
  StatusEvent,
  StatusSegment,
  TimeRange,
  UtilisationSample,
} from '@/api/types'
import {
  SEED_THROUGHPUT_TODAY,
  STATUS_MESSAGES,
  seedStations,
  nextSerial,
} from './seed'

const HOUR = 60 * 60 * 1000
const DAY = 24 * HOUR
const TICK_MS = 3000

/* --- small numeric helpers --------------------------------------- */
const clamp = (n: number, min: number, max: number) =>
  Math.min(max, Math.max(min, n))
const rand = (min: number, max: number) => min + Math.random() * (max - min)
const chance = (p: number) => Math.random() < p
const pick = <T>(xs: T[]): T => xs[Math.floor(Math.random() * xs.length)]
/** Nudge a value within bounds by up to ±step. */
const wander = (v: number, min: number, max: number, step: number) =>
  clamp(v + rand(-step, step), min, max)

/** Status weights used when synthesising history / random transitions. */
const STATUS_WEIGHTS: Array<[StationStatus, number]> = [
  ['running', 0.6],
  ['idle', 0.22],
  ['maintenance', 0.1],
  ['faulted', 0.08],
]

function weightedStatus(exclude?: StationStatus): StationStatus {
  const pool = STATUS_WEIGHTS.filter(([s]) => s !== exclude)
  const total = pool.reduce((sum, [, w]) => sum + w, 0)
  let r = Math.random() * total
  for (const [s, w] of pool) {
    r -= w
    if (r <= 0) return s
  }
  return pool[0][0]
}

let eventSeq = 0
function makeEvent(
  stationId: string,
  status: StationStatus,
  at: number,
): StatusEvent {
  eventSeq += 1
  return {
    id: `evt-${eventSeq}`,
    stationId,
    timestamp: new Date(at).toISOString(),
    status,
    message: pick(STATUS_MESSAGES[status]),
  }
}

/** Internal segment using ms timestamps; serialised to ISO at the boundary. */
interface InternalSegment {
  status: StationStatus
  start: number
  end: number
}

/**
 * Synthesise ~24h of status segments for a station, ending in its current
 * status (which started at `statusSince`). Built backwards from now so the
 * live segment lines up with the seeded state.
 */
function seedHistory(station: Station, now: number): InternalSegment[] {
  const windowStart = now - DAY
  const segments: InternalSegment[] = []

  // The live segment: current status, still open (end tracked to `now`).
  const liveStart = Math.max(windowStart, Date.parse(station.statusSince))
  segments.unshift({ status: station.status, start: liveStart, end: now })

  let cursor = liveStart
  let nextStatus = station.status
  while (cursor > windowStart) {
    const duration = rand(12, 95) * 60 * 1000
    const start = Math.max(windowStart, cursor - duration)
    const status = weightedStatus(nextStatus)
    segments.unshift({ status, start, end: cursor })
    cursor = start
    nextStatus = status
  }

  return segments
}

class FactorySimulation {
  private stations: Station[]
  private history: Map<string, InternalSegment[]> = new Map()
  private events: StatusEvent[] = []
  private throughputToday = SEED_THROUGHPUT_TODAY
  private startedAt = Date.now()
  private timer: ReturnType<typeof setInterval> | null = null

  constructor() {
    const now = Date.now()
    this.stations = seedStations(now)
    for (const s of this.stations) {
      this.history.set(s.id, seedHistory(s, now))
      // Seed a couple of recent events so detail panels aren't empty.
      this.events.push(makeEvent(s.id, s.status, Date.parse(s.statusSince)))
    }
    this.events.sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp))
  }

  start() {
    if (this.timer) return
    this.timer = setInterval(() => this.tick(), TICK_MS)
  }

  stop() {
    if (this.timer) clearInterval(this.timer)
    this.timer = null
  }

  /* ----------------------------------------------------------------
   * Tick: advance telemetry, counters and (occasionally) status.
   * ---------------------------------------------------------------- */
  private tick() {
    const now = Date.now()
    for (const s of this.stations) {
      this.driftTelemetry(s)
      // Low per-tick probability of a status change keeps the line stable.
      if (chance(0.03)) this.transition(s, now, weightedStatus(s.status))
      this.extendHistory(s.id, now)
    }
  }

  private driftTelemetry(s: Station) {
    const running = s.status === 'running'
    const t = s.telemetry
    switch (t.kind) {
      case 'printer': {
        t.chamberTempC = wander(t.chamberTempC, 175, 195, 1.5)
        if (running) {
          t.buildProgressPct = clamp(t.buildProgressPct + rand(0.4, 1.4), 0, 100)
          if (t.buildProgressPct >= 100) {
            // Build complete: release the part, load the next job.
            this.completePart(s)
            t.buildProgressPct = rand(0, 4)
            t.materialRemainingPct = clamp(t.materialRemainingPct - rand(2, 5), 6, 100)
            t.jobId = `JOB-${2284 + Math.floor(rand(1, 40))}`
          }
        }
        break
      }
      case 'lathe': {
        t.spindleRpm = running
          ? Math.round(wander(t.spindleRpm || 4200, 3800, 4800, 120))
          : Math.max(0, Math.round(t.spindleRpm - 600))
        t.coolantTempC = wander(t.coolantTempC, 26, 36, 0.6)
        break
      }
      case 'test-rig': {
        if (running) {
          t.testRunning = true
          t.testDurationS += TICK_MS / 1000
          t.inletPressureBar = wander(t.inletPressureBar, 195, 215, 2)
          t.outletPressureBar = wander(t.outletPressureBar, 188, 206, 2)
          t.flowRateLpm = wander(t.flowRateLpm, 32, 44, 1.2)
          t.fluidTempC = wander(t.fluidTempC, 40, 50, 0.5)
          if (t.testDurationS >= 90) {
            // Test finished: record result, advance the part, re-arm.
            t.testResult = chance(0.92) ? 'pass' : 'fail'
            this.completePart(s)
            t.testDurationS = 0
            t.partSerial = nextSerial()
          }
        } else {
          t.testRunning = false
        }
        break
      }
      case 'marker': {
        if (running && chance(0.4)) {
          t.partsMarkedShift += 1
          this.completePart(s)
        }
        break
      }
      case 'shipping': {
        if (running && chance(0.35)) {
          t.partsDispatchedShift += 1
          this.throughputToday += 1
          this.completePart(s)
        }
        break
      }
      case 'honing':
        break
    }
  }

  /** Move the head of the queue into the processed list. */
  private completePart(s: Station) {
    if (s.partsQueued.length === 0) {
      s.partsQueued.push(nextSerial())
    }
    const done = s.partsQueued.shift()!
    s.partsProcessed.push(done)
    // Keep an upstream backlog so queues don't drain to nothing.
    if (s.partsQueued.length < 2 && chance(0.5)) s.partsQueued.push(nextSerial())
  }

  private transition(s: Station, now: number, to: StationStatus) {
    if (to === s.status) return
    s.status = to
    s.statusSince = new Date(now).toISOString()
    this.events.unshift(makeEvent(s.id, to, now))
    if (this.events.length > 200) this.events.length = 200

    // Close the open history segment and open a new one.
    const segs = this.history.get(s.id)!
    segs[segs.length - 1].end = now
    segs.push({ status: to, start: now, end: now })
  }

  private extendHistory(id: string, now: number) {
    const segs = this.history.get(id)!
    segs[segs.length - 1].end = now
    // Drop segments that have aged out of the 24h window.
    const cutoff = now - DAY
    while (segs.length > 1 && segs[1].end < cutoff) segs.shift()
    if (segs[0].start < cutoff) segs[0].start = cutoff
  }

  /* ----------------------------------------------------------------
   * Read models (what the REST endpoints would return)
   * ---------------------------------------------------------------- */

  getStations(): Station[] {
    const now = Date.now()
    return this.stations.map((s) => ({
      ...structuredClone(s),
      utilisation24h: this.utilisationFor(s.id, now - DAY, now),
    }))
  }

  getStation(id: string): Station | undefined {
    return this.getStations().find((s) => s.id === id)
  }

  getEvents(stationId?: string, limit = 25): StatusEvent[] {
    const list = stationId
      ? this.events.filter((e) => e.stationId === stationId)
      : this.events
    return list.slice(0, limit)
  }

  getHistory(range: TimeRange): StationHistory[] {
    const now = Date.now()
    const start = now - this.rangeMs(range)
    return this.stations.map((s) => ({
      stationId: s.id,
      segments: this.clipSegments(s.id, start, now),
    }))
  }

  getUtilisationSeries(range: TimeRange): UtilisationSample[] {
    const now = Date.now()
    const span = this.rangeMs(range)
    const step = this.sampleStep(range)
    const samples: UtilisationSample[] = []
    for (let t = now - span; t <= now; t += step) {
      samples.push({
        timestamp: new Date(t).toISOString(),
        utilisationPct: Math.round(this.runningFractionAt(t) * 100),
      })
    }
    return samples
  }

  getThroughputToday() {
    return this.throughputToday
  }

  getStartedAt() {
    return this.startedAt
  }

  /* ----------------------------------------------------------------
   * Internal aggregation helpers
   * ---------------------------------------------------------------- */

  private rangeMs(range: TimeRange) {
    return range === '1h' ? HOUR : range === '4h' ? 4 * HOUR : DAY
  }

  private sampleStep(range: TimeRange) {
    return range === '1h'
      ? 2 * 60 * 1000
      : range === '4h'
        ? 10 * 60 * 1000
        : 30 * 60 * 1000
  }

  private statusAt(id: string, t: number): StationStatus | null {
    const segs = this.history.get(id)
    if (!segs) return null
    for (const seg of segs) {
      if (t >= seg.start && t <= seg.end) return seg.status
    }
    if (segs.length && t < segs[0].start) return segs[0].status
    return segs.length ? segs[segs.length - 1].status : null
  }

  /** Fraction of stations running at instant `t`, 0..1. */
  private runningFractionAt(t: number): number {
    let running = 0
    for (const s of this.stations) {
      if (this.statusAt(s.id, t) === 'running') running += 1
    }
    return running / this.stations.length
  }

  /** Fraction of the [from,to] window a station spent running, 0..1. */
  private utilisationFor(id: string, from: number, to: number): number {
    const segs = this.history.get(id)
    if (!segs) return 0
    let runningMs = 0
    for (const seg of segs) {
      if (seg.status !== 'running') continue
      const a = Math.max(seg.start, from)
      const b = Math.min(seg.end, to)
      if (b > a) runningMs += b - a
    }
    return clamp(runningMs / (to - from), 0, 1)
  }

  private clipSegments(id: string, from: number, to: number): StatusSegment[] {
    const segs = this.history.get(id) ?? []
    return segs
      .filter((seg) => seg.end > from && seg.start < to)
      .map((seg) => ({
        status: seg.status,
        start: new Date(Math.max(seg.start, from)).toISOString(),
        end: new Date(Math.min(seg.end, to)).toISOString(),
      }))
  }

  /** Mean running fraction across the window (headline utilisation). */
  meanUtilisation(range: TimeRange): number {
    const series = this.getUtilisationSeries(range)
    if (!series.length) return 0
    const sum = series.reduce((acc, s) => acc + s.utilisationPct, 0)
    return sum / series.length
  }

  /** Mean running fraction across the window immediately before this one. */
  meanUtilisationPrevious(range: TimeRange): number {
    const now = Date.now()
    const span = this.rangeMs(range)
    const step = this.sampleStep(range)
    let sum = 0
    let n = 0
    for (let t = now - 2 * span; t <= now - span; t += step) {
      sum += this.runningFractionAt(t) * 100
      n += 1
    }
    return n ? sum / n : 0
  }
}

/**
 * Module-level singleton. The simulation starts ticking on first import and
 * lives for the life of the tab — exactly the seam a real REST API would sit
 * behind. Swapping to a real backend means deleting this and pointing the
 * client at API_BASE_URL.
 */
export const simulation = new FactorySimulation()
simulation.start()

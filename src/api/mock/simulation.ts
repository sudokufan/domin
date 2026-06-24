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
const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value))
const rand = (min: number, max: number) => min + Math.random() * (max - min)
const chance = (probability: number) => Math.random() < probability
const pickRandom = <Item,>(items: Item[]): Item =>
  items[Math.floor(Math.random() * items.length)]
/** Nudge a value within bounds by up to ±step. */
const wander = (value: number, min: number, max: number, step: number) =>
  clamp(value + rand(-step, step), min, max)

/** Status weights used when synthesising history / random transitions. */
const STATUS_WEIGHTS: Array<[StationStatus, number]> = [
  ['running', 0.6],
  ['idle', 0.22],
  ['maintenance', 0.1],
  ['faulted', 0.08],
]

const weightedStatus = (exclude?: StationStatus): StationStatus => {
  const pool = STATUS_WEIGHTS.filter(([status]) => status !== exclude)
  const total = pool.reduce((sum, [, weight]) => sum + weight, 0)
  let roll = Math.random() * total
  for (const [status, weight] of pool) {
    roll -= weight
    if (roll <= 0) return status
  }
  return pool[0][0]
}

let eventSequence = 0
const makeEvent = (
  stationId: string,
  status: StationStatus,
  at: number,
): StatusEvent => {
  eventSequence += 1
  return {
    id: `evt-${eventSequence}`,
    stationId,
    timestamp: new Date(at).toISOString(),
    status,
    message: pickRandom(STATUS_MESSAGES[status]),
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
const seedHistory = (station: Station, now: number): InternalSegment[] => {
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
    for (const station of this.stations) {
      this.history.set(station.id, seedHistory(station, now))
      // Seed a couple of recent events so detail panels aren't empty.
      this.events.push(
        makeEvent(station.id, station.status, Date.parse(station.statusSince)),
      )
    }
    this.events.sort(
      (first, second) =>
        Date.parse(second.timestamp) - Date.parse(first.timestamp),
    )
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
    for (const station of this.stations) {
      this.driftTelemetry(station)
      // Low per-tick probability of a status change keeps the line stable.
      if (chance(0.03)) {
        this.transition(station, now, weightedStatus(station.status))
      }
      this.extendHistory(station.id, now)
    }
  }

  private driftTelemetry(station: Station) {
    const isRunning = station.status === 'running'
    const telemetry = station.telemetry
    switch (telemetry.kind) {
      case 'printer': {
        telemetry.chamberTempC = wander(telemetry.chamberTempC, 175, 195, 1.5)
        if (isRunning) {
          telemetry.buildProgressPct = clamp(
            telemetry.buildProgressPct + rand(0.4, 1.4),
            0,
            100,
          )
          if (telemetry.buildProgressPct >= 100) {
            // Build complete: release the part, load the next job.
            this.completePart(station)
            telemetry.buildProgressPct = rand(0, 4)
            telemetry.materialRemainingPct = clamp(
              telemetry.materialRemainingPct - rand(2, 5),
              6,
              100,
            )
            telemetry.jobId = `JOB-${2284 + Math.floor(rand(1, 40))}`
          }
        }
        break
      }
      case 'lathe': {
        telemetry.spindleRpm = isRunning
          ? Math.round(wander(telemetry.spindleRpm || 4200, 3800, 4800, 120))
          : Math.max(0, Math.round(telemetry.spindleRpm - 600))
        telemetry.coolantTempC = wander(telemetry.coolantTempC, 26, 36, 0.6)
        break
      }
      case 'test-rig': {
        if (isRunning) {
          telemetry.testRunning = true
          telemetry.testDurationS += TICK_MS / 1000
          telemetry.inletPressureBar = wander(telemetry.inletPressureBar, 195, 215, 2)
          telemetry.outletPressureBar = wander(telemetry.outletPressureBar, 188, 206, 2)
          telemetry.flowRateLpm = wander(telemetry.flowRateLpm, 32, 44, 1.2)
          telemetry.fluidTempC = wander(telemetry.fluidTempC, 40, 50, 0.5)
          if (telemetry.testDurationS >= 90) {
            // Test finished: record result, advance the part, re-arm.
            telemetry.testResult = chance(0.92) ? 'pass' : 'fail'
            this.completePart(station)
            telemetry.testDurationS = 0
            telemetry.partSerial = nextSerial()
          }
        } else {
          telemetry.testRunning = false
        }
        break
      }
      case 'marker': {
        if (isRunning && chance(0.4)) {
          telemetry.partsMarkedShift += 1
          this.completePart(station)
        }
        break
      }
      case 'shipping': {
        if (isRunning && chance(0.35)) {
          telemetry.partsDispatchedShift += 1
          this.throughputToday += 1
          this.completePart(station)
        }
        break
      }
      case 'honing':
        break
    }
  }

  /** Move the head of the queue into the processed list. */
  private completePart(station: Station) {
    if (station.partsQueued.length === 0) {
      station.partsQueued.push(nextSerial())
    }
    const completed = station.partsQueued.shift()!
    station.partsProcessed.push(completed)
    // Keep an upstream backlog so queues don't drain to nothing.
    if (station.partsQueued.length < 2 && chance(0.5)) {
      station.partsQueued.push(nextSerial())
    }
  }

  private transition(station: Station, now: number, to: StationStatus) {
    if (to === station.status) return
    station.status = to
    station.statusSince = new Date(now).toISOString()
    this.events.unshift(makeEvent(station.id, to, now))
    if (this.events.length > 200) this.events.length = 200

    // Close the open history segment and open a new one.
    const segments = this.history.get(station.id)!
    segments[segments.length - 1].end = now
    segments.push({ status: to, start: now, end: now })
  }

  private extendHistory(stationId: string, now: number) {
    const segments = this.history.get(stationId)!
    segments[segments.length - 1].end = now
    // Drop segments that have aged out of the 24h window.
    const cutoff = now - DAY
    while (segments.length > 1 && segments[1].end < cutoff) segments.shift()
    if (segments[0].start < cutoff) segments[0].start = cutoff
  }

  /* ----------------------------------------------------------------
   * Read models (what the REST endpoints would return)
   * ---------------------------------------------------------------- */

  getStations(): Station[] {
    const now = Date.now()
    return this.stations.map((station) => ({
      ...structuredClone(station),
      utilisation24h: this.utilisationFor(station.id, now - DAY, now),
    }))
  }

  getStation(id: string): Station | undefined {
    return this.getStations().find((station) => station.id === id)
  }

  getEvents(stationId?: string, limit = 25): StatusEvent[] {
    const list = stationId
      ? this.events.filter((event) => event.stationId === stationId)
      : this.events
    return list.slice(0, limit)
  }

  getHistory(range: TimeRange): StationHistory[] {
    const now = Date.now()
    const start = now - this.rangeMs(range)
    return this.stations.map((station) => ({
      stationId: station.id,
      segments: this.clipSegments(station.id, start, now),
    }))
  }

  getUtilisationSeries(range: TimeRange): UtilisationSample[] {
    const now = Date.now()
    const span = this.rangeMs(range)
    const step = this.sampleStep(range)
    const samples: UtilisationSample[] = []
    for (let time = now - span; time <= now; time += step) {
      samples.push({
        timestamp: new Date(time).toISOString(),
        utilisationPct: Math.round(this.runningFractionAt(time) * 100),
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

  private statusAt(stationId: string, time: number): StationStatus | null {
    const segments = this.history.get(stationId)
    if (!segments) return null
    for (const segment of segments) {
      if (time >= segment.start && time <= segment.end) return segment.status
    }
    if (segments.length && time < segments[0].start) return segments[0].status
    return segments.length ? segments[segments.length - 1].status : null
  }

  /** Fraction of stations running at the given instant, 0..1. */
  private runningFractionAt(time: number): number {
    let running = 0
    for (const station of this.stations) {
      if (this.statusAt(station.id, time) === 'running') running += 1
    }
    return running / this.stations.length
  }

  /** Fraction of the [from,to] window a station spent running, 0..1. */
  private utilisationFor(stationId: string, from: number, to: number): number {
    const segments = this.history.get(stationId)
    if (!segments) return 0
    let runningMs = 0
    for (const segment of segments) {
      if (segment.status !== 'running') continue
      const overlapStart = Math.max(segment.start, from)
      const overlapEnd = Math.min(segment.end, to)
      if (overlapEnd > overlapStart) runningMs += overlapEnd - overlapStart
    }
    return clamp(runningMs / (to - from), 0, 1)
  }

  private clipSegments(
    stationId: string,
    from: number,
    to: number,
  ): StatusSegment[] {
    const segments = this.history.get(stationId) ?? []
    return segments
      .filter((segment) => segment.end > from && segment.start < to)
      .map((segment) => ({
        status: segment.status,
        start: new Date(Math.max(segment.start, from)).toISOString(),
        end: new Date(Math.min(segment.end, to)).toISOString(),
      }))
  }

  /** Mean running fraction across the window (headline utilisation). */
  meanUtilisation(range: TimeRange): number {
    const series = this.getUtilisationSeries(range)
    if (!series.length) return 0
    const sum = series.reduce((total, sample) => total + sample.utilisationPct, 0)
    return sum / series.length
  }

  /** Mean running fraction across the window immediately before this one. */
  meanUtilisationPrevious(range: TimeRange): number {
    const now = Date.now()
    const span = this.rangeMs(range)
    const step = this.sampleStep(range)
    let sum = 0
    let count = 0
    for (let time = now - 2 * span; time <= now - span; time += step) {
      sum += this.runningFractionAt(time) * 100
      count += 1
    }
    return count ? sum / count : 0
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

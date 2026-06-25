import type {
  Station,
  StationHistory,
  StationStatus,
  StatusEvent,
  StatusSegment,
  TimeRange,
  UtilisationSample,
} from "@/api/types";
import { SEED_THROUGHPUT_TODAY, STATUS_MESSAGES, seedStations } from "./seed";

/**
 * A static, in-memory dataset standing in for the REST API. One believable
 * snapshot — 6 machines plus ~24h of synthesised history — is built once at
 * import, anchored to a single frozen `now`, and then never changes.
 *
 * Every read is deterministic against that frozen `now`, so repeated polls
 * return identical data and the UI renders once and sits still. To go live,
 * point the client at a real API (see client.ts) and delete this folder.
 */

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

/* --- small numeric helpers --------------------------------------- */
const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));
const rand = (min: number, max: number) => min + Math.random() * (max - min);
const pickRandom = <Item>(items: Item[]): Item =>
  items[Math.floor(Math.random() * items.length)];

const STATUS_WEIGHTS: Array<[StationStatus, number]> = [
  ["running", 0.6],
  ["idle", 0.22],
  ["maintenance", 0.1],
  ["faulted", 0.08],
];

const weightedStatus = (exclude?: StationStatus): StationStatus => {
  const pool = STATUS_WEIGHTS.filter(([status]) => status !== exclude);
  const total = pool.reduce((sum, [, weight]) => sum + weight, 0);
  let roll = Math.random() * total;
  for (const [status, weight] of pool) {
    roll -= weight;
    if (roll <= 0) return status;
  }
  return pool[0][0];
};

/** Internal segment using ms timestamps; serialised to ISO at the boundary. */
interface InternalSegment {
  status: StationStatus;
  start: number;
  end: number;
}

/**
 * Synthesise ~24h of status segments for a station, ending in its current
 * status (which started at `statusSince`). Built backwards from `now`.
 */
const seedHistory = (station: Station, now: number): InternalSegment[] => {
  const windowStart = now - DAY;
  const segments: InternalSegment[] = [];

  const liveStart = Math.max(windowStart, Date.parse(station.statusSince));
  segments.unshift({ status: station.status, start: liveStart, end: now });

  let cursor = liveStart;
  let nextStatus = station.status;
  while (cursor > windowStart) {
    const duration = rand(12, 95) * 60 * 1000;
    const start = Math.max(windowStart, cursor - duration);
    const status = weightedStatus(nextStatus);
    segments.unshift({ status, start, end: cursor });
    cursor = start;
    nextStatus = status;
  }

  return segments;
};

/* ------------------------------------------------------------------ *
 * The snapshot — built once at import.
 * ------------------------------------------------------------------ */

/** Captured once; every read is computed against this instant. */
const NOW = Date.now();

const baseStations = seedStations(NOW);

const historyByStation = new Map<string, InternalSegment[]>(
  baseStations.map((station) => [station.id, seedHistory(station, NOW)]),
);

const events: StatusEvent[] = baseStations
  .map((station, index) => ({
    id: `evt-${index + 1}`,
    stationId: station.id,
    timestamp: station.statusSince,
    status: station.status,
    message: pickRandom(STATUS_MESSAGES[station.status]),
  }))
  .sort(
    (first, second) =>
      Date.parse(second.timestamp) - Date.parse(first.timestamp),
  );

/* --- aggregation helpers (pure, over the frozen snapshot) -------- */

const rangeMs = (range: TimeRange) =>
  range === "1h" ? HOUR : range === "4h" ? 4 * HOUR : DAY;

const sampleStep = (range: TimeRange) =>
  range === "1h"
    ? 2 * 60 * 1000
    : range === "4h"
      ? 10 * 60 * 1000
      : 30 * 60 * 1000;

const statusAt = (stationId: string, time: number): StationStatus | null => {
  const segments = historyByStation.get(stationId);
  if (!segments) return null;
  for (const segment of segments) {
    if (time >= segment.start && time <= segment.end) return segment.status;
  }
  if (time < segments[0].start) return segments[0].status;
  return segments[segments.length - 1].status;
};

/** Fraction of stations running at the given instant, 0..1. */
const runningFractionAt = (time: number): number => {
  const running = baseStations.filter(
    (station) => statusAt(station.id, time) === "running",
  ).length;
  return running / baseStations.length;
};

/** Fraction of the [from,to] window a station spent running, 0..1. */
const utilisationFor = (
  stationId: string,
  from: number,
  to: number,
): number => {
  const segments = historyByStation.get(stationId);
  if (!segments) return 0;
  let runningMs = 0;
  for (const segment of segments) {
    if (segment.status !== "running") continue;
    const overlapStart = Math.max(segment.start, from);
    const overlapEnd = Math.min(segment.end, to);
    if (overlapEnd > overlapStart) runningMs += overlapEnd - overlapStart;
  }
  return clamp(runningMs / (to - from), 0, 1);
};

const clipSegments = (
  stationId: string,
  from: number,
  to: number,
): StatusSegment[] =>
  (historyByStation.get(stationId) ?? [])
    .filter((segment) => segment.end > from && segment.start < to)
    .map((segment) => ({
      status: segment.status,
      start: new Date(Math.max(segment.start, from)).toISOString(),
      end: new Date(Math.min(segment.end, to)).toISOString(),
    }));

/** Stations with their 24h utilisation baked in — computed once, frozen. */
const stations: Station[] = baseStations.map((station) => ({
  ...station,
  utilisation24h: utilisationFor(station.id, NOW - DAY, NOW),
}));

/* ------------------------------------------------------------------ *
 * Read models (what the REST endpoints return)
 * ------------------------------------------------------------------ */

export const getGeneratedAt = (): string => new Date(NOW).toISOString();

export const getStations = (): Station[] => stations;

export const getStation = (id: string): Station | undefined =>
  stations.find((station) => station.id === id);

export const getEvents = (stationId?: string, limit = 25): StatusEvent[] =>
  (stationId
    ? events.filter((event) => event.stationId === stationId)
    : events
  ).slice(0, limit);

export const getHistory = (range: TimeRange): StationHistory[] => {
  const start = NOW - rangeMs(range);
  return baseStations.map((station) => ({
    stationId: station.id,
    segments: clipSegments(station.id, start, NOW),
  }));
};

export const getUtilisationSeries = (range: TimeRange): UtilisationSample[] => {
  const span = rangeMs(range);
  const step = sampleStep(range);
  const samples: UtilisationSample[] = [];
  for (let time = NOW - span; time <= NOW; time += step) {
    samples.push({
      timestamp: new Date(time).toISOString(),
      utilisationPct: Math.round(runningFractionAt(time) * 100),
    });
  }
  return samples;
};

export const getThroughputToday = (): number => SEED_THROUGHPUT_TODAY;

/** Mean running fraction across the window (headline utilisation). */
export const meanUtilisation = (range: TimeRange): number => {
  const series = getUtilisationSeries(range);
  if (!series.length) return 0;
  const sum = series.reduce(
    (total, sample) => total + sample.utilisationPct,
    0,
  );
  return sum / series.length;
};

/** Mean running fraction across the window immediately before this one. */
export const meanUtilisationPrevious = (range: TimeRange): number => {
  const span = rangeMs(range);
  const step = sampleStep(range);
  let sum = 0;
  let count = 0;
  for (let time = NOW - 2 * span; time <= NOW - span; time += step) {
    sum += runningFractionAt(time) * 100;
    count += 1;
  }
  return count ? sum / count : 0;
};

import type {
  DashboardData,
  Station,
  StationHistory,
  StationStatus,
  StatusEvent,
  StatusSegment,
  TimeRange,
  UtilisationSample,
} from "@/api/types";

/**
 * The static mock dataset standing in for the backend.
 *
 * One believable snapshot — the 6 machines plus ~24h of synthesised history —
 * is built once at import, anchored to a single frozen `now`, and then never
 * changes. The `endpoints.ts` `api` reads from here; nothing else does.
 */

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

const THROUGHPUT_TODAY = 142;
const THROUGHPUT_TARGET = 160;
const UTILISATION_TARGET_PCT = 70;

/* --- small helpers ----------------------------------------------- */
const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));
const rand = (min: number, max: number) => min + Math.random() * (max - min);
const pickRandom = <Item>(items: Item[]): Item =>
  items[Math.floor(Math.random() * items.length)];

/** Hydraulic-valve serials, e.g. "VLV-21-04412". */
let serialSequence = 4400;
const nextSerial = (): string => {
  serialSequence += 1;
  return `VLV-21-${String(serialSequence).padStart(5, "0")}`;
};
const queueOf = (count: number): string[] =>
  Array.from({ length: count }, () => nextSerial());

const STATUS_MESSAGES: Record<StationStatus, string[]> = {
  running: ["Cycle started", "Resumed production", "Job started"],
  idle: ["Awaiting parts", "Operator paused", "Queue empty"],
  maintenance: ["Scheduled maintenance", "Preventive service", "Calibration"],
  faulted: [
    "Fault detected — see controller",
    "Over-temperature trip",
    "Pressure out of range",
    "E-stop triggered",
  ],
};

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

/**
 * The 6 machines, chosen to match the reference design (3 running, 1 idle,
 * 1 faulted, 1 maintenance). `statusSince` is relative to the frozen `now`.
 */
const buildStations = (now: number): Station[] => {
  const since = (minutesAgo: number) =>
    new Date(now - minutesAgo * 60_000).toISOString();

  return [
    {
      id: "M01",
      name: "3D Printer",
      stage: "Print",
      type: "Metal 3D Print",
      status: "running",
      statusSince: since(134),
      utilisation24h: 0.56,
      partsQueued: queueOf(4),
      partsProcessed: queueOf(18),
      telemetry: {
        kind: "printer",
        chamberTempC: 184,
        buildProgressPct: 62,
        materialRemainingPct: 47,
        jobId: "JOB-2284",
      },
      layout: { col: 0, row: 0 },
    },
    {
      id: "M02",
      name: "CNC Lathe",
      stage: "Turn",
      type: "Precision turning",
      status: "running",
      statusSince: since(65),
      utilisation24h: 0.49,
      partsQueued: queueOf(3),
      partsProcessed: queueOf(26),
      telemetry: { kind: "lathe", spindleRpm: 4250, coolantTempC: 31 },
      layout: { col: 1, row: 0 },
    },
    {
      id: "M03",
      name: "Honing Machine",
      stage: "Hone",
      type: "Bore honing",
      status: "idle",
      statusSince: since(43),
      utilisation24h: 0.63,
      partsQueued: queueOf(2),
      partsProcessed: queueOf(22),
      telemetry: { kind: "honing" },
      layout: { col: 2, row: 0 },
    },
    {
      id: "M04",
      name: "Test Rig",
      stage: "Test",
      type: "End-of-line performance test",
      status: "running",
      statusSince: since(27),
      utilisation24h: 0.45,
      partsQueued: queueOf(5),
      partsProcessed: queueOf(21),
      telemetry: {
        kind: "test-rig",
        testRunning: true,
        testResult: null,
        inletPressureBar: 207,
        outletPressureBar: 198,
        flowRateLpm: 38,
        fluidTempC: 44,
        testDurationS: 73,
        partSerial: "VLV-21-04412",
      },
      layout: { col: 3, row: 0 },
    },
    {
      id: "M05",
      name: "Laser Marker",
      stage: "Mark",
      type: "Part identification",
      status: "faulted",
      statusSince: since(18),
      utilisation24h: 0.9,
      partsQueued: queueOf(6),
      partsProcessed: queueOf(87),
      telemetry: { kind: "marker", partsMarkedShift: 87 },
      layout: { col: 4, row: 0 },
    },
    {
      id: "M06",
      name: "Shipping Station",
      stage: "Ship",
      type: "Packaging and dispatch",
      status: "maintenance",
      statusSince: since(72),
      utilisation24h: 0.64,
      partsQueued: queueOf(3),
      partsProcessed: queueOf(64),
      telemetry: { kind: "shipping", partsDispatchedShift: 64 },
      layout: { col: 4, row: 1 },
    },
  ];
};

/* ------------------------------------------------------------------ *
 * The snapshot — built once at import.
 * ------------------------------------------------------------------ */

/** Captured once; every read is computed against this instant. */
const NOW = Date.now();

const stations = buildStations(NOW);

const historyByStation = new Map<string, InternalSegment[]>(
  stations.map((station) => [station.id, seedHistory(station, NOW)]),
);

const events: StatusEvent[] = stations
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

/* --- aggregation over the frozen snapshot ------------------------ */

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
  const running = stations.filter(
    (station) => statusAt(station.id, time) === "running",
  ).length;
  return running / stations.length;
};

/** Fraction of the [from,to] window a station spent running, 0..1. */
const utilisationFor = (stationId: string, from: number, to: number): number => {
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

const historyForRange = (range: TimeRange): StationHistory[] => {
  const start = NOW - rangeMs(range);
  return stations.map((station) => ({
    stationId: station.id,
    segments: clipSegments(station.id, start, NOW),
  }));
};

const utilisationSeries = (range: TimeRange): UtilisationSample[] => {
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

const meanUtilisation = (samples: UtilisationSample[]): number =>
  samples.length
    ? samples.reduce((total, sample) => total + sample.utilisationPct, 0) /
      samples.length
    : 0;

/** Mean running fraction across the window immediately before `range`. */
const previousMeanUtilisation = (range: TimeRange): number => {
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

/* Bake each station's 24h utilisation in once. */
for (const station of stations) {
  station.utilisation24h = utilisationFor(station.id, NOW - DAY, NOW);
}

/* ------------------------------------------------------------------ *
 * Read API — what the endpoints expose.
 * ------------------------------------------------------------------ */

export const getStations = (): Station[] => stations;

export const getStation = (id: string): Station | undefined =>
  stations.find((station) => station.id === id);

export const getStationEvents = (id: string, limit = 25): StatusEvent[] =>
  events.filter((event) => event.stationId === id).slice(0, limit);

export const getDashboard = (range: TimeRange): DashboardData => {
  const series = utilisationSeries(range);
  const mean = meanUtilisation(series);
  const previous = previousMeanUtilisation(range);

  return {
    range,
    generatedAt: new Date(NOW).toISOString(),
    factoryUtilisationPct: Math.round(mean),
    factoryUtilisationDeltaPp: Math.round((mean - previous) * 10) / 10,
    utilisationTargetPct: UTILISATION_TARGET_PCT,
    utilisationSeries: series,
    stationsRunning: stations.filter((s) => s.status === "running").length,
    stationsTotal: stations.length,
    activeFaults: stations
      .filter((s) => s.status === "faulted")
      .map((s) => ({ stationId: s.id, name: s.name })),
    throughputToday: THROUGHPUT_TODAY,
    throughputTarget: THROUGHPUT_TARGET,
    timeline: historyForRange(range),
  };
};

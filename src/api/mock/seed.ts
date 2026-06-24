import type { Station, StationStatus } from '@/api/types'

/** Generate a hydraulic-valve serial, e.g. "VLV-21-04412". */
export const makeSerial = (sequence: number): string => {
  const batch = 21
  return `VLV-${batch}-${String(sequence).padStart(5, '0')}`
}

let serialSequence = 4400
export const nextSerial = (): string => {
  serialSequence += 1
  return makeSerial(serialSequence)
}

const queueOf = (count: number): string[] =>
  Array.from({ length: count }, () => nextSerial())

/**
 * Initial production-line state. Statuses are chosen to match the reference
 * design: 3 running, 1 idle, 1 faulted, 1 maintenance.
 */
export const seedStations = (now: number): Station[] => {
  const since = (minutesAgo: number) =>
    new Date(now - minutesAgo * 60_000).toISOString()

  const stations: Station[] = [
    {
      id: 'M01',
      name: '3D Printer',
      stage: 'Print',
      type: 'Metal 3D Print',
      status: 'running',
      statusSince: since(134),
      utilisation24h: 0.56,
      partsQueued: queueOf(4),
      partsProcessed: queueOf(18),
      telemetry: {
        kind: 'printer',
        chamberTempC: 184,
        buildProgressPct: 62,
        materialRemainingPct: 47,
        jobId: 'JOB-2284',
      },
      layout: { col: 0, row: 0 },
    },
    {
      id: 'M02',
      name: 'CNC Lathe',
      stage: 'Turn',
      type: 'Precision turning',
      status: 'running',
      statusSince: since(65),
      utilisation24h: 0.49,
      partsQueued: queueOf(3),
      partsProcessed: queueOf(26),
      telemetry: {
        kind: 'lathe',
        spindleRpm: 4250,
        coolantTempC: 31,
      },
      layout: { col: 1, row: 0 },
    },
    {
      id: 'M03',
      name: 'Honing Machine',
      stage: 'Hone',
      type: 'Bore honing',
      status: 'idle',
      statusSince: since(43),
      utilisation24h: 0.63,
      partsQueued: queueOf(2),
      partsProcessed: queueOf(22),
      telemetry: { kind: 'honing' },
      layout: { col: 2, row: 0 },
    },
    {
      id: 'M04',
      name: 'Test Rig',
      stage: 'Test',
      type: 'End-of-line performance test',
      status: 'running',
      statusSince: since(27),
      utilisation24h: 0.45,
      partsQueued: queueOf(5),
      partsProcessed: queueOf(21),
      telemetry: {
        kind: 'test-rig',
        testRunning: true,
        testResult: null,
        inletPressureBar: 207,
        outletPressureBar: 198,
        flowRateLpm: 38,
        fluidTempC: 44,
        testDurationS: 73,
        partSerial: 'VLV-21-04412',
      },
      layout: { col: 3, row: 0 },
    },
    {
      id: 'M05',
      name: 'Laser Marker',
      stage: 'Mark',
      type: 'Part identification',
      status: 'faulted',
      statusSince: since(18),
      utilisation24h: 0.9,
      partsQueued: queueOf(6),
      partsProcessed: queueOf(87),
      telemetry: {
        kind: 'marker',
        partsMarkedShift: 87,
      },
      layout: { col: 4, row: 0 },
    },
    {
      id: 'M06',
      name: 'Shipping Station',
      stage: 'Ship',
      type: 'Packaging and dispatch',
      status: 'maintenance',
      statusSince: since(72),
      utilisation24h: 0.64,
      partsQueued: queueOf(3),
      partsProcessed: queueOf(64),
      telemetry: {
        kind: 'shipping',
        partsDispatchedShift: 64,
      },
      layout: { col: 4, row: 1 },
    },
  ]

  return stations
}

/** Throughput already dispatched today, before the sim starts ticking. */
export const SEED_THROUGHPUT_TODAY = 142
export const THROUGHPUT_TARGET = 160
export const UTILISATION_TARGET_PCT = 70

/** Human-readable messages for status transitions, used in the events log. */
export const STATUS_MESSAGES: Record<StationStatus, string[]> = {
  running: ['Cycle started', 'Resumed production', 'Job started'],
  idle: ['Awaiting parts', 'Operator paused', 'Queue empty'],
  maintenance: ['Scheduled maintenance', 'Preventive service', 'Calibration'],
  faulted: [
    'Fault detected — see controller',
    'Over-temperature trip',
    'Pressure out of range',
    'E-stop triggered',
  ],
}

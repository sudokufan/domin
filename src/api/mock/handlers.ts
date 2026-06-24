import type { DashboardData, TimeRange } from '@/api/types'
import {
  THROUGHPUT_TARGET,
  UTILISATION_TARGET_PCT,
} from './seed'
import { simulation } from './simulation'

/**
 * Resolves a request against the running simulation — the in-browser
 * stand-in for the REST API in src/designs/diagram.png. Returns plain JSON
 * exactly as the real `/stations`, `/dashboard`, … endpoints would.
 */
export function handleRequest<T>(
  path: string,
  params: Record<string, string> = {},
): T {
  const range = (params.range as TimeRange) ?? '24h'

  // GET /stations/:id/events
  let m = path.match(/^\/stations\/([^/]+)\/events$/)
  if (m) return simulation.getEvents(m[1]) as T

  // GET /stations/:id/history
  m = path.match(/^\/stations\/([^/]+)\/history$/)
  if (m) {
    const history = simulation.getHistory(range).find((h) => h.stationId === m![1])
    return (history ?? { stationId: m[1], segments: [] }) as T
  }

  // GET /stations/:id
  m = path.match(/^\/stations\/([^/]+)$/)
  if (m) {
    const station = simulation.getStation(m[1])
    if (!station) throw new ApiError(404, `Station ${m[1]} not found`)
    return station as T
  }

  // GET /stations
  if (path === '/stations') return simulation.getStations() as T

  // GET /dashboard
  if (path === '/dashboard') return buildDashboard(range) as T

  throw new ApiError(404, `No mock handler for ${path}`)
}

function buildDashboard(range: TimeRange): DashboardData {
  const stations = simulation.getStations()
  const running = stations.filter((s) => s.status === 'running').length
  const faults = stations
    .filter((s) => s.status === 'faulted')
    .map((s) => ({ stationId: s.id, name: s.name }))

  const mean = simulation.meanUtilisation(range)
  const prev = simulation.meanUtilisationPrevious(range)

  return {
    range,
    generatedAt: new Date().toISOString(),
    factoryUtilisationPct: Math.round(mean),
    factoryUtilisationDeltaPp: Math.round((mean - prev) * 10) / 10,
    utilisationTargetPct: UTILISATION_TARGET_PCT,
    utilisationSeries: simulation.getUtilisationSeries(range),
    stationsRunning: running,
    stationsTotal: stations.length,
    activeFaults: faults,
    throughputToday: simulation.getThroughputToday(),
    throughputTarget: THROUGHPUT_TARGET,
    timeline: simulation.getHistory(range),
  }
}

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

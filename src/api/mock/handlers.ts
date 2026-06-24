import type { DashboardData, TimeRange } from '@/api/types'
import { THROUGHPUT_TARGET, UTILISATION_TARGET_PCT } from './seed'
import { simulation } from './simulation'

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

const buildDashboard = (range: TimeRange): DashboardData => {
  const stations = simulation.getStations()
  const running = stations.filter((station) => station.status === 'running').length
  const faults = stations
    .filter((station) => station.status === 'faulted')
    .map((station) => ({ stationId: station.id, name: station.name }))

  const meanUtilisation = simulation.meanUtilisation(range)
  const previousUtilisation = simulation.meanUtilisationPrevious(range)

  return {
    range,
    generatedAt: new Date().toISOString(),
    factoryUtilisationPct: Math.round(meanUtilisation),
    factoryUtilisationDeltaPp:
      Math.round((meanUtilisation - previousUtilisation) * 10) / 10,
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

/**
 * Resolves a request against the running simulation — the in-browser
 * stand-in for the REST API in src/designs/diagram.png. Returns plain JSON
 * exactly as the real `/stations`, `/dashboard`, … endpoints would.
 */
export const handleRequest = <Result,>(
  path: string,
  params: Record<string, string> = {},
): Result => {
  const range = (params.range as TimeRange) ?? '24h'

  // GET /stations/:id/events
  let match = path.match(/^\/stations\/([^/]+)\/events$/)
  if (match) return simulation.getEvents(match[1]) as Result

  // GET /stations/:id/history
  match = path.match(/^\/stations\/([^/]+)\/history$/)
  if (match) {
    const stationId = match[1]
    const history = simulation
      .getHistory(range)
      .find((entry) => entry.stationId === stationId)
    return (history ?? { stationId, segments: [] }) as Result
  }

  // GET /stations/:id
  match = path.match(/^\/stations\/([^/]+)$/)
  if (match) {
    const station = simulation.getStation(match[1])
    if (!station) throw new ApiError(404, `Station ${match[1]} not found`)
    return station as Result
  }

  // GET /stations
  if (path === '/stations') return simulation.getStations() as Result

  // GET /dashboard
  if (path === '/dashboard') return buildDashboard(range) as Result

  throw new ApiError(404, `No mock handler for ${path}`)
}

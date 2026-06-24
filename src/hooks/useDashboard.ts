import { api } from '@/api/endpoints'
import type { TimeRange } from '@/api/types'
import { POLL_INTERVALS, usePolling } from './usePolling'

/** Dashboard aggregates for the selected time range, polled live. */
export function useDashboard(range: TimeRange) {
  return usePolling(
    ['dashboard', range],
    () => api.getDashboard(range),
    POLL_INTERVALS.dashboard,
  )
}

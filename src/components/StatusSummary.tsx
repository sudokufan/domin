import type { Station, StationStatus } from '@/api/types'
import { STATION_STATUSES } from '@/api/types'
import { Card } from './Card'
import { statusStyle } from '@/lib/status'

/** The four status-count tiles shown above the stations table. */
export function StatusSummary({ stations }: { stations: Station[] }) {
  const counts = STATION_STATUSES.reduce(
    (acc, status) => {
      acc[status] = stations.filter((s) => s.status === status).length
      return acc
    },
    {} as Record<StationStatus, number>,
  )

  return (
    <Card className="grid grid-cols-2 divide-slate-200 sm:grid-cols-4 sm:divide-x">
      {STATION_STATUSES.map((status) => {
        const style = statusStyle(status)
        return (
          <div key={status} className="flex items-start justify-between p-4">
            <div>
              <p className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
                {style.label}
              </p>
              <p className="mt-1 text-3xl font-semibold text-slate-900 tabular-nums">
                {counts[status]}
              </p>
            </div>
            <span
              className="mt-1 h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: style.hex }}
            />
          </div>
        )
      })}
    </Card>
  )
}

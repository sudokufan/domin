import { STATION_STATUSES } from '@/api/types'
import { statusStyle } from '@/lib/status'

/** Inline legend mapping each status colour to its label. */
export function StatusLegend() {
  return (
    <ul className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
      {STATION_STATUSES.map((status) => {
        const style = statusStyle(status)
        return (
          <li key={status} className="flex items-center gap-1.5 text-xs text-slate-600">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: style.hex }}
            />
            {style.label}
          </li>
        )
      })}
    </ul>
  )
}

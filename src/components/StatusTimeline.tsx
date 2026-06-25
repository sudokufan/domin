import { useMemo } from 'react'
import type { Station, StationHistory, TimeRange } from '@/api/types'
import { useNow } from '@/hooks/useNow'
import { clsx } from 'clsx'
import { statusStyle } from '@/lib/status'
import { formatDuration } from '@/lib/format'

const RANGE_MS: Record<TimeRange, number> = {
  '1h': 60 * 60 * 1000,
  '4h': 4 * 60 * 60 * 1000,
  '24h': 24 * 60 * 60 * 1000,
}

const axisLabel = (time: number, range: TimeRange, now: number): string => {
  if (range === '24h') {
    const hoursAgo = Math.round((now - time) / 3_600_000)
    return hoursAgo <= 0 ? 'now' : `-${hoursAgo}h`
  }
  const minutesAgo = Math.round((now - time) / 60_000)
  return minutesAgo <= 0 ? 'now' : `-${minutesAgo}m`
}

/**
 * Per-station status timeline (a small Gantt). Each row shows one machine's
 * status as proportional coloured segments across the selected window. Bars
 * are hand-built from divs rather than a chart library because the data is
 * categorical spans, not a series.
 */
export const StatusTimeline = ({
  history,
  stations,
  range,
  selectedId,
  onSelect,
}: {
  history: StationHistory[]
  stations: Station[]
  range: TimeRange
  selectedId?: string | null
  onSelect?: (id: string) => void
}) => {
  const now = useNow(5_000)
  const span = RANGE_MS[range]
  const windowStart = now - span

  const stationsById = useMemo(
    () => new Map(stations.map((station) => [station.id, station])),
    [stations],
  )

  const ticks = [0, 0.25, 0.5, 0.75, 1].map((fraction) => ({
    left: fraction * 100,
    label: axisLabel(windowStart + fraction * span, range, now),
  }))

  return (
    <div>
      {/* Axis */}
      <div className="relative mb-1 ml-28 h-4 sm:ml-40">
        {ticks.map((tick) => (
          <span
            key={tick.left}
            className="absolute -translate-x-1/2 text-[10px] text-slate-400 tabular-nums"
            style={{ left: `${tick.left}%` }}
          >
            {tick.label}
          </span>
        ))}
      </div>

      <div className="space-y-1.5">
        {history.map((row) => {
          const station = stationsById.get(row.stationId)
          if (!station) return null
          const isSelected = selectedId === row.stationId
          return (
            <div key={row.stationId} className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => onSelect?.(row.stationId)}
                className={clsx(
                  'w-28 shrink-0 truncate text-left text-xs sm:w-40',
                  isSelected
                    ? 'font-semibold text-slate-900'
                    : 'text-slate-600',
                  onSelect && 'hover:text-slate-900',
                )}
              >
                <span className="font-medium">{row.stationId}</span>{' '}
                <span className="text-slate-400">{station.name}</span>
              </button>

              <div
                className={clsx(
                  'relative h-5 flex-1 overflow-hidden rounded bg-slate-100',
                  isSelected && 'ring-2 ring-emerald-400/50',
                )}
              >
                {row.segments.map((segment, index) => {
                  const start = Math.max(Date.parse(segment.start), windowStart)
                  const end = Math.min(Date.parse(segment.end), now)
                  const left = ((start - windowStart) / span) * 100
                  const width = ((end - start) / span) * 100
                  if (width <= 0) return null
                  const style = statusStyle(segment.status)
                  return (
                    <div
                      key={index}
                      className="absolute top-0 h-full"
                      style={{
                        left: `${left}%`,
                        width: `${width}%`,
                        backgroundColor: style.hex,
                      }}
                      title={`${style.label} · ${formatDuration(segment.start, Date.parse(segment.end))}`}
                    />
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

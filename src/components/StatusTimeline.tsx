import { useMemo } from 'react'
import type { Station, StationHistory, TimeRange } from '@/api/types'
import { useNow } from '@/hooks/useNow'
import { cn } from '@/lib/cn'
import { statusStyle } from '@/lib/status'
import { formatDuration } from '@/lib/format'

const RANGE_MS: Record<TimeRange, number> = {
  '1h': 60 * 60 * 1000,
  '4h': 4 * 60 * 60 * 1000,
  '24h': 24 * 60 * 60 * 1000,
}

function axisLabel(t: number, range: TimeRange, now: number): string {
  if (range === '24h') {
    const h = Math.round((now - t) / 3_600_000)
    return h <= 0 ? 'now' : `-${h}h`
  }
  const m = Math.round((now - t) / 60_000)
  return m <= 0 ? 'now' : `-${m}m`
}

/**
 * Per-station status timeline (a small Gantt). Each row shows one machine's
 * status as proportional coloured segments across the selected window. Bars
 * are hand-built from divs rather than a chart library because the data is
 * categorical spans, not a series.
 */
export function StatusTimeline({
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
}) {
  const now = useNow(5_000)
  const span = RANGE_MS[range]
  const windowStart = now - span

  const byId = useMemo(
    () => new Map(stations.map((s) => [s.id, s])),
    [stations],
  )

  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => ({
    left: f * 100,
    label: axisLabel(windowStart + f * span, range, now),
  }))

  return (
    <div>
      {/* Axis */}
      <div className="relative mb-1 ml-40 h-4">
        {ticks.map((t) => (
          <span
            key={t.left}
            className="absolute -translate-x-1/2 text-[10px] text-slate-400 tabular-nums"
            style={{ left: `${t.left}%` }}
          >
            {t.label}
          </span>
        ))}
      </div>

      <div className="space-y-1.5">
        {history.map((row) => {
          const station = byId.get(row.stationId)
          if (!station) return null
          const selected = selectedId === row.stationId
          return (
            <div key={row.stationId} className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => onSelect?.(row.stationId)}
                className={cn(
                  'w-40 shrink-0 truncate text-left text-xs',
                  selected ? 'font-semibold text-slate-900' : 'text-slate-600',
                  onSelect && 'hover:text-slate-900',
                )}
              >
                <span className="font-medium">{row.stationId}</span>{' '}
                <span className="text-slate-400">{station.name}</span>
              </button>

              <div
                className={cn(
                  'relative h-5 flex-1 overflow-hidden rounded bg-slate-100',
                  selected && 'ring-2 ring-emerald-400/50',
                )}
              >
                {row.segments.map((seg, i) => {
                  const start = Math.max(Date.parse(seg.start), windowStart)
                  const end = Math.min(Date.parse(seg.end), now)
                  const left = ((start - windowStart) / span) * 100
                  const width = ((end - start) / span) * 100
                  if (width <= 0) return null
                  const style = statusStyle(seg.status)
                  return (
                    <div
                      key={i}
                      className="absolute top-0 h-full"
                      style={{
                        left: `${left}%`,
                        width: `${width}%`,
                        backgroundColor: style.hex,
                      }}
                      title={`${style.label} · ${formatDuration(seg.start, Date.parse(seg.end))}`}
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

import type { Station } from '@/api/types'
import { cn } from '@/lib/cn'
import { statusStyle } from '@/lib/status'
import { telemetryHeadline } from '@/lib/telemetry'
import { StatusBadge } from './StatusBadge'

/**
 * A machine as it appears on the shop-floor plan: a status-coloured card with
 * the machine name, its headline telemetry, and queue/throughput counts.
 */
export function StationCard({
  station,
  selected,
  onSelect,
}: {
  station: Station
  selected?: boolean
  onSelect?: (id: string) => void
}) {
  const style = statusStyle(station.status)
  const headline = telemetryHeadline(station)

  return (
    <button
      type="button"
      onClick={() => onSelect?.(station.id)}
      aria-pressed={selected}
      className={cn(
        'flex h-full w-full flex-col rounded-md border border-l-4 bg-white p-2.5 text-left shadow-sm transition',
        'hover:shadow-md',
        selected
          ? 'border-slate-300 ring-2 ring-emerald-400/60'
          : 'border-slate-200',
      )}
      style={{ borderLeftColor: style.hex }}
    >
      <div className="flex items-center justify-between gap-1">
        <span className="text-[10px] font-medium tracking-wide text-slate-400 uppercase">
          {station.id}
        </span>
        <StatusBadge status={station.status} />
      </div>
      <p className="mt-0.5 truncate text-xs font-semibold text-slate-800">
        {station.name}
      </p>

      <div className="mt-auto pt-2">
        {headline ? (
          <p className="text-sm font-semibold text-slate-900">{headline}</p>
        ) : (
          <p className="text-sm font-medium text-slate-400">{station.type}</p>
        )}
        <p className="mt-0.5 text-[10px] text-slate-400">
          Queue {station.partsQueued.length} · Done{' '}
          {station.partsProcessed.length}
        </p>
      </div>
    </button>
  )
}

import { X } from 'lucide-react'
import { useStation, useStationEvents } from '@/hooks/useStation'
import { useNow } from '@/hooks/useNow'
import { statusStyle } from '@/lib/status'
import { formatDuration, formatRelative } from '@/lib/format'
import { telemetryRows } from '@/lib/telemetry'
import { StatusBadge } from './StatusBadge'
import { UtilisationBar } from './UtilisationBar'
import { Skeleton } from './states'

/**
 * Live detail for one station: status, time-in-state, telemetry read-outs,
 * parts, 24h utilisation and recent events. Polls independently so it stays
 * current while open.
 */
export function StationDetail({
  stationId,
  onClose,
}: {
  stationId: string
  onClose?: () => void
}) {
  const { data: station, isLoading } = useStation(stationId)
  const { data: events } = useStationEvents(stationId)
  const now = useNow()

  if (isLoading || !station) {
    return (
      <div className="space-y-4 p-5">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    )
  }

  const rows = telemetryRows(station.telemetry)

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 border-b border-slate-200 p-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold tracking-wide text-slate-400">
              {station.id}
            </span>
            <StatusBadge status={station.status} />
          </div>
          <h3 className="mt-1 text-lg font-semibold text-slate-900">
            {station.name}
          </h3>
          <p className="text-xs text-slate-500">
            {station.stage} · {station.type}
          </p>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close detail"
            className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto p-5">
        {/* Time in state + utilisation */}
        <div className="grid grid-cols-2 gap-3">
          <Metric
            label="Time in state"
            value={formatDuration(station.statusSince, now)}
          />
          <div>
            <p className="text-[11px] font-medium tracking-wide text-slate-400 uppercase">
              24h utilisation
            </p>
            <UtilisationBar value={station.utilisation24h} className="mt-2" />
          </div>
        </div>

        {/* Telemetry */}
        {rows.length > 0 ? (
          <Section title="Live telemetry">
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2">
              {rows.map((row) => (
                <div key={row.label} className="flex flex-col">
                  <dt className="text-[11px] text-slate-400">{row.label}</dt>
                  <dd className="text-sm font-medium text-slate-800 tabular-nums">
                    {row.value}
                  </dd>
                </div>
              ))}
            </dl>
          </Section>
        ) : (
          <Section title="Live telemetry">
            <p className="text-xs text-slate-400">
              This machine reports operational state only.
            </p>
          </Section>
        )}

        {/* Parts */}
        <Section title="Parts">
          <div className="grid grid-cols-2 gap-3">
            <Metric label="Queued" value={String(station.partsQueued.length)} />
            <Metric
              label="Processed"
              value={String(station.partsProcessed.length)}
            />
          </div>
          {station.partsQueued.length > 0 && (
            <p className="mt-2 truncate text-xs text-slate-400">
              Next: {station.partsQueued.slice(0, 3).join(', ')}
            </p>
          )}
        </Section>

        {/* Events */}
        <Section title="Recent events">
          {events && events.length > 0 ? (
            <ul className="space-y-2.5">
              {events.slice(0, 6).map((event) => (
                <li key={event.id} className="flex items-start gap-2.5">
                  <span
                    className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: statusStyle(event.status).hex }}
                  />
                  <div className="min-w-0">
                    <p className="text-xs text-slate-700">{event.message}</p>
                    <p className="text-[11px] text-slate-400">
                      {formatRelative(Date.parse(event.timestamp), now)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-slate-400">No recent events.</p>
          )}
        </Section>
      </div>
    </div>
  )
}

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section>
      <h4 className="mb-2 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
        {title}
      </h4>
      {children}
    </section>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-medium tracking-wide text-slate-400 uppercase">
        {label}
      </p>
      <p className="mt-1 text-lg font-semibold text-slate-900 tabular-nums">
        {value}
      </p>
    </div>
  )
}

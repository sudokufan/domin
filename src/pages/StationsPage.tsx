import { useMemo, useState } from 'react'
import {
  ChevronDown,
  ChevronRight,
  Download,
  Search,
} from 'lucide-react'
import type { Station } from '@/api/types'
import { STATION_STATUSES } from '@/api/types'
import { useStations } from '@/hooks/useStations'
import { useNow } from '@/hooks/useNow'
import { PageHeader } from '@/components/PageHeader'
import { StatusSummary } from '@/components/StatusSummary'
import { StatusBadge } from '@/components/StatusBadge'
import { UtilisationBar } from '@/components/UtilisationBar'
import { StationDetail } from '@/components/StationDetail'
import { Select } from '@/components/Select'
import { Card } from '@/components/Card'
import { ErrorState, Skeleton } from '@/components/states'
import { cn } from '@/lib/cn'
import { statusStyle } from '@/lib/status'
import { formatDuration } from '@/lib/format'
import { exportStationsCsv } from '@/lib/exportCsv'

type SortKey = 'id' | 'name' | 'time' | 'utilisation'
type SortDir = 'asc' | 'desc'

export function StationsPage() {
  const { data: stations, isLoading, error, refetch } = useStations()
  const now = useNow()

  const [query, setQuery] = useState('')
  const [stage, setStage] = useState('all')
  const [status, setStatus] = useState('all')
  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir }>({
    key: 'id',
    dir: 'asc',
  })
  const [expanded, setExpanded] = useState<string | null>(null)

  const all = useMemo(() => stations ?? [], [stations])

  const stageOptions = useMemo(() => {
    const stages = Array.from(new Set(all.map((s) => s.stage)))
    return [
      { value: 'all', label: 'All stages' },
      ...stages.map((s) => ({ value: s, label: s })),
    ]
  }, [all])

  const statusOptions = [
    { value: 'all', label: 'All statuses' },
    ...STATION_STATUSES.map((s) => ({ value: s, label: statusStyle(s).label })),
  ]

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const result = all.filter((s) => {
      if (stage !== 'all' && s.stage !== stage) return false
      if (status !== 'all' && s.status !== status) return false
      if (!q) return true
      return (
        s.id.toLowerCase().includes(q) ||
        s.name.toLowerCase().includes(q) ||
        s.type.toLowerCase().includes(q)
      )
    })

    const dir = sort.dir === 'asc' ? 1 : -1
    return result.sort((a, b) => {
      switch (sort.key) {
        case 'name':
          return a.name.localeCompare(b.name) * dir
        case 'time':
          return (Date.parse(a.statusSince) - Date.parse(b.statusSince)) * dir
        case 'utilisation':
          return (a.utilisation24h - b.utilisation24h) * dir
        default:
          return a.id.localeCompare(b.id) * dir
      }
    })
  }, [all, query, stage, status, sort])

  const faultCount = all.filter((s) => s.status === 'faulted').length

  function toggleSort(key: SortKey) {
    setSort((prev) =>
      prev.key === key
        ? { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
        : { key, dir: 'asc' },
    )
  }

  return (
    <div className="px-6 py-5">
      <PageHeader
        title="Stations"
        subtitle={
          all.length > 0
            ? `${all.length} stations · ${faultCount} fault${faultCount === 1 ? '' : 's'}`
            : undefined
        }
      />

      {error ? (
        <Card>
          <ErrorState onRetry={() => refetch()} />
        </Card>
      ) : (
        <div className="space-y-4">
          <StatusSummary stations={all} />

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-56 flex-1">
              <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search station, name or type"
                aria-label="Search stations"
                className="w-full rounded-lg border border-slate-200 bg-white py-2 pr-3 pl-9 text-sm text-slate-700 placeholder:text-slate-400 hover:border-slate-300 focus:border-slate-400 focus:ring-2 focus:ring-slate-200 focus:outline-none"
              />
            </div>
            <Select
              ariaLabel="Filter by stage"
              value={stage}
              onChange={setStage}
              options={stageOptions}
            />
            <Select
              ariaLabel="Filter by status"
              value={status}
              onChange={setStatus}
              options={statusOptions}
            />
            <div className="ml-auto flex items-center gap-3">
              <span className="text-xs text-slate-500">
                {filtered.length} of {all.length} stations
              </span>
              <button
                type="button"
                onClick={() => exportStationsCsv(filtered)}
                disabled={filtered.length === 0}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                <Download className="h-4 w-4" />
                Export
              </button>
            </div>
          </div>

          {/* Table */}
          <Card className="overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
                  <SortableTh
                    label="ID"
                    active={sort.key === 'id'}
                    dir={sort.dir}
                    onClick={() => toggleSort('id')}
                    className="w-20 pl-5"
                  />
                  <SortableTh
                    label="Name"
                    active={sort.key === 'name'}
                    dir={sort.dir}
                    onClick={() => toggleSort('name')}
                  />
                  <th className="px-3 py-2.5 font-semibold">Stage</th>
                  <th className="px-3 py-2.5 font-semibold">Type</th>
                  <th className="px-3 py-2.5 font-semibold">Status</th>
                  <SortableTh
                    label="Time in state"
                    active={sort.key === 'time'}
                    dir={sort.dir}
                    onClick={() => toggleSort('time')}
                  />
                  <SortableTh
                    label="24h utilisation"
                    active={sort.key === 'utilisation'}
                    dir={sort.dir}
                    onClick={() => toggleSort('utilisation')}
                    className="w-44"
                  />
                  <th className="w-10 px-3 py-2.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading && all.length === 0 ? (
                  <LoadingRows />
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-12 text-center text-sm text-slate-400">
                      No stations match your filters.
                    </td>
                  </tr>
                ) : (
                  filtered.map((station) => (
                    <StationRow
                      key={station.id}
                      station={station}
                      now={now}
                      expanded={expanded === station.id}
                      onToggle={() =>
                        setExpanded((id) =>
                          id === station.id ? null : station.id,
                        )
                      }
                    />
                  ))
                )}
              </tbody>
            </table>
          </Card>
        </div>
      )}
    </div>
  )
}

function StationRow({
  station,
  now,
  expanded,
  onToggle,
}: {
  station: Station
  now: number
  expanded: boolean
  onToggle: () => void
}) {
  return (
    <>
      <tr
        onClick={onToggle}
        className={cn(
          'cursor-pointer transition-colors hover:bg-slate-50',
          expanded && 'bg-slate-50',
        )}
      >
        <td className="py-3 pl-5 font-medium text-slate-800">{station.id}</td>
        <td className="px-3 py-3 font-medium text-slate-800">{station.name}</td>
        <td className="px-3 py-3 text-slate-500">{station.stage}</td>
        <td className="px-3 py-3 text-slate-500">{station.type}</td>
        <td className="px-3 py-3">
          <StatusBadge status={station.status} />
        </td>
        <td className="px-3 py-3 text-slate-600 tabular-nums">
          {formatDuration(station.statusSince, now)}
        </td>
        <td className="px-3 py-3">
          <UtilisationBar value={station.utilisation24h} />
        </td>
        <td className="px-3 py-3 text-slate-400">
          {expanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={8} className="bg-slate-50/60 p-0">
            <div className="border-t border-slate-200">
              <StationDetail stationId={station.id} />
            </div>
          </td>
        </tr>
      )}
    </>
  )
}

function SortableTh({
  label,
  active,
  dir,
  onClick,
  className,
}: {
  label: string
  active: boolean
  dir: SortDir
  onClick: () => void
  className?: string
}) {
  return (
    <th className={cn('px-3 py-2.5 font-semibold', className)}>
      <button
        type="button"
        onClick={onClick}
        className={cn(
          'inline-flex items-center gap-1 uppercase hover:text-slate-600',
          active && 'text-slate-700',
        )}
      >
        {label}
        <span className={cn('text-[9px]', !active && 'opacity-0')}>
          {dir === 'asc' ? '▲' : '▼'}
        </span>
      </button>
    </th>
  )
}

function LoadingRows() {
  return (
    <>
      {Array.from({ length: 6 }).map((_, i) => (
        <tr key={i}>
          <td colSpan={8} className="px-5 py-3">
            <Skeleton className="h-6 w-full" />
          </td>
        </tr>
      ))}
    </>
  )
}

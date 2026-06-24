import { ChevronDown, ChevronRight } from 'lucide-react'
import type { Station } from '@/api/types'
import { cn } from '@/lib/cn'
import { formatDuration } from '@/lib/format'
import { StatusBadge } from './StatusBadge'
import { UtilisationBar } from './UtilisationBar'
import { StationDetail } from './StationDetail'
import { Skeleton } from './states'

export type StationSortKey = 'id' | 'name' | 'time' | 'utilisation'
export type SortDirection = 'asc' | 'desc'

export interface StationSort {
  key: StationSortKey
  direction: SortDirection
}

const SortableHeader = ({
  label,
  sortKey,
  sort,
  onSort,
  className,
}: {
  label: string
  sortKey: StationSortKey
  sort: StationSort
  onSort: (key: StationSortKey) => void
  className?: string
}) => {
  const isActive = sort.key === sortKey
  return (
    <th className={cn('px-3 py-2.5 font-semibold', className)}>
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={cn(
          'inline-flex items-center gap-1 uppercase hover:text-slate-600',
          isActive && 'text-slate-700',
        )}
      >
        {label}
        <span className={cn('text-[9px]', !isActive && 'opacity-0')}>
          {sort.direction === 'asc' ? '▲' : '▼'}
        </span>
      </button>
    </th>
  )
}

const StationRow = ({
  station,
  now,
  isExpanded,
  onToggle,
}: {
  station: Station
  now: number
  isExpanded: boolean
  onToggle: () => void
}) => (
  <>
    <tr
      onClick={onToggle}
      className={cn(
        'cursor-pointer transition-colors hover:bg-slate-50',
        isExpanded && 'bg-slate-50',
      )}
    >
      <td className="py-3 pl-4 font-medium text-slate-800 sm:pl-5">
        {station.id}
      </td>
      <td className="px-3 py-3 font-medium text-slate-800">{station.name}</td>
      <td className="hidden px-3 py-3 text-slate-500 md:table-cell">
        {station.stage}
      </td>
      <td className="hidden px-3 py-3 text-slate-500 lg:table-cell">
        {station.type}
      </td>
      <td className="px-3 py-3">
        <StatusBadge status={station.status} />
      </td>
      <td className="hidden px-3 py-3 text-slate-600 tabular-nums sm:table-cell">
        {formatDuration(station.statusSince, now)}
      </td>
      <td className="hidden px-3 py-3 sm:table-cell">
        <UtilisationBar value={station.utilisation24h} />
      </td>
      <td className="px-3 py-3 text-slate-400">
        {isExpanded ? (
          <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
      </td>
    </tr>
    {isExpanded && (
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

/**
 * Sortable, expandable stations table. Lower-priority columns (Stage, Type,
 * time, utilisation) drop out progressively on narrower screens, and the whole
 * table scrolls horizontally as a final fallback.
 */
export const StationsTable = ({
  stations,
  sort,
  onSort,
  expandedId,
  onToggleExpand,
  isLoading,
  now,
}: {
  stations: Station[]
  sort: StationSort
  onSort: (key: StationSortKey) => void
  expandedId: string | null
  onToggleExpand: (id: string) => void
  isLoading: boolean
  now: number
}) => (
  <div className="overflow-x-auto">
    <table className="w-full min-w-[480px] text-sm">
      <thead>
        <tr className="border-b border-slate-200 text-left text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
          <SortableHeader label="ID" sortKey="id" sort={sort} onSort={onSort} className="w-20 pl-4 sm:pl-5" />
          <SortableHeader label="Name" sortKey="name" sort={sort} onSort={onSort} />
          <th className="hidden px-3 py-2.5 font-semibold md:table-cell">Stage</th>
          <th className="hidden px-3 py-2.5 font-semibold lg:table-cell">Type</th>
          <th className="px-3 py-2.5 font-semibold">Status</th>
          <SortableHeader
            label="Time in state"
            sortKey="time"
            sort={sort}
            onSort={onSort}
            className="hidden sm:table-cell"
          />
          <SortableHeader
            label="24h utilisation"
            sortKey="utilisation"
            sort={sort}
            onSort={onSort}
            className="hidden w-44 sm:table-cell"
          />
          <th className="w-10 px-3 py-2.5" />
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {isLoading && stations.length === 0 ? (
          Array.from({ length: 6 }).map((_, index) => (
            <tr key={index}>
              <td colSpan={8} className="px-4 py-3 sm:px-5">
                <Skeleton className="h-6 w-full" />
              </td>
            </tr>
          ))
        ) : stations.length === 0 ? (
          <tr>
            <td colSpan={8} className="px-5 py-12 text-center text-sm text-slate-400">
              No stations match your filters.
            </td>
          </tr>
        ) : (
          stations.map((station) => (
            <StationRow
              key={station.id}
              station={station}
              now={now}
              isExpanded={expandedId === station.id}
              onToggle={() => onToggleExpand(station.id)}
            />
          ))
        )}
      </tbody>
    </table>
  </div>
)

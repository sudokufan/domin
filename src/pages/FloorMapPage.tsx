import { useState } from 'react'
import { MousePointerClick } from 'lucide-react'
import type { Station } from '@/api/types'
import { useStations } from '@/hooks/useStations'
import { useNow } from '@/hooks/useNow'
import { PageHeader } from '@/components/PageHeader'
import { StationCard } from '@/components/StationCard'
import { StationDetail } from '@/components/StationDetail'
import { StatusLegend } from '@/components/StatusLegend'
import { Card } from '@/components/Card'
import { EmptyState, ErrorState, Skeleton } from '@/components/states'
import { formatRelative } from '@/lib/format'

const GRID_COLS = 5
const GRID_ROWS = 2

export function FloorMapPage() {
  const { data: stations, isLoading, error, refetch, lastUpdated } = useStations()
  const now = useNow()
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const cellMap = new Map<string, Station>()
  for (const s of stations ?? []) {
    cellMap.set(`${s.layout.col}:${s.layout.row}`, s)
  }

  return (
    <div className="px-6 py-5">
      <PageHeader
        eyebrow="Production line · Site 1 · Bay A"
        title="Shop floor plan"
        actions={<StatusLegend />}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Floor plan */}
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5">
            <span className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
              Bay A · Line 1
            </span>
            <span className="text-[11px] text-slate-400">Scale 1:100</span>
          </div>

          {error ? (
            <ErrorState onRetry={() => refetch()} />
          ) : (
            <div className="rounded-b-xl bg-[repeating-linear-gradient(45deg,#fafafa,#fafafa_10px,#f4f5f7_10px,#f4f5f7_20px)] p-4">
              <div
                className="grid gap-3"
                style={{
                  gridTemplateColumns: `repeat(${GRID_COLS}, minmax(0, 1fr))`,
                  gridTemplateRows: `repeat(${GRID_ROWS}, 7rem)`,
                }}
              >
                {Array.from({ length: GRID_ROWS }).flatMap((_, row) =>
                  Array.from({ length: GRID_COLS }).map((__, col) => {
                    const station = cellMap.get(`${col}:${row}`)
                    const key = `${col}:${row}`
                    if (isLoading && !station) {
                      return <Skeleton key={key} className="h-full w-full rounded-md" />
                    }
                    if (!station) {
                      return (
                        <div
                          key={key}
                          className="rounded-md border border-dashed border-slate-200/80"
                          aria-hidden
                        />
                      )
                    }
                    return (
                      <StationCard
                        key={key}
                        station={station}
                        selected={selectedId === station.id}
                        onSelect={setSelectedId}
                      />
                    )
                  }),
                )}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between border-t border-slate-100 px-4 py-2 text-[11px] text-slate-400">
            <span>{stations?.length ?? 0} stations · Bay 36 m × 14 m</span>
            <span>
              Last sync{' '}
              {lastUpdated ? formatRelative(lastUpdated, now) : '—'}
            </span>
          </div>
        </Card>

        {/* Detail panel */}
        <Card className="lg:sticky lg:top-5 lg:h-[calc(100vh-7.5rem)]">
          {selectedId ? (
            <StationDetail
              stationId={selectedId}
              onClose={() => setSelectedId(null)}
            />
          ) : (
            <EmptyState
              icon={<MousePointerClick className="h-8 w-8" />}
              title="Select a station to see details"
              description="Live status, time-in-state, recent events and 24h utilisation."
              className="h-full"
            />
          )}
        </Card>
      </div>
    </div>
  )
}

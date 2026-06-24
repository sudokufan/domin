import { useState } from 'react'
import { useStations } from '@/hooks/useStations'
import { useNow } from '@/hooks/useNow'
import { PageHeader } from '@/components/PageHeader'
import { ProcessFlow } from '@/components/ProcessFlow'
import { StationInspectorPanel } from '@/components/StationInspectorPanel'
import { StatusLegend } from '@/components/StatusLegend'
import { Card } from '@/components/Card'
import { ErrorState, Skeleton } from '@/components/states'
import { formatRelative } from '@/lib/format'

export const FloorMapPage = () => {
  const { data: stations, isLoading, error, refetch, lastUpdated } = useStations()
  const now = useNow()
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const stationList = stations ?? []

  const handleSelect = (id: string) =>
    setSelectedId((current) => (current === id ? null : id))

  return (
    <div className="px-4 py-5 sm:px-6">
      <PageHeader
        eyebrow="Production line · Site 1 · Bay A"
        title="Shop floor plan"
        actions={<StatusLegend />}
      />

      <div className="grid grid-cols-1 gap-4 2xl:grid-cols-3">
        {/* Floor plan */}
        <Card className="2xl:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5">
            <span className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
              Bay A · Line 1
            </span>
            <span className="text-[11px] text-slate-400">Scale 1:100</span>
          </div>

          {error ? (
            <ErrorState onRetry={() => refetch()} />
          ) : (
            <div className="bg-[repeating-linear-gradient(45deg,#fafafa,#fafafa_10px,#f4f5f7_10px,#f4f5f7_20px)] p-4">
              {isLoading && stationList.length === 0 ? (
                <div className="flex flex-col gap-3 lg:flex-row">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <Skeleton key={index} className="h-28 w-full rounded-md lg:flex-1" />
                  ))}
                </div>
              ) : (
                <ProcessFlow
                  stations={stationList}
                  selectedId={selectedId}
                  onSelect={handleSelect}
                />
              )}
            </div>
          )}

          <div className="flex items-center justify-between border-t border-slate-100 px-4 py-2 text-[11px] text-slate-400">
            <span>{stationList.length} stations · Bay 36 m × 14 m</span>
            <span>
              Last sync {lastUpdated ? formatRelative(lastUpdated, now) : '—'}
            </span>
          </div>
        </Card>

        {/* Detail panel */}
        <StationInspectorPanel
          stationId={selectedId}
          onClose={() => setSelectedId(null)}
          className="2xl:sticky 2xl:top-5 2xl:max-h-[calc(100vh-7.5rem)] 2xl:overflow-hidden"
        />
      </div>
    </div>
  )
}

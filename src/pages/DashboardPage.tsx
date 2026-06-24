import { useState } from 'react'
import type { TimeRange } from '@/api/types'
import { useDashboard } from '@/hooks/useDashboard'
import { useStations } from '@/hooks/useStations'
import { PageHeader } from '@/components/PageHeader'
import { Card, CardHeader } from '@/components/Card'
import { KpiCard } from '@/components/KpiCard'
import { Sparkline } from '@/components/Sparkline'
import { UtilisationChart } from '@/components/UtilisationChart'
import { StatusTimeline } from '@/components/StatusTimeline'
import { StatusLegend } from '@/components/StatusLegend'
import { StationDetail } from '@/components/StationDetail'
import { TimeRangeToggle } from '@/components/TimeRangeToggle'
import { ErrorState, Skeleton } from '@/components/states'

const SAMPLE_LABEL: Record<TimeRange, string> = {
  '1h': '2 minutes',
  '4h': '10 minutes',
  '24h': '30 minutes',
}

const RANGE_LABEL: Record<TimeRange, string> = {
  '1h': 'last hour',
  '4h': 'last 4 hours',
  '24h': 'last 24 hours',
}

export function DashboardPage() {
  const [range, setRange] = useState<TimeRange>('24h')
  const { data, error, refetch } = useDashboard(range)
  const { data: stations } = useStations()
  const [selectedId, setSelectedId] = useState<string | null>(null)

  return (
    <div className="px-6 py-5">
      <PageHeader
        eyebrow="Production line · Site 1 · Bay A"
        title="Operational dashboard"
        actions={<TimeRangeToggle value={range} onChange={setRange} />}
      />

      {error ? (
        <Card>
          <ErrorState onRetry={() => refetch()} />
        </Card>
      ) : !data ? (
        <DashboardSkeleton />
      ) : (
        <div className="space-y-4">
          {/* KPIs */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard
              label={`Factory utilisation · ${range}`}
              value={`${data.factoryUtilisationPct}%`}
              delta={{ value: data.factoryUtilisationDeltaPp, unit: ' pp' }}
            >
              <Sparkline
                data={data.utilisationSeries.map((s) => s.utilisationPct)}
              />
            </KpiCard>

            <KpiCard
              label="Stations running"
              value={`${data.stationsRunning}/${data.stationsTotal}`}
              footer={`${data.stationsTotal - data.stationsRunning} not producing`}
            />

            <KpiCard
              label="Active faults"
              value={data.activeFaults.length}
              accent={data.activeFaults.length > 0 ? '#ef4444' : undefined}
              footer={
                data.activeFaults.length > 0
                  ? data.activeFaults.map((f) => f.stationId).join(', ')
                  : 'No active faults'
              }
            />

            <KpiCard
              label="Throughput · today"
              value={data.throughputToday}
              footer={`Target ${data.throughputTarget} · ${Math.round(
                (data.throughputToday / data.throughputTarget) * 100,
              )}%`}
            />
          </div>

          {/* Utilisation chart */}
          <Card>
            <CardHeader
              title="Factory utilisation"
              subtitle={`Fraction of stations running, sampled per ${SAMPLE_LABEL[range]}`}
              action={<StatusLegend />}
            />
            <div className="px-2 pt-2 pb-4">
              <UtilisationChart
                data={data.utilisationSeries}
                targetPct={data.utilisationTargetPct}
                range={range}
              />
            </div>
          </Card>

          {/* Status timeline */}
          <Card>
            <CardHeader
              title={`Status timeline · ${RANGE_LABEL[range]}`}
              action={
                <span className="text-xs text-slate-400">
                  Click a station to inspect
                </span>
              }
            />
            <div className="px-5 pt-3 pb-5">
              <StatusTimeline
                history={data.timeline}
                stations={stations ?? []}
                range={range}
                selectedId={selectedId}
                onSelect={(id) =>
                  setSelectedId((cur) => (cur === id ? null : id))
                }
              />
            </div>
          </Card>

          {/* Inline inspector */}
          {selectedId && (
            <Card className="overflow-hidden">
              <StationDetail
                stationId={selectedId}
                onClose={() => setSelectedId(null)}
              />
            </Card>
          )}
        </div>
      )}
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="p-4">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="mt-3 h-8 w-20" />
            <Skeleton className="mt-3 h-10 w-full" />
          </Card>
        ))}
      </div>
      <Card className="p-5">
        <Skeleton className="h-64 w-full" />
      </Card>
    </div>
  )
}

import { useState } from "react";
import type { TimeRange } from "@/api/types";
import { useDashboard } from "@/hooks/useDashboard";
import { useStations } from "@/hooks/useStations";
import { PageHeader } from "@/components/PageHeader";
import { Card, CardHeader } from "@/components/Card";
import { KpiCardContainer } from "@/components/KpiCardContainer";
import { UtilisationChart } from "@/components/UtilisationChart";
import { StatusTimeline } from "@/components/StatusTimeline";
import { StatusLegend } from "@/components/StatusLegend";
import { StationDetail } from "@/components/StationDetail";
import { TimeRangeToggle } from "@/components/TimeRangeToggle";
import { ErrorState, Skeleton } from "@/components/states";

const SAMPLE_LABEL: Record<TimeRange, string> = {
  "1h": "2 minutes",
  "4h": "10 minutes",
  "24h": "30 minutes",
};

const RANGE_LABEL: Record<TimeRange, string> = {
  "1h": "last hour",
  "4h": "last 4 hours",
  "24h": "last 24 hours",
};

const DashboardSkeleton = () => (
  <div className="space-y-4">
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <Card key={index} className="p-4">
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
);

export const DashboardPage = () => {
  const [range, setRange] = useState<TimeRange>("24h");
  const { data, error, refetch } = useDashboard(range);
  const { data: stations } = useStations();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <div className="px-4 py-5 sm:px-6">
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
          <KpiCardContainer data={data} range={range} />
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
            <div className="overflow-x-auto px-5 pt-3 pb-5">
              <div className="min-w-120">
                <StatusTimeline
                  history={data.timeline}
                  stations={stations ?? []}
                  range={range}
                  selectedId={selectedId}
                  onSelect={(id) =>
                    setSelectedId((current) => (current === id ? null : id))
                  }
                />
              </div>
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
  );
};

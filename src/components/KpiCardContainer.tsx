import type { DashboardData, TimeRange } from "@/api/types";
import { KpiCard } from "./KpiCard";
import { Sparkline } from "./Sparkline";

/** The four headline KPIs at the top of the dashboard. */
export const KpiCardContainer = ({
  data,
  range,
}: {
  data: DashboardData;
  range: TimeRange;
}) => {
  const throughputPct = Math.round(
    (data.throughputToday / data.throughputTarget) * 100,
  );

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <KpiCard
        label={`Factory utilisation · ${range}`}
        value={`${data.factoryUtilisationPct}%`}
        delta={{ value: data.factoryUtilisationDeltaPp, unit: " pp" }}
      >
        <Sparkline
          data={data.utilisationSeries.map((sample) => sample.utilisationPct)}
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
        accent={data.activeFaults.length > 0 ? "#ef4444" : undefined}
        footer={
          data.activeFaults.length > 0
            ? data.activeFaults.map((fault) => fault.stationId).join(", ")
            : "No active faults"
        }
      />

      <KpiCard
        label="Throughput · today"
        value={data.throughputToday}
        footer={`Target ${data.throughputTarget} · ${throughputPct}%`}
      />
    </div>
  );
};

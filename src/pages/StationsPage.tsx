import { useMemo, useState } from "react";
import { STATION_STATUSES } from "@/api/types";
import { useStations } from "@/hooks/useStations";
import { useNow } from "@/hooks/useNow";
import { PageHeader } from "@/components/PageHeader";
import { StatusSummary } from "@/components/StatusSummary";
import { StationFilters } from "@/components/StationFilters";
import {
  StationsTable,
  type StationSort,
  type StationSortKey,
} from "@/components/StationsTable";
import { Card } from "@/components/Card";
import { ErrorState } from "@/components/states";
import { statusStyle } from "@/lib/status";
import { exportStationsCsv } from "@/lib/exportCsv";

export const StationsPage = () => {
  const { data, isLoading, error, refetch } = useStations();
  const now = useNow();

  const [query, setQuery] = useState("");
  const [stage, setStage] = useState("all");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState<StationSort>({
    key: "id",
    direction: "asc",
  });
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const stations = useMemo(() => data ?? [], [data]);

  const stageOptions = useMemo(() => {
    const stages = Array.from(
      new Set(stations.map((station) => station.stage)),
    );
    return [
      { value: "all", label: "All stages" },
      ...stages.map((stageName) => ({ value: stageName, label: stageName })),
    ];
  }, [stations]);

  const statusOptions = [
    { value: "all", label: "All statuses" },
    ...STATION_STATUSES.map((statusValue) => ({
      value: statusValue,
      label: statusStyle(statusValue).label,
    })),
  ];

  const visibleStations = useMemo(() => {
    const normalisedQuery = query.trim().toLowerCase();
    const matches = stations.filter((station) => {
      if (stage !== "all" && station.stage !== stage) return false;
      if (status !== "all" && station.status !== status) return false;
      if (!normalisedQuery) return true;
      return (
        station.id.toLowerCase().includes(normalisedQuery) ||
        station.name.toLowerCase().includes(normalisedQuery) ||
        station.type.toLowerCase().includes(normalisedQuery)
      );
    });

    const direction = sort.direction === "asc" ? 1 : -1;
    return matches.sort((first, second) => {
      switch (sort.key) {
        case "name":
          return first.name.localeCompare(second.name) * direction;
        case "time":
          return (
            (Date.parse(first.statusSince) - Date.parse(second.statusSince)) *
            direction
          );
        case "utilisation":
          return (first.utilisation24h - second.utilisation24h) * direction;
        default:
          return first.id.localeCompare(second.id) * direction;
      }
    });
  }, [stations, query, stage, status, sort]);

  const faultCount = stations.filter(
    (station) => station.status === "faulted",
  ).length;

  const toggleSort = (key: StationSortKey) =>
    setSort((previous) =>
      previous.key === key
        ? {
            key,
            direction: previous.direction === "asc" ? "desc" : "asc",
          }
        : { key, direction: "asc" },
    );

  const toggleExpand = (id: string) =>
    setExpandedId((current) => (current === id ? null : id));

  return (
    <div className="px-4 py-5 sm:px-6">
      <PageHeader
        title="Stations"
        subtitle={
          stations.length > 0
            ? `${stations.length} stations · ${faultCount} fault${faultCount === 1 ? "" : "s"}`
            : undefined
        }
      />

      {error ? (
        <Card>
          <ErrorState onRetry={() => refetch()} />
        </Card>
      ) : (
        <div className="space-y-4">
          <StatusSummary stations={stations} />

          <StationFilters
            query={query}
            onQueryChange={setQuery}
            stage={stage}
            onStageChange={setStage}
            status={status}
            onStatusChange={setStatus}
            stageOptions={stageOptions}
            statusOptions={statusOptions}
            resultCount={visibleStations.length}
            totalCount={stations.length}
            onExport={() => exportStationsCsv(visibleStations)}
          />

          <Card className="overflow-hidden">
            <StationsTable
              stations={visibleStations}
              sort={sort}
              onSort={toggleSort}
              expandedId={expandedId}
              onToggleExpand={toggleExpand}
              isLoading={isLoading}
              now={now}
            />
          </Card>
        </div>
      )}
    </div>
  );
};

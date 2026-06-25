import type { Station } from "@/api/types";
import { statusStyle } from "./status";

const escapeCell = (value: string): string => {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
};

/** Build and download a CSV snapshot of the (filtered) station list. */
export const exportStationsCsv = (stations: Station[]) => {
  const headers = [
    "ID",
    "Name",
    "Stage",
    "Type",
    "Status",
    "Status since",
    "24h utilisation %",
    "Queued",
    "Processed",
  ];

  const rows = stations.map((station) => [
    station.id,
    station.name,
    station.stage,
    station.type,
    statusStyle(station.status).label,
    station.statusSince,
    String(Math.round(station.utilisation24h * 100)),
    String(station.partsQueued.length),
    String(station.partsProcessed.length),
  ]);

  const csv = [headers, ...rows]
    .map((row) => row.map(escapeCell).join(","))
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `stations-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
};

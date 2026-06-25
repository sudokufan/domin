import { Download, Search } from "lucide-react";
import { Select, type SelectOption } from "./Select";

/**
 * Search + stage/status filters and the export action for the stations table.
 * Fully controlled — the page owns the filter state.
 */
export const StationFilters = ({
  query,
  onQueryChange,
  stage,
  onStageChange,
  status,
  onStatusChange,
  stageOptions,
  statusOptions,
  resultCount,
  totalCount,
  onExport,
}: {
  query: string;
  onQueryChange: (value: string) => void;
  stage: string;
  onStageChange: (value: string) => void;
  status: string;
  onStatusChange: (value: string) => void;
  stageOptions: SelectOption[];
  statusOptions: SelectOption[];
  resultCount: number;
  totalCount: number;
  onExport: () => void;
}) => (
  <div className="flex flex-wrap items-center gap-3">
    <div className="relative min-w-48 flex-1">
      <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input
        type="search"
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
        placeholder="Search station, name or type"
        aria-label="Search stations"
        className="w-full rounded-lg border border-slate-200 bg-white py-2 pr-3 pl-9 text-sm text-slate-700 placeholder:text-slate-400 hover:border-slate-300 focus:border-slate-400 focus:ring-2 focus:ring-slate-200 focus:outline-none"
      />
    </div>

    <Select
      ariaLabel="Filter by stage"
      value={stage}
      onChange={onStageChange}
      options={stageOptions}
    />
    <Select
      ariaLabel="Filter by status"
      value={status}
      onChange={onStatusChange}
      options={statusOptions}
    />

    <div className="ml-auto flex items-center gap-3">
      <span className="text-xs text-slate-500">
        {resultCount} of {totalCount} stations
      </span>
      <button
        type="button"
        onClick={onExport}
        disabled={resultCount === 0}
        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
      >
        <Download className="h-4 w-4" />
        Export
      </button>
    </div>
  </div>
);

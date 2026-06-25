import type { Station } from "@/api/types";
import { clsx } from "clsx";
import { statusStyle } from "@/lib/status";
import { telemetryHeadline } from "@/lib/telemetry";

/**
 * A machine as it appears on the shop-floor plan: a status-coloured card with
 * the machine name, its headline telemetry, and queue/throughput counts.
 *
 * The card is a container-query context, so the status pill shows its label
 * when there's room and collapses to just a colour dot on narrow cards — it
 * never overflows regardless of how the flow is laid out.
 */
export const StationCard = ({
  station,
  isSelected,
  onSelect,
}: {
  station: Station;
  isSelected?: boolean;
  onSelect?: (id: string) => void;
}) => {
  const style = statusStyle(station.status);
  const headline = telemetryHeadline(station);

  return (
    <button
      type="button"
      onClick={() => onSelect?.(station.id)}
      aria-pressed={isSelected}
      className={clsx(
        "@container/card flex h-full w-full flex-col rounded-md border border-l-4 bg-white p-3 text-left shadow-sm transition",
        "hover:shadow-md focus:ring-2 focus:ring-emerald-400/60 focus:outline-none",
        isSelected
          ? "border-slate-300 ring-2 ring-emerald-400/60"
          : "border-slate-200",
      )}
      style={{ borderLeftColor: style.hex }}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="min-w-0 truncate text-[10px] font-medium tracking-wide text-slate-400 uppercase">
          {station.id} · {station.stage}
        </span>
        <span
          className={clsx(
            "inline-flex shrink-0 items-center gap-1.5 rounded-full px-1.5 py-0.5 text-xs font-medium",
            style.badge,
          )}
          title={style.label}
        >
          <span className={clsx("h-1.5 w-1.5 rounded-full", style.dot)} />
          <span className="hidden @[150px]/card:inline">{style.label}</span>
        </span>
      </div>

      <p className="mt-0.5 truncate text-sm font-semibold text-slate-800">
        {station.name}
      </p>

      <div className="mt-auto pt-3">
        {headline ? (
          <p className="truncate text-sm font-semibold text-slate-900">
            {headline}
          </p>
        ) : (
          <p className="truncate text-sm font-medium text-slate-400">
            {station.type}
          </p>
        )}
        <p className="mt-0.5 text-[11px] text-slate-400">
          Queue {station.partsQueued.length} · Done{" "}
          {station.partsProcessed.length}
        </p>
      </div>
    </button>
  );
};

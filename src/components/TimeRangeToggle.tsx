import type { TimeRange } from "@/api/types";
import { clsx } from "clsx";

const RANGES: TimeRange[] = ["1h", "4h", "24h"];

/** Segmented control for the dashboard time range. */
export const TimeRangeToggle = ({
  value,
  onChange,
}: {
  value: TimeRange;
  onChange: (range: TimeRange) => void;
}) => (
  <div
    role="group"
    aria-label="Time range"
    className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5"
  >
    {RANGES.map((range) => (
      <button
        key={range}
        type="button"
        aria-pressed={value === range}
        onClick={() => onChange(range)}
        className={clsx(
          "rounded-md px-3 py-1 text-xs font-medium transition-colors",
          value === range
            ? "bg-slate-900 text-white"
            : "text-slate-500 hover:text-slate-800",
        )}
      >
        {range}
      </button>
    ))}
  </div>
);

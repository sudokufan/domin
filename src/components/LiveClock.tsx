import { useNow } from "@/hooks/useNow";
import { formatClock, formatShortDate } from "@/lib/format";
import { PingDot } from "./PingDot";

/**
 * The header "live" pill: a pulsing dot plus the current time and date,
 * ticking every second via useNow. Self-contained — drop it in anywhere a
 * live-status indicator is wanted. Label/date hide progressively on narrow
 * screens.
 */
export const LiveClock = () => {
  const now = useNow();
  return (
    <div className="flex items-center gap-2 rounded-full border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 sm:px-3">
      <PingDot
        color="bg-emerald-500"
        pingColor="bg-emerald-400"
        title="Live data"
      />
      <span className="hidden text-slate-700 sm:inline">Live</span>
      <span className="hidden text-slate-300 sm:inline">·</span>
      <span className="tabular-nums">{formatClock(now)}</span>
      <span className="hidden text-slate-400 md:inline">
        {formatShortDate(now)}
      </span>
    </div>
  );
};

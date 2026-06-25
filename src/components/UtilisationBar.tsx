import { clsx } from "clsx";

/**
 * Horizontal utilisation bar with a trailing percentage, as seen in the
 * stations table and detail panel. Colour shifts to amber/red as utilisation
 * drops below healthy thresholds so the eye is drawn to laggards.
 */
export const UtilisationBar = ({
  value,
  className,
  showLabel = true,
}: {
  /** 0..1 */
  value: number;
  className?: string;
  showLabel?: boolean;
}) => {
  const percent = Math.round(value * 100);
  const color =
    percent >= 70
      ? "bg-emerald-500"
      : percent >= 40
        ? "bg-amber-500"
        : "bg-red-500";

  return (
    <div className={clsx("flex items-center gap-2", className)}>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className={clsx("h-full rounded-full transition-all", color)}
          style={{ width: `${percent}%` }}
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
      {showLabel && (
        <span className="w-9 shrink-0 text-right text-xs font-medium text-slate-600 tabular-nums">
          {percent}%
        </span>
      )}
    </div>
  );
};

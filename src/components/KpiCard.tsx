import type { ReactNode } from "react";
import { TrendingDown, TrendingUp } from "lucide-react";
import { Card } from "./Card";
import { clsx } from "clsx";

export interface KpiDelta {
  /** Percentage-point (or unit) change; sign drives the arrow + colour. */
  value: number;
  unit?: string;
}

/**
 * A single dashboard KPI: label, large value with optional trend delta, a
 * footer line, and an optional visual (e.g. a sparkline) in the lower slot.
 */
export const KpiCard = ({
  label,
  value,
  delta,
  footer,
  children,
  accent,
}: {
  label: string;
  value: ReactNode;
  delta?: KpiDelta;
  footer?: ReactNode;
  children?: ReactNode;
  /** Optional colour for the value, e.g. red for active faults. */
  accent?: string;
}) => {
  const isPositive = delta != null && delta.value >= 0;
  return (
    <Card className="flex flex-col p-4">
      <p className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
        {label}
      </p>
      <div className="mt-1.5 flex items-baseline gap-2">
        <span
          className="text-3xl font-semibold tracking-tight text-slate-900 tabular-nums"
          style={accent ? { color: accent } : undefined}
        >
          {value}
        </span>
        {delta != null && (
          <span
            className={clsx(
              "flex items-center gap-0.5 text-xs font-medium",
              isPositive ? "text-emerald-600" : "text-red-600",
            )}
          >
            {isPositive ? (
              <TrendingUp className="h-3.5 w-3.5" />
            ) : (
              <TrendingDown className="h-3.5 w-3.5" />
            )}
            {Math.abs(delta.value)}
            {delta.unit ?? ""}
          </span>
        )}
      </div>
      {footer && <p className="mt-1 text-xs text-slate-500">{footer}</p>}
      {children && <div className="mt-2 flex-1">{children}</div>}
    </Card>
  );
};

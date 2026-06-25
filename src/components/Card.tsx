import type { ReactNode } from "react";
import { clsx } from "clsx";

/** White surface used for every panel/card in the UI. */
export const Card = ({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) => (
  <div
    className={clsx(
      "rounded-xl border border-slate-200 bg-white shadow-sm",
      className,
    )}
  >
    {children}
  </div>
);

export const CardHeader = ({
  title,
  subtitle,
  action,
  className,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
  className?: string;
}) => (
  <div
    className={clsx(
      "flex flex-wrap items-start justify-between gap-3 px-5 pt-4",
      className,
    )}
  >
    <div>
      <h2 className="text-sm font-semibold text-slate-800">{title}</h2>
      {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
    </div>
    {action}
  </div>
);

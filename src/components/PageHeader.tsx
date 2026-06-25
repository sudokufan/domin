import type { ReactNode } from "react";

/**
 * Section header used at the top of each page: an optional uppercase eyebrow
 * (e.g. "PRODUCTION LINE · SITE 1 · BAY A"), the page title with an inline
 * descriptor, and an optional actions slot on the right.
 */
export const PageHeader = ({
  eyebrow,
  title,
  subtitle,
  actions,
}: {
  eyebrow?: ReactNode;
  title: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
}) => (
  <div className="mb-5">
    {eyebrow && (
      <p className="mb-1 text-[11px] font-semibold tracking-widest text-slate-400 uppercase">
        {eyebrow}
      </p>
    )}
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div className="flex items-baseline gap-2.5">
        <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
        {subtitle && <span className="text-sm text-slate-500">{subtitle}</span>}
      </div>
      {actions}
    </div>
  </div>
);

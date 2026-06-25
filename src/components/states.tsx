import type { ReactNode } from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { clsx } from 'clsx'

/** Grey shimmer block for loading placeholders. */
export const Skeleton = ({ className }: { className?: string }) => (
  <div className={clsx('animate-pulse rounded bg-slate-200/70', className)} />
)

export const EmptyState = ({
  icon,
  title,
  description,
  className,
}: {
  icon?: ReactNode
  title: string
  description?: string
  className?: string
}) => (
  <div
    className={clsx(
      'flex flex-col items-center justify-center gap-2 px-6 py-12 text-center',
      className,
    )}
  >
    {icon && <div className="text-slate-300">{icon}</div>}
    <p className="text-sm font-medium text-slate-600">{title}</p>
    {description && (
      <p className="max-w-xs text-xs text-slate-400">{description}</p>
    )}
  </div>
)

export const ErrorState = ({
  message,
  onRetry,
  className,
}: {
  message?: string
  onRetry?: () => void
  className?: string
}) => (
  <div
    className={clsx(
      'flex flex-col items-center justify-center gap-3 px-6 py-12 text-center',
      className,
    )}
    role="alert"
  >
    <AlertCircle className="h-8 w-8 text-red-400" />
    <div>
      <p className="text-sm font-medium text-slate-700">Couldn’t load data</p>
      <p className="mt-0.5 text-xs text-slate-400">
        {message ?? 'The factory API did not respond.'}
      </p>
    </div>
    {onRetry && (
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
      >
        <RefreshCw className="h-3.5 w-3.5" />
        Retry
      </button>
    )}
  </div>
)

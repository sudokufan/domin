import type { StationStatus } from '@/api/types'
import { cn } from '@/lib/cn'
import { statusStyle } from '@/lib/status'

export const StatusDot = ({
  status,
  className,
  ping = false,
}: {
  status: StationStatus
  className?: string
  ping?: boolean
}) => {
  const style = statusStyle(status)
  if (ping && status === 'running') {
    return (
      <span className={cn('relative flex h-2 w-2', className)}>
        <span className={cn('absolute inline-flex h-full w-full animate-ping rounded-full opacity-75', style.dot)} />
        <span className={cn('relative inline-flex h-2 w-2 rounded-full', style.dot)} />
      </span>
    )
  }
  return <span className={cn('inline-block h-2 w-2 rounded-full', style.dot, className)} />
}

export const StatusBadge = ({
  status,
  className,
}: {
  status: StationStatus
  className?: string
}) => {
  const style = statusStyle(status)
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap',
        style.badge,
        className,
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', style.dot)} />
      {style.label}
    </span>
  )
}

import type { StationStatus } from '@/api/types'
import { clsx } from 'clsx'
import { statusStyle } from '@/lib/status'
import { PingDot } from './PingDot'

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
    return <PingDot color={style.dot} className={className} />
  }
  return <span className={clsx('inline-block h-2 w-2 rounded-full', style.dot, className)} />
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
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap',
        style.badge,
        className,
      )}
    >
      <span className={clsx('h-1.5 w-1.5 rounded-full', style.dot)} />
      {style.label}
    </span>
  )
}

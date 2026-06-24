import { cn } from '@/lib/cn'

/**
 * Horizontal utilisation bar with a trailing percentage, as seen in the
 * stations table and detail panel. Colour shifts to amber/red as utilisation
 * drops below healthy thresholds so the eye is drawn to laggards.
 */
export function UtilisationBar({
  value,
  className,
  showLabel = true,
}: {
  /** 0..1 */
  value: number
  className?: string
  showLabel?: boolean
}) {
  const pct = Math.round(value * 100)
  const color =
    pct >= 70 ? 'bg-emerald-500' : pct >= 40 ? 'bg-amber-500' : 'bg-red-500'

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className={cn('h-full rounded-full transition-all', color)}
          style={{ width: `${pct}%` }}
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
      {showLabel && (
        <span className="w-9 shrink-0 text-right text-xs font-medium text-slate-600 tabular-nums">
          {pct}%
        </span>
      )}
    </div>
  )
}

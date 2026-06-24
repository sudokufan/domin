import type { TimeRange } from '@/api/types'
import { cn } from '@/lib/cn'

const RANGES: TimeRange[] = ['1h', '4h', '24h']

/** Segmented control for the dashboard time range. */
export function TimeRangeToggle({
  value,
  onChange,
}: {
  value: TimeRange
  onChange: (range: TimeRange) => void
}) {
  return (
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
          className={cn(
            'rounded-md px-3 py-1 text-xs font-medium transition-colors',
            value === range
              ? 'bg-slate-900 text-white'
              : 'text-slate-500 hover:text-slate-800',
          )}
        >
          {range}
        </button>
      ))}
    </div>
  )
}

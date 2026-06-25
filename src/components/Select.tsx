import { ChevronDown } from 'lucide-react'
import { clsx } from 'clsx'

export interface SelectOption {
  value: string
  label: string
}

/** Lightweight styled native select used for the table filters. */
export const Select = ({
  value,
  options,
  onChange,
  ariaLabel,
  className,
}: {
  value: string
  options: SelectOption[]
  onChange: (value: string) => void
  ariaLabel: string
  className?: string
}) => (
  <div className={clsx('relative', className)}>
    <select
      aria-label={ariaLabel}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="w-full appearance-none rounded-lg border border-slate-200 bg-white py-2 pr-8 pl-3 text-sm text-slate-700 hover:border-slate-300 focus:border-slate-400 focus:ring-2 focus:ring-slate-200 focus:outline-none"
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
    <ChevronDown className="pointer-events-none absolute top-1/2 right-2.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
  </div>
)

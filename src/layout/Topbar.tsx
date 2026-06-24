import { useLocation } from 'react-router-dom'
import { Bell, ChevronRight } from 'lucide-react'
import { useNow } from '@/hooks/useNow'
import { formatClock, formatShortDate } from '@/lib/format'
import { routeLabel } from './routeMeta'

export function Topbar() {
  const { pathname } = useLocation()
  const now = useNow()
  const label = routeLabel(pathname)

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb">
        <ol className="flex items-center gap-1.5 text-sm text-slate-400">
          <li>Factory Status</li>
          <li aria-hidden>
            <ChevronRight className="h-3.5 w-3.5" />
          </li>
          <li className="font-medium text-slate-700">{label}</li>
        </ol>
      </nav>

      {/* Live clock + notifications */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600">
          <span className="relative flex h-2 w-2" title="Live data">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          <span className="text-slate-700">Live</span>
          <span className="text-slate-300">·</span>
          <span className="tabular-nums">{formatClock(now)}</span>
          <span className="text-slate-400">{formatShortDate(now)}</span>
        </div>

        <button
          type="button"
          aria-label="Notifications"
          className="relative rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
        >
          <Bell className="h-[18px] w-[18px]" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
        </button>
      </div>
    </header>
  )
}

import { useLocation } from 'react-router-dom'
import { Bell, ChevronRight, Menu } from 'lucide-react'
import { useNow } from '@/hooks/useNow'
import { formatClock, formatShortDate } from '@/lib/format'
import { routeLabel } from './routeMeta'

export const Topbar = ({ onMenuClick }: { onMenuClick: () => void }) => {
  const { pathname } = useLocation()
  const now = useNow()
  const label = routeLabel(pathname)

  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-2 border-b border-slate-200 bg-white px-4 sm:px-6">
      <div className="flex min-w-0 items-center gap-1.5">
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Open navigation"
          className="-ml-1 rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>

        <nav aria-label="Breadcrumb" className="min-w-0">
          <ol className="flex items-center gap-1.5 text-sm text-slate-400">
            <li className="hidden sm:block">Factory Status</li>
            <li aria-hidden className="hidden sm:block">
              <ChevronRight className="h-3.5 w-3.5" />
            </li>
            <li className="truncate font-medium text-slate-700">{label}</li>
          </ol>
        </nav>
      </div>

      {/* Live clock + notifications */}
      <div className="flex items-center gap-2 sm:gap-4">
        <div className="flex items-center gap-2 rounded-full border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 sm:px-3">
          <span className="relative flex h-2 w-2" title="Live data">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          <span className="hidden text-slate-700 sm:inline">Live</span>
          <span className="hidden text-slate-300 sm:inline">·</span>
          <span className="tabular-nums">{formatClock(now)}</span>
          <span className="hidden text-slate-400 md:inline">
            {formatShortDate(now)}
          </span>
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

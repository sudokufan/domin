import { NavLink } from 'react-router-dom'
import {
  AlertTriangle,
  ClipboardList,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Map,
  Package,
  FileText,
  Settings,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/cn'

interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  badge?: number
}

interface NavSection {
  heading: string
  items: NavItem[]
}

const SECTIONS: NavSection[] = [
  {
    heading: 'Factory status',
    items: [
      { to: '/stations', label: 'Stations', icon: ListChecks },
      { to: '/floor-map', label: 'Floor map', icon: Map },
      { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    ],
  },
  {
    heading: 'Production',
    items: [
      { to: '/jobs', label: 'Jobs', icon: ClipboardList },
      { to: '/valves', label: 'Valves', icon: Package },
      { to: '/reports', label: 'Reports', icon: FileText },
      { to: '/alerts', label: 'Alerts', icon: AlertTriangle, badge: 1 },
    ],
  },
  {
    heading: 'Account',
    items: [{ to: '/settings', label: 'Settings', icon: Settings }],
  },
]

/**
 * Primary navigation. A static rail from `lg` up; below that it becomes an
 * off-canvas drawer toggled by the Topbar hamburger, with a tap-to-dismiss
 * backdrop. Selecting an item closes the drawer.
 */
export const Sidebar = ({
  isOpen,
  onClose,
}: {
  isOpen: boolean
  onClose: () => void
}) => (
  <>
    <div
      className={cn(
        'fixed inset-0 z-30 bg-slate-900/50 lg:hidden',
        isOpen ? 'block' : 'hidden',
      )}
      onClick={onClose}
      aria-hidden
    />

    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-40 flex h-full w-60 shrink-0 flex-col bg-sidebar text-slate-300 transition-transform duration-200 lg:static lg:translate-x-0',
        isOpen ? 'translate-x-0' : '-translate-x-full',
      )}
    >
      {/* Brand */}
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded-md bg-emerald-500/15 text-sm font-bold text-emerald-400">
            D
          </span>
          <span className="text-lg font-bold tracking-tight text-white">
            DOMIN
          </span>
        </div>
        <div className="mt-2 flex items-center gap-1.5 text-[11px] font-medium tracking-wide text-sidebar-muted uppercase">
          <span>Factory Status</span>
          <span className="flex items-center gap-1 text-emerald-400">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
            </span>
            Live
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-2">
        {SECTIONS.map((section) => (
          <div key={section.heading} className="mb-5">
            <p className="px-2 pb-1.5 text-[10px] font-semibold tracking-widest text-slate-500 uppercase">
              {section.heading}
            </p>
            <ul className="space-y-0.5">
              {section.items.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    onClick={onClose}
                    className={({ isActive }) =>
                      cn(
                        'group flex items-center gap-3 rounded-md px-2.5 py-2 text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-emerald-500/10 text-emerald-300'
                          : 'text-slate-400 hover:bg-white/5 hover:text-slate-100',
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <item.icon
                          className={cn(
                            'h-[18px] w-[18px] shrink-0',
                            isActive
                              ? 'text-emerald-400'
                              : 'text-slate-500 group-hover:text-slate-300',
                          )}
                        />
                        <span className="flex-1">{item.label}</span>
                        {item.badge != null && (
                          <span className="grid h-5 min-w-5 place-items-center rounded-full bg-red-500 px-1 text-[11px] font-semibold text-white">
                            {item.badge}
                          </span>
                        )}
                      </>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      {/* User footer */}
      <div className="flex items-center gap-3 border-t border-white/5 px-4 py-3">
        <span className="grid h-9 w-9 place-items-center rounded-full bg-emerald-500 text-sm font-semibold text-white">
          JM
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-white">James Marsden</p>
          <p className="truncate text-xs text-slate-500">Operations</p>
        </div>
        <button
          type="button"
          aria-label="Sign out"
          className="rounded-md p-1.5 text-slate-500 hover:bg-white/5 hover:text-slate-200"
        >
          <LogOut className="h-[18px] w-[18px]" />
        </button>
      </div>
    </aside>
  </>
)

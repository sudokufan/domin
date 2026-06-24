import { Construction } from 'lucide-react'
import { PageHeader } from '@/components/PageHeader'

/**
 * Placeholder for the Production/Account areas. These are intentionally out of
 * scope for this build; the route + nav wiring is in place so they're easy to
 * fill in later.
 */
export function StubPage({ title }: { title: string }) {
  return (
    <div className="px-6 py-5">
      <PageHeader title={title} subtitle="Live status" />
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-slate-300 bg-white/50 py-24 text-center">
        <Construction className="h-8 w-8 text-slate-300" />
        <p className="text-sm font-medium text-slate-600">
          {title} is not part of this prototype
        </p>
        <p className="max-w-sm text-xs text-slate-400">
          The navigation and routing are wired up; this screen focuses on the
          three Factory Status views (Stations, Floor map, Dashboard).
        </p>
      </div>
    </div>
  )
}

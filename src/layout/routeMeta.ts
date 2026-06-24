/** Breadcrumb labels per route. Keeps the Topbar free of route-specific logic. */
export const ROUTE_LABELS: Record<string, string> = {
  '/stations': 'Stations',
  '/floor-map': 'Floor map',
  '/dashboard': 'Dashboard',
  '/jobs': 'Jobs',
  '/valves': 'Valves',
  '/reports': 'Reports',
  '/alerts': 'Alerts',
  '/settings': 'Settings',
}

export function routeLabel(pathname: string): string {
  return ROUTE_LABELS[pathname] ?? 'Overview'
}

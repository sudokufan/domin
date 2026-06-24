import type { StationStatus } from '@/api/types'

export interface StatusStyle {
  label: string
  /** Solid colour (dots, timeline segments, chart strokes). */
  hex: string
  /** Tailwind class for a solid dot. */
  dot: string
  /** Tailwind classes for a soft badge/pill. */
  badge: string
  /** Tailwind text colour. */
  text: string
}

/**
 * Single source of truth for how each status looks. Charts read `hex`;
 * everything else uses the Tailwind class strings so the palette stays
 * consistent across the app.
 */
export const STATUS_STYLES: Record<StationStatus, StatusStyle> = {
  running: {
    label: 'Running',
    hex: '#22c55e',
    dot: 'bg-status-running',
    badge: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20',
    text: 'text-emerald-700',
  },
  idle: {
    label: 'Idle',
    hex: '#f59e0b',
    dot: 'bg-status-idle',
    badge: 'bg-amber-50 text-amber-700 ring-1 ring-amber-600/20',
    text: 'text-amber-700',
  },
  faulted: {
    label: 'Faulted',
    hex: '#ef4444',
    dot: 'bg-status-faulted',
    badge: 'bg-red-50 text-red-700 ring-1 ring-red-600/20',
    text: 'text-red-700',
  },
  maintenance: {
    label: 'Maintenance',
    hex: '#6366f1',
    dot: 'bg-status-maintenance',
    badge: 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-600/20',
    text: 'text-indigo-700',
  },
}

export function statusStyle(status: StationStatus): StatusStyle {
  return STATUS_STYLES[status]
}

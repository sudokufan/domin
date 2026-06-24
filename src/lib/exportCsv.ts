import type { Station } from '@/api/types'
import { statusStyle } from './status'

/** Build and download a CSV snapshot of the (filtered) station list. */
export function exportStationsCsv(stations: Station[]) {
  const headers = [
    'ID',
    'Name',
    'Stage',
    'Type',
    'Status',
    'Status since',
    '24h utilisation %',
    'Queued',
    'Processed',
  ]

  const rows = stations.map((s) => [
    s.id,
    s.name,
    s.stage,
    s.type,
    statusStyle(s.status).label,
    s.statusSince,
    String(Math.round(s.utilisation24h * 100)),
    String(s.partsQueued.length),
    String(s.partsProcessed.length),
  ])

  const csv = [headers, ...rows]
    .map((row) => row.map(escapeCell).join(','))
    .join('\n')

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `stations-${new Date().toISOString().slice(0, 10)}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

function escapeCell(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`
  return value
}

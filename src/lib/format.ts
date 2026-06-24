/** Formatting helpers for times, durations and counts. */

/** "2h 14m" / "43m" / "27s" — compact time-in-state from a start timestamp. */
export const formatDuration = (
  fromIso: string,
  now: number = Date.now(),
): string => {
  const elapsedMs = Math.max(0, now - Date.parse(fromIso))
  const totalMinutes = Math.floor(elapsedMs / 60_000)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  if (hours > 0) return `${hours}h ${String(minutes).padStart(2, '0')}m`
  if (totalMinutes > 0) return `${totalMinutes}m`
  return `${Math.floor(elapsedMs / 1000)}s`
}

/** "1 second ago" / "12 seconds ago" / "3 minutes ago". */
export const formatRelative = (
  epochMs: number,
  now: number = Date.now(),
): string => {
  const seconds = Math.max(0, Math.round((now - epochMs) / 1000))
  if (seconds < 60) return `${seconds} second${seconds === 1 ? '' : 's'} ago`
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`
  const hours = Math.round(minutes / 60)
  return `${hours} hour${hours === 1 ? '' : 's'} ago`
}

/** "13:05" 24-hour clock. */
export const formatClock = (epochMs: number): string =>
  new Date(epochMs).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  })

/** "Sat 9 May" short date. */
export const formatShortDate = (epochMs: number): string =>
  new Date(epochMs).toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })

/** "09:30" axis label for a timestamp. */
export const formatAxisTime = (iso: string): string =>
  new Date(iso).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  })

/** 0..1 → "56%". */
export const formatPercent = (fraction: number): string =>
  `${Math.round(fraction * 100)}%`

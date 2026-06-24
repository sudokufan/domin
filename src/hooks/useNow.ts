import { useEffect, useState } from 'react'

/**
 * A ticking clock, used for the live header time and for "time in state" /
 * "last sync" labels that must advance even between polls. Updates on a plain
 * interval — no data fetching involved, so it doesn't belong in React Query.
 */
export const useNow = (intervalMs = 1000): number => {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const intervalId = setInterval(() => setNow(Date.now()), intervalMs)
    return () => clearInterval(intervalId)
  }, [intervalMs])
  return now
}

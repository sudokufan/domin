import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { TimeRange, UtilisationSample } from '@/api/types'
import { useNow } from '@/hooks/useNow'

const tickLabel = (iso: string, range: TimeRange, now: number): string => {
  if (range === '24h') {
    const hoursAgo = Math.round((now - Date.parse(iso)) / 3_600_000)
    return hoursAgo <= 0 ? 'now' : `-${hoursAgo}h`
  }
  return new Date(iso).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Factory utilisation over time — the fraction of stations running, sampled
 * across the selected range, with the utilisation target drawn as a reference
 * line so it's obvious when the line dips below target.
 */
export const UtilisationChart = ({
  data,
  targetPct,
  range,
}: {
  data: UtilisationSample[]
  targetPct: number
  range: TimeRange
}) => {
  // Relative axis labels only need minute-level freshness.
  const now = useNow(60_000)
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 8, right: 16, bottom: 4, left: 0 }}>
        <defs>
          <linearGradient id="utilFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22c55e" stopOpacity={0.18} />
            <stop offset="100%" stopColor="#22c55e" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="#eef1f4" vertical={false} />
        <XAxis
          dataKey="timestamp"
          tickFormatter={(value: string) => tickLabel(value, range, now)}
          tick={{ fontSize: 11, fill: '#94a3b8' }}
          axisLine={false}
          tickLine={false}
          minTickGap={48}
        />
        <YAxis
          domain={[0, 100]}
          ticks={[0, 25, 50, 75, 100]}
          tickFormatter={(value: number) => `${value}%`}
          tick={{ fontSize: 11, fill: '#94a3b8' }}
          axisLine={false}
          tickLine={false}
          width={48}
        />
        <Tooltip
          cursor={{ stroke: '#cbd5e1', strokeDasharray: '4 4' }}
          contentStyle={{
            borderRadius: 8,
            border: '1px solid #e2e8f0',
            fontSize: 12,
            boxShadow: '0 4px 12px rgb(0 0 0 / 0.06)',
          }}
          labelFormatter={(value) =>
            new Date(value).toLocaleString('en-GB', {
              hour: '2-digit',
              minute: '2-digit',
              day: 'numeric',
              month: 'short',
            })
          }
          formatter={(value) => [`${value}% running`, 'Utilisation']}
        />
        <ReferenceLine
          y={targetPct}
          stroke="#16a34a"
          strokeDasharray="5 5"
          strokeOpacity={0.6}
          label={{
            value: `Target ${targetPct}%`,
            position: 'insideTopRight',
            fill: '#16a34a',
            fontSize: 11,
          }}
        />
        <Area
          type="monotone"
          dataKey="utilisationPct"
          stroke="#22c55e"
          strokeWidth={2}
          fill="url(#utilFill)"
          dot={false}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

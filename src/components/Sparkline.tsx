import { Area, AreaChart, ResponsiveContainer, YAxis } from 'recharts'

/** Tiny axis-less area chart for KPI cards. */
export const Sparkline = ({
  data,
  color = '#22c55e',
  height = 40,
}: {
  data: number[]
  color?: string
  height?: number
}) => {
  const points = data.map((value, index) => ({ index, value }))
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={points} margin={{ top: 2, bottom: 2, left: 0, right: 0 }}>
        <YAxis hide domain={['dataMin - 5', 'dataMax + 5']} />
        <Area
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={1.5}
          fill={color}
          fillOpacity={0.12}
          dot={false}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}

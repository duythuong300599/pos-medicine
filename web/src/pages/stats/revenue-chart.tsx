import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { Card } from '@/components/ui/card'
import type { DailyRevenue } from '@/lib/dashboard-utils'

interface RevenueChartProps {
  data: DailyRevenue[]
}

const fmt = new Intl.NumberFormat('vi-VN')

export function RevenueChart({ data }: RevenueChartProps) {
  return (
    <Card className="p-4">
      <p className="mb-4 text-sm font-semibold">Doanh thu theo ngày</p>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} barCategoryGap="30%">
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: number) =>
              v >= 1_000_000 ? `${(v / 1_000_000).toFixed(0)}M` : `${(v / 1_000).toFixed(0)}k`
            }
            width={36}
          />
          <Tooltip
            cursor={{ fill: 'hsl(var(--muted))' }}
            formatter={(value) => [`${fmt.format(value as number)}đ`, 'Doanh thu']}
            labelFormatter={(label) => `Ngày ${label}`}
            contentStyle={{ fontSize: 12, borderRadius: 8 }}
          />
          <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  )
}

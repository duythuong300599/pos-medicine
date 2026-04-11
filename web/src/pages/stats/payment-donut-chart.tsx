import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts'
import { Card } from '@/components/ui/card'
import type { PaymentSplit } from '@/lib/dashboard-utils'

interface PaymentDonutChartProps {
  data: PaymentSplit
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--muted-foreground))']
const fmt = new Intl.NumberFormat('vi-VN')

export function PaymentDonutChart({ data }: PaymentDonutChartProps) {
  const total = data.cash + data.qr
  const chartData = [
    { name: 'Tiền mặt', value: data.cash },
    { name: 'Chuyển khoản', value: data.qr },
  ]

  return (
    <Card className="p-4">
      <p className="mb-4 text-sm font-semibold">Phương thức thanh toán</p>
      {total === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">Không có dữ liệu</p>
      ) : (
        <ResponsiveContainer width="100%" height={180}>
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={70}
              paddingAngle={2}
            >
              {chartData.map((_, i) => (
                <Cell key={i} fill={COLORS[i]} />
              ))}
            </Pie>
            <Legend
              formatter={(value: string, entry: { payload?: { value?: number } }) => {
                const amount = entry.payload?.value ?? 0
                const pct = total > 0 ? ((amount / total) * 100).toFixed(0) : '0'
                return `${value}: ${fmt.format(amount)}đ (${pct}%)`
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      )}
    </Card>
  )
}

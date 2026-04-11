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
        <ResponsiveContainer width="100%" height={190}>
          <PieChart>
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="45%"
              innerRadius={52}
              outerRadius={76}
              paddingAngle={3}
            >
              {chartData.map((_, i) => (
                <Cell key={i} fill={COLORS[i]} />
              ))}
            </Pie>
            <Legend
              iconSize={8}
              iconType="circle"
              formatter={(value: string, entry: { payload?: { value?: number } }) => {
                const amount = entry.payload?.value ?? 0
                const pct = total > 0 ? ((amount / total) * 100).toFixed(0) : '0'
                return (
                  <span style={{ fontSize: 12 }}>
                    {value} ({pct}%) — {fmt.format(amount)}đ
                  </span>
                )
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      )}
    </Card>
  )
}

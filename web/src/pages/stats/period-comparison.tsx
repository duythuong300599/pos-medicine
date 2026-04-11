import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { PeriodComparison as PeriodComparisonData } from '@/lib/dashboard-utils'

interface PeriodComparisonProps {
  data: PeriodComparisonData
}

interface ComparisonRow {
  label: string
  current: number
  previous: number
  format: (v: number) => string
}

const fmt = new Intl.NumberFormat('vi-VN')

export function PeriodComparison({ data }: PeriodComparisonProps) {
  const rows: ComparisonRow[] = [
    {
      label: 'Doanh thu',
      current: data.currentRevenue,
      previous: data.previousRevenue,
      format: (v) => `${fmt.format(v)}đ`,
    },
    {
      label: 'Số đơn',
      current: data.currentOrders,
      previous: data.previousOrders,
      format: (v) => v.toString(),
    },
    {
      label: 'Lợi nhuận',
      current: data.currentProfit,
      previous: data.previousProfit,
      format: (v) => `${fmt.format(v)}đ`,
    },
  ]

  return (
    <Card className="p-4">
      <p className="mb-4 text-sm font-semibold">So sánh kỳ trước</p>
      <div className="space-y-3">
        {rows.map((row) => {
          const delta =
            row.previous > 0
              ? ((row.current - row.previous) / row.previous) * 100
              : null

          return (
            <div key={row.label} className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{row.label}</span>
              <div className="flex items-center gap-1.5 text-right">
                <span className="font-medium">{row.format(row.current)}</span>
                {delta !== null && (
                  <span
                    className={cn(
                      'inline-flex items-center gap-0.5 text-xs font-medium',
                      delta > 0
                        ? 'text-emerald-600'
                        : delta < 0
                          ? 'text-red-500'
                          : 'text-muted-foreground',
                    )}
                  >
                    {delta > 0 ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : delta < 0 ? (
                      <TrendingDown className="h-3 w-3" />
                    ) : (
                      <Minus className="h-3 w-3" />
                    )}
                    {delta >= 0 ? '+' : ''}
                    {delta.toFixed(1)}%
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

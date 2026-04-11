import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { DashboardStats } from '@/lib/dashboard-utils'

interface KpiCardsProps {
  stats: DashboardStats
}

interface KpiItem {
  label: string
  value: string
  color?: string
}

const fmt = new Intl.NumberFormat('vi-VN')

export function KpiCards({ stats }: KpiCardsProps) {
  const items: KpiItem[] = [
    {
      label: 'Doanh thu',
      value: `${fmt.format(stats.revenue)}đ`,
    },
    {
      label: 'Lợi nhuận gộp',
      value: `${fmt.format(stats.profit)}đ`,
    },
    {
      label: 'Số đơn',
      value: stats.orderCount.toString(),
    },
    {
      label: 'Chiết khấu',
      value: `${fmt.format(stats.totalDiscount)}đ`,
    },
    {
      label: 'Tăng trưởng',
      value:
        stats.growthRate !== null
          ? `${stats.growthRate >= 0 ? '+' : ''}${stats.growthRate.toFixed(1)}%`
          : '--',
      color:
        stats.growthRate !== null
          ? stats.growthRate >= 0
            ? 'text-green-600'
            : 'text-red-600'
          : undefined,
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
      {items.map((item) => (
        <Card key={item.label} className="p-4">
          <p className="text-xs text-muted-foreground">{item.label}</p>
          <p className={cn('mt-1 text-lg font-bold', item.color)}>{item.value}</p>
        </Card>
      ))}
    </div>
  )
}

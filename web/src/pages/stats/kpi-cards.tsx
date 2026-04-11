import { cn } from '@/lib/utils'
import type { DashboardStats } from '@/lib/dashboard-utils'

interface KpiCardsProps {
  stats: DashboardStats
}

const fmt = new Intl.NumberFormat('vi-VN')

export function KpiCards({ stats }: KpiCardsProps) {
  const growthColor =
    stats.growthRate !== null
      ? stats.growthRate >= 0
        ? 'text-emerald-600'
        : 'text-red-500'
      : undefined

  return (
    // Horizontal scroll strip — 1 dòng trên mobile, không wrap
    <div className="flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {/* Doanh thu — primary KPI */}
      <div className="flex shrink-0 min-w-[140px] flex-col rounded-xl bg-primary p-4 text-primary-foreground">
        <p className="text-xs opacity-80">Doanh thu</p>
        <p className="mt-1 text-lg font-bold leading-tight">{fmt.format(stats.revenue)}đ</p>
      </div>

      {/* Lợi nhuận */}
      <div className="flex shrink-0 min-w-[130px] flex-col rounded-xl border bg-card p-4">
        <p className="text-xs text-muted-foreground">Lợi nhuận</p>
        <p className="mt-1 text-lg font-bold leading-tight text-foreground">
          {fmt.format(stats.profit)}đ
        </p>
      </div>

      {/* Số đơn */}
      <div className="flex shrink-0 min-w-[100px] flex-col rounded-xl border bg-card p-4">
        <p className="text-xs text-muted-foreground">Số đơn</p>
        <p className="mt-1 text-lg font-bold leading-tight text-foreground">
          {stats.orderCount}
        </p>
      </div>

      {/* Chiết khấu */}
      <div className="flex shrink-0 min-w-[120px] flex-col rounded-xl border bg-card p-4">
        <p className="text-xs text-muted-foreground">Chiết khấu</p>
        <p className="mt-1 text-base font-semibold leading-tight text-muted-foreground">
          {fmt.format(stats.totalDiscount)}đ
        </p>
      </div>

      {/* Tăng trưởng */}
      <div className="flex shrink-0 min-w-[100px] flex-col rounded-xl border bg-card p-4">
        <p className="text-xs text-muted-foreground">Tăng trưởng</p>
        <p className={cn('mt-1 text-lg font-bold leading-tight', growthColor)}>
          {stats.growthRate !== null
            ? `${stats.growthRate >= 0 ? '+' : ''}${stats.growthRate.toFixed(1)}%`
            : '--'}
        </p>
      </div>
    </div>
  )
}

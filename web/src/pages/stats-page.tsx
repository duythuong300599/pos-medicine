import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { getDashboardData } from '@/lib/supabase-operations'
import {
  aggregateDashboard,
  getStatsDateRange,
  getPreviousPeriod,
  type StatsDateFilter,
  type DashboardAggregated,
} from '@/lib/dashboard-utils'
import { StatsFilterBar } from './stats/stats-filter-bar'
import { KpiCards } from './stats/kpi-cards'
import { RevenueChart } from './stats/revenue-chart'
import { PaymentDonutChart } from './stats/payment-donut-chart'
import { PeriodComparison } from './stats/period-comparison'

function StatsSkeletons() {
  return (
    <div className="space-y-6 p-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-64 rounded-xl" />
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-48 rounded-xl" />
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex h-64 flex-col items-center justify-center text-muted-foreground">
      <p className="text-sm">Chua co du lieu trong khoang thoi gian nay</p>
    </div>
  )
}

export function StatsPage() {
  const [filter, setFilter] = useState<StatsDateFilter>('today')
  const [data, setData] = useState<DashboardAggregated | null>(null)
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const { from, to } = getStatsDateRange(filter)
      const prev = getPreviousPeriod(from, to)

      const [current, previous] = await Promise.all([
        getDashboardData(from, to),
        getDashboardData(prev.from, prev.to),
      ])

      const aggregated = aggregateDashboard(current, previous, from, to)
      setData(aggregated)
    } catch {
      toast.error('Khong the tai du lieu thong ke')
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => {
    loadData()
  }, [loadData])

  return (
    <div className="flex h-full flex-col">
      <div className="border-b px-6 py-4">
        <h1 className="text-xl font-semibold">Thong ke</h1>
      </div>

      <StatsFilterBar value={filter} onChange={setFilter} />

      <ScrollArea className="flex-1">
        {loading ? (
          <StatsSkeletons />
        ) : !data || data.stats.orderCount === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-6 p-6">
            <KpiCards stats={data.stats} />
            <RevenueChart data={data.dailyRevenue} />
            <div className="grid gap-6 lg:grid-cols-2">
              <PaymentDonutChart data={data.paymentSplit} />
              <PeriodComparison data={data.comparison} />
            </div>
          </div>
        )}
      </ScrollArea>
    </div>
  )
}

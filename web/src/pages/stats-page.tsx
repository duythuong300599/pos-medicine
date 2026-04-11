import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
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
import { PeriodComparison } from './stats/period-comparison'

// ─── Mock data (tắt khi có data thực) ────────────────────────────────────────
const USE_MOCK = true

const MOCK_DATA: DashboardAggregated = {
  stats: {
    revenue: 18_750_000,
    profit: 5_620_000,
    orderCount: 47,
    totalDiscount: 450_000,
    growthRate: 12.4,
  },
  dailyRevenue: [
    { date: '05/04', revenue: 2_100_000 },
    { date: '06/04', revenue: 3_450_000 },
    { date: '07/04', revenue: 1_800_000 },
    { date: '08/04', revenue: 2_900_000 },
    { date: '09/04', revenue: 3_200_000 },
    { date: '10/04', revenue: 2_650_000 },
    { date: '11/04', revenue: 2_650_000 },
  ],
  paymentSplit: { cash: 11_200_000, qr: 7_550_000 },
  comparison: {
    currentRevenue: 18_750_000,
    previousRevenue: 16_680_000,
    currentOrders: 47,
    previousOrders: 41,
    currentProfit: 5_620_000,
    previousProfit: 4_890_000,
  },
}

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
      <p className="text-sm">Chưa có dữ liệu trong khoảng thời gian này</p>
    </div>
  )
}

export function StatsPage() {
  const [filter, setFilter] = useState<StatsDateFilter>('7days')
  const [data, setData] = useState<DashboardAggregated | null>(USE_MOCK ? MOCK_DATA : null)
  const [loading, setLoading] = useState(!USE_MOCK)

  const loadData = useCallback(async () => {
    if (USE_MOCK) {
      setData(MOCK_DATA)
      return
    }
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
      toast.error('Không thể tải dữ liệu thống kê')
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
        <h1 className="text-xl font-semibold">Thống kê</h1>
      </div>

      <StatsFilterBar value={filter} onChange={setFilter} />

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <StatsSkeletons />
        ) : !data || data.stats.orderCount === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-6 p-6">
            <KpiCards stats={data.stats} />
            <RevenueChart data={data.dailyRevenue} />
            <PeriodComparison data={data.comparison} />
          </div>
        )}
      </div>
    </div>
  )
}

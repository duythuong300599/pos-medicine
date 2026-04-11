import { format, eachDayOfInterval, startOfDay } from 'date-fns'
import type { DashboardRawData } from './supabase-operations'
import type { DbProduct } from './supabase'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DashboardStats {
  revenue: number
  profit: number
  orderCount: number
  totalDiscount: number
  growthRate: number | null
}

export interface DailyRevenue {
  date: string
  revenue: number
}

export interface PaymentSplit {
  cash: number
  qr: number
}

export interface PeriodComparison {
  currentRevenue: number
  previousRevenue: number
  currentOrders: number
  previousOrders: number
  currentProfit: number
  previousProfit: number
}

export interface DashboardAggregated {
  stats: DashboardStats
  dailyRevenue: DailyRevenue[]
  paymentSplit: PaymentSplit
  comparison: PeriodComparison
}

export type StatsDateFilter = 'today' | '7days' | '30days' | 'month'

// ─── Main aggregation ─────────────────────────────────────────────────────────

export function aggregateDashboard(
  current: DashboardRawData,
  previous: DashboardRawData,
  from: Date,
  to: Date,
): DashboardAggregated {
  const costMap = buildCostMap(current.products)

  const currentStats = computeStats(current, costMap)
  const previousStats = computeStats(previous, costMap)

  const growthRate =
    previousStats.revenue > 0
      ? ((currentStats.revenue - previousStats.revenue) / previousStats.revenue) * 100
      : null

  return {
    stats: { ...currentStats, growthRate },
    dailyRevenue: computeDailyRevenue(current.transactions, from, to),
    paymentSplit: computePaymentSplit(current.transactions),
    comparison: {
      currentRevenue: currentStats.revenue,
      previousRevenue: previousStats.revenue,
      currentOrders: currentStats.orderCount,
      previousOrders: previousStats.orderCount,
      currentProfit: currentStats.profit,
      previousProfit: previousStats.profit,
    },
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildCostMap(products: DbProduct[]): Map<string, number> {
  const map = new Map<string, number>()
  for (const p of products) {
    map.set(p.id, p.costPrice)
  }
  return map
}

function computeStats(
  data: DashboardRawData,
  costMap: Map<string, number>,
): Omit<DashboardStats, 'growthRate'> {
  const revenue = data.transactions.reduce((s, t) => s + t.totalAmount, 0)
  const totalDiscount = data.transactions.reduce((s, t) => s + t.discountAmount, 0)
  const orderCount = data.transactions.length

  let profit = 0
  for (const item of data.transactionItems) {
    const cost = costMap.get(item.productId) ?? 0
    profit += (item.unitPrice - cost) * item.quantity
  }

  return { revenue, profit, orderCount, totalDiscount }
}

function computeDailyRevenue(
  transactions: DashboardRawData['transactions'],
  from: Date,
  to: Date,
): DailyRevenue[] {
  const days = eachDayOfInterval({ start: from, end: to })
  const bucketMap = new Map<string, number>()
  for (const d of days) {
    bucketMap.set(format(d, 'dd/MM'), 0)
  }

  for (const tx of transactions) {
    if (!tx.createdAt) continue
    const key = format(startOfDay(new Date(tx.createdAt)), 'dd/MM')
    bucketMap.set(key, (bucketMap.get(key) ?? 0) + tx.totalAmount)
  }

  return Array.from(bucketMap.entries()).map(([date, revenue]) => ({ date, revenue }))
}

function computePaymentSplit(transactions: DashboardRawData['transactions']): PaymentSplit {
  let cash = 0
  let qr = 0
  for (const tx of transactions) {
    if (tx.paymentMethod === 'cash') cash += tx.totalAmount
    else if (tx.paymentMethod === 'qr') qr += tx.totalAmount
  }
  return { cash, qr }
}

// ─── Date range helpers ───────────────────────────────────────────────────────

export function getStatsDateRange(filter: StatsDateFilter): { from: Date; to: Date } {
  const now = new Date()
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)

  switch (filter) {
    case 'today': {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      return { from: start, to: endOfToday }
    }
    case '7days': {
      const start = new Date(now)
      start.setDate(now.getDate() - 6)
      start.setHours(0, 0, 0, 0)
      return { from: start, to: endOfToday }
    }
    case '30days': {
      const start = new Date(now)
      start.setDate(now.getDate() - 29)
      start.setHours(0, 0, 0, 0)
      return { from: start, to: endOfToday }
    }
    case 'month': {
      const start = new Date(now.getFullYear(), now.getMonth(), 1)
      return { from: start, to: endOfToday }
    }
  }
}

export function getPreviousPeriod(from: Date, to: Date): { from: Date; to: Date } {
  const durationMs = to.getTime() - from.getTime()
  return {
    from: new Date(from.getTime() - durationMs),
    to: new Date(from.getTime() - 1),
  }
}

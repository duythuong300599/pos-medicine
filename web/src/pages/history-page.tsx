import { useState, useEffect, useCallback } from 'react'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import { toast } from 'sonner'
import { getTransactions, getTransactionItems } from '@/lib/supabase-operations'
import type { DbTransaction, DbTransactionItem } from '@/lib/supabase'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

const fmt = new Intl.NumberFormat('vi-VN')

type DateFilter = 'today' | 'week' | 'month' | 'all'

function getDateRange(filter: DateFilter): { from?: number; to?: number } {
  const now = new Date()
  if (filter === 'today') {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    return { from: start.getTime() }
  }
  if (filter === 'week') {
    const start = new Date(now)
    start.setDate(now.getDate() - 7)
    return { from: start.getTime() }
  }
  if (filter === 'month') {
    const start = new Date(now.getFullYear(), now.getMonth(), 1)
    return { from: start.getTime() }
  }
  return {}
}

export function HistoryPage() {
  const [transactions, setTransactions] = useState<DbTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [dateFilter, setDateFilter] = useState<DateFilter>('today')
  const [selectedTx, setSelectedTx] = useState<DbTransaction | null>(null)
  const [txItems, setTxItems] = useState<DbTransactionItem[]>([])
  const [detailLoading, setDetailLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const range = getDateRange(dateFilter)
      const data = await getTransactions(range)
      setTransactions(data)
    } catch {
      toast.error('Không thể tải lịch sử giao dịch')
    } finally {
      setLoading(false)
    }
  }, [dateFilter])

  useEffect(() => {
    load()
  }, [load])

  const handleOpenDetail = async (tx: DbTransaction) => {
    setSelectedTx(tx)
    setDetailLoading(true)
    try {
      const items = await getTransactionItems(tx.id)
      setTxItems(items)
    } catch {
      toast.error('Không thể tải chi tiết giao dịch')
    } finally {
      setDetailLoading(false)
    }
  }

  const totalRevenue = transactions.reduce((sum, t) => sum + t.totalAmount, 0)

  const filters: { label: string; value: DateFilter }[] = [
    { label: 'Hôm nay', value: 'today' },
    { label: '7 ngày', value: 'week' },
    { label: 'Tháng này', value: 'month' },
    { label: 'Tất cả', value: 'all' },
  ]

  return (
    <div className="flex h-full flex-col">
      <div className="border-b px-6 py-4">
        <h1 className="text-xl font-semibold">Lịch sử giao dịch</h1>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1.5 border-b px-6 py-3">
        {filters.map((f) => (
          <button
            key={f.value}
            onClick={() => setDateFilter(f.value)}
            className={[
              'rounded-full px-3 py-1 text-xs font-medium transition-colors',
              dateFilter === f.value
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80',
            ].join(' ')}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Summary */}
      {transactions.length > 0 && (
        <div className="flex gap-4 border-b px-6 py-3 text-sm">
          <span className="text-muted-foreground">
            {transactions.length} giao dịch
          </span>
          <span className="font-semibold text-primary">
            Tổng: {fmt.format(totalRevenue)}₫
          </span>
        </div>
      )}

      {/* List */}
      <ScrollArea className="flex-1">
        {loading ? (
          <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
            Đang tải...
          </div>
        ) : transactions.length === 0 ? (
          <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
            Chưa có giao dịch nào
          </div>
        ) : (
          <div className="divide-y">
            {transactions.map((tx) => (
              <button
                key={tx.id}
                className="w-full px-6 py-3.5 text-left hover:bg-muted/40 transition-colors"
                onClick={() => handleOpenDetail(tx)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-sm">{tx.transactionCode}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {tx.createdAt
                        ? format(new Date(tx.createdAt), 'HH:mm dd/MM/yyyy', { locale: vi })
                        : ''}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-semibold text-primary">{fmt.format(tx.totalAmount)}₫</p>
                    <Badge variant="outline" className="mt-0.5 text-[10px]">
                      {tx.paymentMethod === 'cash' ? 'Tiền mặt' : 'Chuyển khoản'}
                    </Badge>
                  </div>
                </div>
                {tx.discountAmount > 0 && (
                  <p className="text-xs text-orange-600 mt-1">
                    Giảm {fmt.format(tx.discountAmount)}₫
                  </p>
                )}
              </button>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Detail dialog */}
      <Dialog open={!!selectedTx} onOpenChange={(o) => !o && setSelectedTx(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{selectedTx?.transactionCode}</DialogTitle>
          </DialogHeader>
          {selectedTx && (
            <div className="space-y-3 text-sm">
              <div className="text-muted-foreground text-xs">
                {selectedTx.createdAt
                  ? format(new Date(selectedTx.createdAt), 'HH:mm dd/MM/yyyy', { locale: vi })
                  : ''}
                {' · '}
                {selectedTx.paymentMethod === 'cash' ? 'Tiền mặt' : 'Chuyển khoản'}
              </div>

              <Separator />

              {detailLoading ? (
                <p className="text-center text-muted-foreground py-4">Đang tải...</p>
              ) : (
                <div className="space-y-2">
                  {txItems.map((item) => (
                    <div key={item.id} className="flex justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="truncate">{item.productName}</p>
                        <p className="text-xs text-muted-foreground">
                          {fmt.format(item.unitPrice)}₫ × {item.quantity} {item.unitName}
                        </p>
                      </div>
                      <p className="font-medium shrink-0">{fmt.format(item.subtotal)}₫</p>
                    </div>
                  ))}
                </div>
              )}

              <Separator />

              <div className="space-y-1">
                <div className="flex justify-between text-muted-foreground">
                  <span>Tạm tính</span>
                  <span>{fmt.format(selectedTx.subtotal)}₫</span>
                </div>
                {selectedTx.discountAmount > 0 && (
                  <div className="flex justify-between text-orange-600">
                    <span>Giảm giá</span>
                    <span>-{fmt.format(selectedTx.discountAmount)}₫</span>
                  </div>
                )}
                <div className="flex justify-between font-semibold text-base">
                  <span>Tổng cộng</span>
                  <span className="text-primary">{fmt.format(selectedTx.totalAmount)}₫</span>
                </div>
              </div>

              {selectedTx.notes && (
                <p className="text-xs text-muted-foreground border-t pt-2">{selectedTx.notes}</p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

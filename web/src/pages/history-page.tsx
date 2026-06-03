import { useState, useEffect, useCallback } from 'react'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import { Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { getTransactions, getTransactionItems, voidTransaction } from '@/lib/supabase-operations'
import type { DbTransaction, DbTransactionItem } from '@/lib/supabase'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { TransactionEditDialog } from './history/transaction-edit-dialog'

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
  const [editOpen, setEditOpen] = useState(false)
  const [editingTx, setEditingTx] = useState<DbTransaction | null>(null)
  const [voidOpen, setVoidOpen] = useState(false)
  const [voidTarget, setVoidTarget] = useState<DbTransaction | null>(null)
  const [voidReason, setVoidReason] = useState('')
  const [voidLoading, setVoidLoading] = useState(false)

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

  const handleEditSaved = (updated: DbTransaction) => {
    setTransactions((prev) => prev.map((t) => (t.id === updated.id ? updated : t)))
    setSelectedTx(updated)
  }

  const handleItemsUpdated = (items: DbTransactionItem[]) => {
    setTxItems(items)
  }

  const handleVoid = async () => {
    if (!voidTarget || !voidReason.trim()) return
    setVoidLoading(true)
    try {
      await voidTransaction(voidTarget.id, voidReason.trim())
      toast.success(`Đã huỷ hoá đơn ${voidTarget.transactionCode}`)
      setVoidOpen(false)
      setVoidTarget(null)
      setSelectedTx(null)
      load()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Không thể huỷ hoá đơn')
    } finally {
      setVoidLoading(false)
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
                      {(tx.saleDate ?? tx.createdAt)
                        ? format(new Date((tx.saleDate ?? tx.createdAt)!), 'HH:mm dd/MM/yyyy', { locale: vi })
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
                {(selectedTx.saleDate ?? selectedTx.createdAt)
                  ? format(new Date((selectedTx.saleDate ?? selectedTx.createdAt)!), 'HH:mm dd/MM/yyyy', { locale: vi })
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
          <DialogFooter>
            {selectedTx?.status !== 'voided' && (
              <>
                <Button
                  variant="destructive"
                  size="sm"
                  className="flex gap-1.5"
                  onClick={() => {
                    setVoidTarget(selectedTx)
                    setVoidReason('')
                    setVoidOpen(true)
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Huỷ đơn
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex gap-1.5"
                  onClick={() => {
                    setEditingTx(selectedTx)
                    setEditOpen(true)
                  }}
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Chỉnh sửa
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <TransactionEditDialog
        transaction={editingTx}
        txItems={editingTx?.id === selectedTx?.id ? txItems : []}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSaved={handleEditSaved}
        onItemsUpdated={handleItemsUpdated}
      />

      {/* Void confirm dialog */}
      <Dialog open={voidOpen} onOpenChange={(o) => !o && setVoidOpen(false)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Huỷ hoá đơn</DialogTitle>
          </DialogHeader>
          {voidTarget && (
            <div className="space-y-4 text-sm">
              <div className="rounded-md border bg-muted/40 p-3 space-y-1">
                <p className="font-medium">{voidTarget.transactionCode}</p>
                <p className="text-muted-foreground">
                  Tổng tiền: <span className="font-semibold text-foreground">{fmt.format(voidTarget.totalAmount)}₫</span>
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="void-reason">
                  Lý do huỷ <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="void-reason"
                  placeholder="Vd: Nhập sai hoá đơn, sai khách hàng..."
                  value={voidReason}
                  onChange={(e) => setVoidReason(e.target.value)}
                  rows={3}
                  className="resize-none"
                />
              </div>

              <p className="text-xs text-muted-foreground">
                Hành động này sẽ hoàn thuốc về kho và không thể hoàn tác.
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setVoidOpen(false)}>
              Huỷ
            </Button>
            <Button
              variant="destructive"
              onClick={handleVoid}
              disabled={voidLoading || !voidReason.trim()}
            >
              {voidLoading ? 'Đang xử lý...' : 'Xác nhận huỷ'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

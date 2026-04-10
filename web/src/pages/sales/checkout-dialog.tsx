import { useState } from 'react'
import { Banknote, QrCode } from 'lucide-react'
import { toast } from 'sonner'
import { createTransaction } from '@/lib/supabase-operations'
import type { DbTransaction, DbTransactionItem } from '@/lib/supabase'
import { useCartStore } from '@/stores/cart-store'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'

const fmt = new Intl.NumberFormat('vi-VN')

interface CheckoutDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: (transaction: DbTransaction, items: DbTransactionItem[]) => void
}

export function CheckoutDialog({ open, onOpenChange, onSuccess }: CheckoutDialogProps) {
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'qr'>('cash')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)

  const { items, discountType, discountValue, getSubtotal, getDiscountAmount, getTotal, clearCart } =
    useCartStore()

  const subtotal = getSubtotal()
  const discountAmount = getDiscountAmount()
  const total = getTotal()

  const handleCheckout = async () => {
    if (items.length === 0) return
    setLoading(true)
    try {
      const transactionCode = `HD${String(Date.now()).slice(-8)}`
      const { transaction, items: txItems } = await createTransaction({
        transactionCode,
        subtotal,
        discountAmount,
        total,
        paymentMethod,
        notes: notes.trim() || undefined,
        items: items.map((item) => ({
          productId: item.productId,
          productName: item.productName,
          unitPrice: item.unitPrice,
          quantity: item.quantity,
          subtotal: item.unitPrice * item.quantity,
          unitId: item.unitId || undefined,
          unitName: item.unitName,
        })),
      })

      clearCart()
      onOpenChange(false)
      setNotes('')
      onSuccess(transaction, txItems)
      toast.success('Thanh toán thành công!')
    } catch {
      toast.error('Có lỗi khi xử lý thanh toán')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Xác nhận thanh toán</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Payment method */}
          <div className="space-y-2">
            <Label>Phương thức thanh toán</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={paymentMethod === 'cash' ? 'default' : 'outline'}
                className="flex gap-2"
                onClick={() => setPaymentMethod('cash')}
              >
                <Banknote className="h-4 w-4" />
                Tiền mặt
              </Button>
              <Button
                type="button"
                variant={paymentMethod === 'qr' ? 'default' : 'outline'}
                className="flex gap-2"
                onClick={() => setPaymentMethod('qr')}
              >
                <QrCode className="h-4 w-4" />
                Chuyển khoản
              </Button>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Ghi chú (tuỳ chọn)</Label>
            <Textarea
              id="notes"
              placeholder="Ghi chú đơn hàng..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="resize-none"
            />
          </div>

          <Separator />

          {/* Summary */}
          <div className="space-y-1 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Tạm tính</span>
              <span>{fmt.format(subtotal)}₫</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-muted-foreground">
                <span>
                  Giảm giá {discountType === 'percent' ? `(${discountValue}%)` : ''}
                </span>
                <span className="text-orange-600">-{fmt.format(discountAmount)}₫</span>
              </div>
            )}
            <div className="flex justify-between font-semibold text-base pt-1">
              <span>Tổng cộng</span>
              <span className="text-primary">{fmt.format(total)}₫</span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button onClick={handleCheckout} disabled={loading || items.length === 0}>
            {loading ? 'Đang xử lý...' : `Thanh toán ${fmt.format(total)}₫`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

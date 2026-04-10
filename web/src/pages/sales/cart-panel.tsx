import { useState } from 'react'
import { Minus, Plus, Trash2, ShoppingCart } from 'lucide-react'
import { useCartStore } from '@/stores/cart-store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { CheckoutDialog } from './checkout-dialog'
import { ReceiptDialog } from './receipt-dialog'
import type { DbTransaction, DbTransactionItem } from '@/lib/supabase'

const fmt = new Intl.NumberFormat('vi-VN')

interface CartPanelProps {
  onCheckoutSuccess?: () => void
  showHeader?: boolean
}

export function CartPanel({ onCheckoutSuccess, showHeader = true }: CartPanelProps = {}) {
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [receiptOpen, setReceiptOpen] = useState(false)
  const [lastTransaction, setLastTransaction] = useState<DbTransaction | null>(null)
  const [lastItems, setLastItems] = useState<DbTransactionItem[]>([])

  const {
    items,
    discountType,
    discountValue,
    getSubtotal,
    getDiscountAmount,
    getTotal,
    updateQuantity,
    removeItem,
    setDiscount,
  } = useCartStore()

  const subtotal = getSubtotal()
  const discountAmount = getDiscountAmount()
  const total = getTotal()

  const handleSuccess = (transaction: DbTransaction, txItems: DbTransactionItem[]) => {
    setLastTransaction(transaction)
    setLastItems(txItems)
    setReceiptOpen(true)
  }

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Header — ẩn khi trong Sheet (showHeader=false) */}
      {showHeader && (
        <div className="flex items-center gap-2 border-b px-4 py-3">
          <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          <h2 className="font-semibold">Giỏ hàng</h2>
          {items.length > 0 && (
            <span className="ml-auto rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
              {items.length}
            </span>
          )}
        </div>
      )}

      {/* Items */}
      <ScrollArea className="flex-1">
        {items.length === 0 ? (
          <div className="flex h-40 flex-col items-center justify-center gap-2 text-muted-foreground">
            <ShoppingCart className="h-8 w-8 opacity-30" />
            <p className="text-sm">Chưa có sản phẩm</p>
          </div>
        ) : (
          <div className="divide-y">
            {items.map((item) => (
              <CartItemRow
                key={item.productId}
                item={item}
                onUpdateQty={(qty) => updateQuantity(item.productId, qty)}
                onRemove={() => removeItem(item.productId)}
              />
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Footer */}
      {items.length > 0 && (
        <div className="border-t p-4 space-y-3">
          {/* Discount */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Giảm giá</Label>
            <div className="flex gap-2">
              <ToggleGroup
                type="single"
                value={discountType}
                onValueChange={(v) => v && setDiscount(v as 'amount' | 'percent', discountValue)}
                className="shrink-0"
              >
                <ToggleGroupItem value="amount" className="h-8 px-2.5 text-xs">₫</ToggleGroupItem>
                <ToggleGroupItem value="percent" className="h-8 px-2.5 text-xs">%</ToggleGroupItem>
              </ToggleGroup>
              <Input
                type="number"
                min={0}
                max={discountType === 'percent' ? 100 : undefined}
                value={discountValue || ''}
                onChange={(e) => setDiscount(discountType, Number(e.target.value) || 0)}
                placeholder="0"
                className="h-8 text-sm"
              />
            </div>
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
                <span>Giảm giá</span>
                <span className="text-orange-600">-{fmt.format(discountAmount)}₫</span>
              </div>
            )}
            <div className="flex justify-between font-semibold text-base">
              <span>Tổng cộng</span>
              <span className="text-primary">{fmt.format(total)}₫</span>
            </div>
          </div>

          <Button className="w-full" size="lg" onClick={() => setCheckoutOpen(true)}>
            Thanh toán
          </Button>
        </div>
      )}

      <CheckoutDialog
        open={checkoutOpen}
        onOpenChange={setCheckoutOpen}
        onSuccess={handleSuccess}
      />
      <ReceiptDialog
        open={receiptOpen}
        onOpenChange={(open) => {
          setReceiptOpen(open)
          if (!open) onCheckoutSuccess?.()
        }}
        transaction={lastTransaction}
        items={lastItems}
      />
    </div>
  )
}

interface CartItemRowProps {
  item: { productId: string; productName: string; unitName: string; unitPrice: number; quantity: number }
  onUpdateQty: (qty: number) => void
  onRemove: () => void
}

function CartItemRow({ item, onUpdateQty, onRemove }: CartItemRowProps) {
  const fmt = new Intl.NumberFormat('vi-VN')

  return (
    <div className="flex items-start gap-3 px-4 py-3 animate-in slide-in-from-right-4 fade-in duration-200">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium leading-tight truncate">{item.productName}</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {fmt.format(item.unitPrice)}₫/{item.unitName}
        </p>
        <p className="text-xs font-medium text-primary mt-0.5">
          = {fmt.format(item.unitPrice * item.quantity)}₫
        </p>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <Button
          variant="outline"
          size="icon"
          className="h-7 w-7"
          onClick={() => {
            if (item.quantity <= 1) onRemove()
            else onUpdateQty(item.quantity - 1)
          }}
        >
          <Minus className="h-3 w-3" />
        </Button>
        <Input
          type="number"
          min={1}
          value={item.quantity}
          onChange={(e) => {
            const v = parseInt(e.target.value)
            if (v > 0) onUpdateQty(v)
          }}
          className="h-7 w-12 text-center text-sm px-1"
        />
        <Button
          variant="outline"
          size="icon"
          className="h-7 w-7"
          onClick={() => onUpdateQty(item.quantity + 1)}
        >
          <Plus className="h-3 w-3" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-destructive hover:text-destructive"
          onClick={onRemove}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  )
}

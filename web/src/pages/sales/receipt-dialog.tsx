import { useRef } from 'react'
import { Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import type { DbTransaction, DbTransactionItem } from '@/lib/supabase'

const fmt = new Intl.NumberFormat('vi-VN')
const dateFmt = new Intl.DateTimeFormat('vi-VN', {
  dateStyle: 'short',
  timeStyle: 'short',
})

interface ReceiptDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  transaction: DbTransaction | null
  items: DbTransactionItem[]
}

export function ReceiptDialog({ open, onOpenChange, transaction, items }: ReceiptDialogProps) {
  const printRef = useRef<HTMLDivElement>(null)

  const handlePrint = () => {
    const content = printRef.current
    if (!content) return
    const win = window.open('', '_blank', 'width=400,height=600')
    if (!win) return
    win.document.write(`
      <html><head><title>Hóa đơn</title>
      <style>
        body { font-family: monospace; font-size: 12px; padding: 16px; }
        h2 { text-align: center; margin: 0 0 4px; }
        p { margin: 2px 0; }
        .row { display: flex; justify-content: space-between; }
        .sep { border-top: 1px dashed #000; margin: 6px 0; }
        .bold { font-weight: bold; }
        .center { text-align: center; }
      </style>
      </head><body>${content.innerHTML}</body></html>
    `)
    win.document.close()
    win.focus()
    win.print()
    win.close()
  }

  if (!transaction) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Hóa đơn thanh toán</DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-96">
          <div ref={printRef} className="space-y-2 font-mono text-sm">
            <div className="text-center">
              <p className="text-base font-bold">PHARMAPOS</p>
              <p className="text-xs text-muted-foreground">Nhà thuốc</p>
            </div>

            <Separator className="border-dashed" />

            <div className="text-xs text-muted-foreground space-y-0.5">
              <p>Mã GD: {transaction.transactionCode}</p>
              <p>Thời gian: {transaction.createdAt ? dateFmt.format(new Date(transaction.createdAt)) : ''}</p>
              <p>Thanh toán: {transaction.paymentMethod === 'cash' ? 'Tiền mặt' : 'QR Code'}</p>
            </div>

            <Separator className="border-dashed" />

            <div className="space-y-1">
              {items.map((item) => (
                <div key={item.id}>
                  <p className="text-xs">{item.productName}</p>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{item.quantity} {item.unitName} × {fmt.format(item.unitPrice)}₫</span>
                    <span>{fmt.format(item.subtotal)}₫</span>
                  </div>
                </div>
              ))}
            </div>

            <Separator className="border-dashed" />

            <div className="space-y-0.5 text-xs">
              <div className="flex justify-between">
                <span>Tạm tính</span>
                <span>{fmt.format(transaction.subtotal)}₫</span>
              </div>
              {transaction.discountAmount > 0 && (
                <div className="flex justify-between text-muted-foreground">
                  <span>Giảm giá</span>
                  <span>-{fmt.format(transaction.discountAmount)}₫</span>
                </div>
              )}
              <div className="flex justify-between font-bold">
                <span>Tổng cộng</span>
                <span>{fmt.format(transaction.totalAmount)}₫</span>
              </div>
            </div>

            <Separator className="border-dashed" />
            <p className="text-center text-xs text-muted-foreground">Cảm ơn quý khách!</p>
          </div>
        </ScrollArea>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Đóng</Button>
          <Button onClick={handlePrint}>
            <Printer className="mr-1 h-4 w-4" />
            In hóa đơn
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

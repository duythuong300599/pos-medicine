import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { getProducts, getUnits, adjustStock, getInventoryLogs } from '@/lib/supabase-operations'
import type { DbProduct, DbInventoryLog, Unit } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { ProductFormDialog } from './sales/product-form-dialog'

const fmt = new Intl.NumberFormat('vi-VN')

export function InventoryPage() {
  const [products, setProducts] = useState<DbProduct[]>([])
  const [units, setUnits] = useState<Unit[]>([])
  const [logs, setLogs] = useState<DbInventoryLog[]>([])
  const [loading, setLoading] = useState(true)
  const [logsLoading, setLogsLoading] = useState(false)
  const [adjustProduct, setAdjustProduct] = useState<DbProduct | null>(null)
  const [editProduct, setEditProduct] = useState<DbProduct | null>(null)
  const [formOpen, setFormOpen] = useState(false)

  const load = useCallback(async () => {
    try {
      const [prods, us] = await Promise.all([getProducts(), getUnits()])
      setProducts(prods)
      setUnits(us)
    } catch {
      toast.error('Không thể tải dữ liệu kho')
    } finally {
      setLoading(false)
    }
  }, [])

  const loadLogs = useCallback(async () => {
    setLogsLoading(true)
    try {
      const data = await getInventoryLogs({ limit: 200 })
      setLogs(data)
    } catch {
      toast.error('Không thể tải lịch sử')
    } finally {
      setLogsLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const unitsMap = Object.fromEntries(units.map((u) => [u.id, u]))
  const productsMap = Object.fromEntries(products.map((p) => [p.id, p]))

  const handleEdit = (p: DbProduct) => {
    setEditProduct(p)
    setFormOpen(true)
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        Đang tải...
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Quản lý kho</h1>
        <Button size="sm" onClick={() => { setEditProduct(null); setFormOpen(true) }}>
          + Thêm thuốc
        </Button>
      </div>

      <Tabs defaultValue="all" className="flex-1 flex flex-col min-h-0" onValueChange={(v) => {
        if (v === 'history' && logs.length === 0) loadLogs()
      }}>
        <TabsList className="mx-6 mt-4 w-fit">
          <TabsTrigger value="all">
            Tất cả ({products.length})
          </TabsTrigger>
          <TabsTrigger value="history">Lịch sử</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="flex-1 min-h-0 mt-0">
          <ProductTable
            products={products}
            unitsMap={unitsMap}
            onAdjust={setAdjustProduct}
            onEdit={handleEdit}
          />
        </TabsContent>

        <TabsContent value="history" className="flex-1 min-h-0 mt-0">
          <InventoryHistoryList
            logs={logs}
            productsMap={productsMap}
            loading={logsLoading}
            onRefresh={loadLogs}
          />
        </TabsContent>
      </Tabs>

      <StockAdjustmentDialog
        product={adjustProduct}
        onOpenChange={(o) => {
          if (!o) {
            setAdjustProduct(null)
            load()
            setLogs([]) // invalidate history cache
          }
        }}
      />

      <ProductFormDialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open)
          if (!open) load()
        }}
        product={editProduct}
      />
    </div>
  )
}

interface ProductTableProps {
  products: DbProduct[]
  unitsMap: Record<string, Unit>
  onAdjust: (p: DbProduct) => void
  onEdit: (p: DbProduct) => void
}

function ProductTable({ products, unitsMap, onAdjust, onEdit }: ProductTableProps) {
  if (products.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
        Không có sản phẩm
      </div>
    )
  }

  return (
    <ScrollArea className="h-full pb-4">
      {/* Mobile: card list */}
      <div className="sm:hidden divide-y px-4 mt-2">
        {products.map((p) => {
          const isOut = p.stockQuantity === 0
          const unit = unitsMap[p.unitId]
          return (
            <div key={p.id} className="py-3 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-medium text-sm leading-tight">{p.name}</p>
                </div>
                <Badge
                  variant={isOut ? 'destructive' : 'secondary'}
                  className="shrink-0"
                >
                  {p.stockQuantity} {unit?.abbreviation}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex gap-3 text-xs">
                  <span className="text-primary font-medium">{fmt.format(p.sellingPrice)}₫</span>
                  <span className="text-muted-foreground">Nhập: {fmt.format(p.costPrice)}₫</span>
                </div>
                <div className="flex gap-1">
                  <Button variant="outline" size="sm" className="h-7 text-xs px-2" onClick={() => onAdjust(p)}>
                    Điều chỉnh
                  </Button>
                  <Button variant="ghost" size="sm" className="h-7 text-xs px-2" onClick={() => onEdit(p)}>
                    Sửa
                  </Button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Desktop: table */}
      <table className="hidden sm:table w-full text-sm mt-4 px-6">
        <thead>
          <tr className="border-b text-left text-muted-foreground text-xs">
            <th className="pb-2 font-medium pl-6">Tên sản phẩm</th>
            <th className="pb-2 font-medium text-right">Tồn kho</th>
            <th className="pb-2 font-medium text-right">Giá bán</th>
            <th className="pb-2 font-medium text-right">Giá nhập</th>
            <th className="pb-2 pr-6" />
          </tr>
        </thead>
        <tbody className="divide-y">
          {products.map((p) => {
            const isOut = p.stockQuantity === 0
            const unit = unitsMap[p.unitId]
            return (
              <tr key={p.id} className="hover:bg-muted/40 transition-colors">
                <td className="py-2.5 pr-4 pl-6">
                  <p className="font-medium">{p.name}</p>
                </td>
                <td className="py-2.5 text-right">
                  <Badge
                    variant={isOut ? 'destructive' : 'secondary'}
                  >
                    {p.stockQuantity} {unit?.abbreviation}
                  </Badge>
                </td>
                <td className="py-2.5 text-right text-primary font-medium">
                  {fmt.format(p.sellingPrice)}₫
                </td>
                <td className="py-2.5 text-right text-muted-foreground">
                  {fmt.format(p.costPrice)}₫
                </td>
                <td className="py-2.5 text-right pr-6">
                  <div className="flex justify-end gap-1">
                    <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => onAdjust(p)}>
                      Điều chỉnh
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => onEdit(p)}>
                      Sửa
                    </Button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </ScrollArea>
  )
}

interface InventoryHistoryListProps {
  logs: DbInventoryLog[]
  productsMap: Record<string, DbProduct>
  loading: boolean
  onRefresh: () => void
}

const REASON_LABEL: Record<string, string> = {
  sale: 'Bán hàng',
  adjust_in: 'Nhập kho',
  adjust_out: 'Xuất kho',
  set_stock: 'Đặt tồn kho',
}

const REASON_COLOR: Record<string, string> = {
  sale: 'text-orange-600',
  adjust_in: 'text-green-600',
  adjust_out: 'text-red-500',
  set_stock: 'text-blue-600',
}

function InventoryHistoryList({ logs, productsMap, loading, onRefresh }: InventoryHistoryListProps) {
  const fmtDate = (iso?: string) => {
    if (!iso) return ''
    const d = new Date(iso)
    return d.toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  if (loading) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
        Đang tải...
      </div>
    )
  }

  if (logs.length === 0) {
    return (
      <div className="flex h-40 flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
        <span>Chưa có lịch sử</span>
        <Button variant="outline" size="sm" onClick={onRefresh}>Tải lại</Button>
      </div>
    )
  }

  return (
    <ScrollArea className="h-full pb-4">
      <div className="flex justify-end px-4 pt-3 pb-1">
        <Button variant="ghost" size="sm" className="text-xs" onClick={onRefresh}>
          Tải lại
        </Button>
      </div>
      <div className="divide-y px-4">
        {logs.map((log) => {
          const product = productsMap[log.productId]
          const isPositive = log.changeQuantity > 0
          return (
            <div key={log.id} className="py-3 flex items-start gap-3">
              {/* Icon indicator */}
              <div className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${isPositive ? 'bg-green-500' : 'bg-red-400'}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium leading-tight truncate">
                      {product?.name ?? <span className="text-muted-foreground italic">Đã xóa</span>}
                    </p>
                    <p className={`text-xs mt-0.5 ${REASON_COLOR[log.reason] ?? 'text-muted-foreground'}`}>
                      {REASON_LABEL[log.reason] ?? log.reason}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-sm font-semibold ${isPositive ? 'text-green-600' : 'text-red-500'}`}>
                      {isPositive ? '+' : ''}{log.changeQuantity}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {log.quantityBefore} → {log.quantityAfter}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{fmtDate(log.createdAt)}</p>
              </div>
            </div>
          )
        })}
      </div>
    </ScrollArea>
  )
}

interface StockAdjustmentDialogProps {
  product: DbProduct | null
  onOpenChange: (open: boolean) => void
}

function StockAdjustmentDialog({ product, onOpenChange }: StockAdjustmentDialogProps) {
  const [type, setType] = useState<'in' | 'out'>('in')
  const [quantity, setQuantity] = useState('')
  const [loading, setLoading] = useState(false)

  const handleConfirm = async () => {
    if (!product) return
    const qty = parseInt(quantity)
    if (!qty || qty <= 0) {
      toast.error('Số lượng không hợp lệ')
      return
    }

    setLoading(true)
    try {
      const change = type === 'in' ? qty : -qty
      await adjustStock(product.id, change, type === 'in' ? 'adjust_in' : 'adjust_out')
      toast.success(`Đã ${type === 'in' ? 'nhập' : 'xuất'} ${qty} ${product.name}`)
      setQuantity('')
      onOpenChange(false)
    } catch {
      toast.error('Có lỗi khi điều chỉnh tồn kho')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={!!product} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Điều chỉnh tồn kho</DialogTitle>
        </DialogHeader>
        {product && (
          <div className="space-y-4">
            <div className="rounded-lg border bg-muted/40 p-3 text-sm">
              <p className="font-medium">{product.name}</p>
              <p className="text-muted-foreground">
                Tồn kho hiện tại: <strong>{product.stockQuantity}</strong>
              </p>
            </div>

            <div className="space-y-2">
              <Label>Loại điều chỉnh</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={type === 'in' ? 'default' : 'outline'}
                  onClick={() => setType('in')}
                >
                  Nhập kho (+)
                </Button>
                <Button
                  type="button"
                  variant={type === 'out' ? 'default' : 'outline'}
                  onClick={() => setType('out')}
                >
                  Xuất kho (−)
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="adj-qty">Số lượng</Label>
              <Input
                id="adj-qty"
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="0"
              />
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button onClick={handleConfirm} disabled={loading || !quantity}>
            {loading ? 'Đang xử lý...' : 'Xác nhận'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

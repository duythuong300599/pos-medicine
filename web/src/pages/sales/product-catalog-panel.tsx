import { useState, useEffect, useCallback } from 'react'
import { Search, X, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { getProducts, getUnits, getCategories, softDeleteProduct } from '@/lib/supabase-operations'
import type { DbProduct, DbUnit, Category } from '@/lib/supabase'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ProductCard } from './product-card'
import { ProductFormDialog } from './product-form-dialog'
import { useCartStore } from '@/stores/cart-store'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

export function ProductCatalogPanel() {
  const [products, setProducts] = useState<DbProduct[]>([])
  const [units, setUnits] = useState<DbUnit[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editProduct, setEditProduct] = useState<DbProduct | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<DbProduct | null>(null)

  const addItem = useCartStore((s) => s.addItem)

  const load = useCallback(async () => {
    try {
      const [prods, us, cats] = await Promise.all([getProducts(), getUnits(), getCategories()])
      setProducts(prods)
      setUnits(us)
      setCategories(cats)
    } catch {
      toast.error('Không thể tải danh sách sản phẩm')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const unitsMap = Object.fromEntries(units.map((u) => [u.id, u]))

  const filtered = products.filter((p) => {
    const matchSearch =
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.barcode && p.barcode.includes(search))
    const matchCat = !selectedCategory || p.categoryId === selectedCategory
    return matchSearch && matchCat
  })

  const handleAddToCart = (product: DbProduct, unit: DbUnit) => {
    addItem({
      productId: product.id,
      productName: product.name,
      unitId: unit.id,
      unitName: unit.abbreviation,
      unitPrice: product.sellingPrice,
    })
  }

  const handleEdit = (product: DbProduct) => {
    setEditProduct(product)
    setFormOpen(true)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await softDeleteProduct(deleteTarget.id)
      toast.success(`Đã xóa ${deleteTarget.name}`)
      setDeleteTarget(null)
      load()
    } catch {
      toast.error('Không thể xóa sản phẩm')
    }
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b px-4 py-3 space-y-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm thuốc, barcode..."
              className="pl-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-2.5 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <Button
            size="icon"
            variant="outline"
            onClick={() => { setEditProduct(null); setFormOpen(true) }}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Category chips */}
        {categories.length > 0 && (
          <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
            <button
              onClick={() => setSelectedCategory(null)}
              className={[
                'shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors',
                !selectedCategory
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80',
              ].join(' ')}
            >
              Tất cả
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
                className={[
                  'shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors',
                  selectedCategory === cat.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80',
                ].join(' ')}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Grid */}
      <ScrollArea className="flex-1">
        {loading ? (
          <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
            Đang tải...
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
            {search ? 'Không tìm thấy sản phẩm' : 'Chưa có sản phẩm'}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 p-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-2 xl:grid-cols-3">
            {filtered.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                unit={unitsMap[product.unitId]}
                onAddToCart={handleAddToCart}
                onEdit={handleEdit}
                onDelete={setDeleteTarget}
              />
            ))}
          </div>
        )}
      </ScrollArea>

      <ProductFormDialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open)
          if (!open) load()
        }}
        product={editProduct}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(o: boolean) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa sản phẩm?</AlertDialogTitle>
            <AlertDialogDescription>
              Xóa <strong>{deleteTarget?.name}</strong>. Thao tác này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

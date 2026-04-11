import { Plus } from 'lucide-react'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { DbProduct, DbUnit } from '@/lib/supabase'

const fmt = new Intl.NumberFormat('vi-VN')

interface ProductCardProps {
  product: DbProduct
  unit: DbUnit | undefined
  onAddToCart: (product: DbProduct, unit: DbUnit) => void
  onEdit: (product: DbProduct) => void
  onDelete: (product: DbProduct) => void
}

export function ProductCard({ product, unit, onAddToCart, onEdit, onDelete }: ProductCardProps) {
  const isOutOfStock = product.stockQuantity === 0

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <div
          className={[
            'relative flex flex-col rounded-lg border bg-card p-3 shadow-sm transition-all duration-200 cursor-pointer select-none',
            'hover:-translate-y-0.5 hover:shadow-md active:scale-[0.97] active:shadow-sm hover:border-primary/40',
          ].join(' ')}
        >
          <p className="line-clamp-2 text-sm font-medium leading-snug">{product.name}</p>

          {product.description && (
            <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{product.description}</p>
          )}

          <div className="mt-2 flex items-end justify-between gap-1">
            <div>
              <p className="text-base font-semibold text-primary">
                {fmt.format(product.sellingPrice)}₫
              </p>
              <Badge
                variant={isOutOfStock ? 'destructive' : 'secondary'}
                className="mt-0.5 text-xs"
              >
                {unit?.abbreviation ?? ''} · {product.stockQuantity}
              </Badge>
            </div>

            <Button
              size="icon"
              className="h-8 w-8 shrink-0 rounded-full"
              disabled={isOutOfStock}
              onClick={(e) => {
                e.stopPropagation()
                if (unit) onAddToCart(product, unit)
              }}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </ContextMenuTrigger>

      <ContextMenuContent>
        <ContextMenuItem onClick={() => onEdit(product)}>Sửa sản phẩm</ContextMenuItem>
        <ContextMenuItem
          className="text-destructive focus:text-destructive"
          onClick={() => onDelete(product)}
        >
          Xóa sản phẩm
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}

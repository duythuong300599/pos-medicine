import { useState } from 'react'
import { ShoppingCart } from 'lucide-react'
import { ProductCatalogPanel } from './sales/product-catalog-panel'
import { CartPanel } from './sales/cart-panel'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { useCartStore } from '@/stores/cart-store'

export function SalesPage() {
  const [cartOpen, setCartOpen] = useState(false)
  const itemCount = useCartStore((s) => s.items.reduce((sum, i) => sum + i.quantity, 0))

  return (
    <>
      {/* Desktop: split layout */}
      <div className="hidden h-full lg:flex">
        <div className="flex-1 min-w-0">
          <ProductCatalogPanel />
        </div>
        <div className="w-80 shrink-0 lg:w-96 border-l">
          <CartPanel />
        </div>
      </div>

      {/* Mobile: catalog full screen */}
      <div className="flex h-full flex-col lg:hidden animate-in fade-in duration-300">
        <ProductCatalogPanel />
      </div>

      {/* Mobile: floating cart button */}
      <Button
        className="fixed bottom-20 right-4 z-50 h-14 w-14 rounded-full shadow-lg lg:hidden"
        onClick={() => setCartOpen(true)}
      >
        <ShoppingCart className="h-6 w-6" />
        {itemCount > 0 && (
          <Badge className="absolute -right-1 -top-1 h-5 min-w-5 rounded-full px-1 text-xs tabular-nums animate-in zoom-in-75 duration-150">
            {itemCount > 99 ? '99+' : itemCount}
          </Badge>
        )}
      </Button>

      {/* Mobile: cart sheet từ bottom */}
      <Sheet open={cartOpen} onOpenChange={setCartOpen}>
        <SheetContent side="bottom" className="h-[90dvh] p-0 flex flex-col">
          <SheetHeader className="border-b px-4 py-3">
            <SheetTitle>Giỏ hàng</SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-hidden">
            <CartPanel showHeader={false} onCheckoutSuccess={() => setCartOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}

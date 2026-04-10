import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface CartItem {
  productId: string
  productName: string
  unitId: string
  unitName: string
  unitPrice: number
  quantity: number
}

export type DiscountType = 'amount' | 'percent'

interface CartState {
  items: CartItem[]
  discountType: DiscountType
  discountValue: number
  addItem: (item: Omit<CartItem, 'quantity'>) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  setDiscount: (type: DiscountType, value: number) => void
  clearCart: () => void
  getSubtotal: () => number
  getDiscountAmount: () => number
  getTotal: () => number
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      discountType: 'amount',
      discountValue: 0,

      addItem: (item) => {
        set((state) => {
          const existing = state.items.find((i) => i.productId === item.productId)
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.productId === item.productId ? { ...i, quantity: i.quantity + 1 } : i,
              ),
            }
          }
          return { items: [...state.items, { ...item, quantity: 1 }] }
        })
      },

      removeItem: (productId) => {
        set((state) => ({ items: state.items.filter((i) => i.productId !== productId) }))
      },

      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId)
          return
        }
        set((state) => ({
          items: state.items.map((i) => (i.productId === productId ? { ...i, quantity } : i)),
        }))
      },

      setDiscount: (type, value) => {
        set({ discountType: type, discountValue: value })
      },

      clearCart: () => {
        set({ items: [], discountType: 'amount', discountValue: 0 })
      },

      getSubtotal: () => {
        return get().items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0)
      },

      getDiscountAmount: () => {
        const { discountType, discountValue, getSubtotal } = get()
        if (discountType === 'percent') {
          return Math.round((getSubtotal() * discountValue) / 100)
        }
        return discountValue
      },

      getTotal: () => {
        return Math.max(0, get().getSubtotal() - get().getDiscountAmount())
      },
    }),
    { name: 'pharma-cart' },
  ),
)

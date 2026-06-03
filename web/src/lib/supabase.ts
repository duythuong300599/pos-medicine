import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// ─── TypeScript Types ──────────────────────────────────────────────────────────

export interface Category {
  id: string
  name: string
  description?: string
  created_at?: string
  updated_at?: string
}

export interface Unit {
  id: string
  name: string
  abbreviation: string
  base_unit_id?: string
  conversion_factor?: number
  created_at?: string
}

export interface Product {
  id: string
  name: string
  category_id?: string
  unit_id: string
  selling_price: number
  cost_price: number
  stock_quantity: number
  description?: string
  is_deleted: boolean
  created_at?: string
  updated_at?: string
}

export interface Transaction {
  id: string
  transaction_code: string
  subtotal: number
  discount_amount: number
  total_amount: number
  payment_method: 'cash' | 'qr'
  notes?: string
  created_at?: string
  sale_date?: string
  status: 'active' | 'voided'
  voided_at?: string
  voided_reason?: string
}

export interface TransactionEditLog {
  id: string
  transaction_id: string
  field_name: string
  old_value?: string
  new_value?: string
  edit_reason?: string
  created_at?: string
}

export interface TransactionItem {
  id: string
  transaction_id: string
  product_id: string
  product_name: string
  unit_price: number
  quantity: number
  subtotal: number
  unit_id?: string
  unit_name: string
}

export interface InventoryLog {
  id: string
  product_id: string
  change_quantity: number
  quantity_before: number
  quantity_after: number
  reason: 'sale' | 'adjust_in' | 'adjust_out' | 'set_stock'
  reference_id?: string
  created_at?: string
}

// ─── Aliases để compat với code cũ (camelCase) ───────────────────────────────
// Các component đang dùng camelCase, giữ lại để khỏi đổi hết UI
export type DbCategory = Category
export type DbUnit = Unit
export type DbProduct = Product & {
  // camelCase aliases
  categoryId: string | undefined
  unitId: string
  sellingPrice: number
  costPrice: number
  stockQuantity: number
  isDeleted: boolean
  createdAt: string | undefined
  updatedAt: string | undefined
}
export type DbTransaction = Transaction & {
  transactionCode: string
  discountAmount: number
  totalAmount: number
  paymentMethod: 'cash' | 'qr'
  createdAt: string | undefined
  saleDate: string | undefined
  voidedAt?: string
  voidedReason?: string
}

export type DbTransactionEditLog = TransactionEditLog & {
  transactionId: string
  fieldName: string
  oldValue: string | undefined
  newValue: string | undefined
  editReason: string | undefined
  createdAt: string | undefined
}
export type DbTransactionItem = TransactionItem & {
  transactionId: string
  productId: string
  productName: string
  unitPrice: number
  unitName: string
}
export type DbInventoryLog = InventoryLog & {
  productId: string
  changeQuantity: number
  quantityBefore: number
  quantityAfter: number
  referenceId: string | undefined
  createdAt: string | undefined
}

/** Map snake_case Product → camelCase for UI components */
export function mapProduct(p: Product): DbProduct {
  return {
    ...p,
    categoryId: p.category_id,
    unitId: p.unit_id,
    sellingPrice: p.selling_price,
    costPrice: p.cost_price,
    stockQuantity: p.stock_quantity,
    isDeleted: p.is_deleted,
    createdAt: p.created_at,
    updatedAt: p.updated_at,
  }
}

/** Map snake_case Transaction → camelCase for UI */
export function mapTransaction(t: Transaction): DbTransaction {
  return {
    ...t,
    transactionCode: t.transaction_code,
    discountAmount: t.discount_amount,
    totalAmount: t.total_amount,
    paymentMethod: t.payment_method,
    createdAt: t.created_at,
    saleDate: t.sale_date,
    voidedAt: t.voided_at,
    voidedReason: t.voided_reason,
  }
}

/** Map snake_case TransactionEditLog → camelCase for UI */
export function mapTransactionEditLog(l: TransactionEditLog): DbTransactionEditLog {
  return {
    ...l,
    transactionId: l.transaction_id,
    fieldName: l.field_name,
    oldValue: l.old_value,
    newValue: l.new_value,
    editReason: l.edit_reason,
    createdAt: l.created_at,
  }
}

/** Map snake_case TransactionItem → camelCase for UI */
export function mapTransactionItem(i: TransactionItem): DbTransactionItem {
  return {
    ...i,
    transactionId: i.transaction_id,
    productId: i.product_id,
    productName: i.product_name,
    unitPrice: i.unit_price,
    unitName: i.unit_name,
  }
}

/** Map snake_case InventoryLog → camelCase for UI */
export function mapInventoryLog(l: InventoryLog): DbInventoryLog {
  return {
    ...l,
    productId: l.product_id,
    changeQuantity: l.change_quantity,
    quantityBefore: l.quantity_before,
    quantityAfter: l.quantity_after,
    referenceId: l.reference_id,
    createdAt: l.created_at,
  }
}

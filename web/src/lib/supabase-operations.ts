import { supabase, mapProduct, mapTransaction, mapTransactionItem, mapInventoryLog } from './supabase'
import type { DbProduct, DbTransaction, DbTransactionItem, DbInventoryLog, Unit, Category } from './supabase'

// ─── Categories ───────────────────────────────────────────────────────────────

export async function getCategories(): Promise<Category[]> {
  const { data, error } = await supabase.from('categories').select('*').order('name')
  if (error) throw error
  return data ?? []
}

export interface CategoryWithCount extends Category {
  productCount: number
}

export async function getCategoriesWithCount(): Promise<CategoryWithCount[]> {
  const [{ data: cats, error: catsErr }, { data: prods, error: prodsErr }] = await Promise.all([
    supabase.from('categories').select('*').order('name'),
    supabase.from('products').select('category_id').eq('is_deleted', false),
  ])
  if (catsErr) throw catsErr
  if (prodsErr) throw prodsErr
  const countMap: Record<string, number> = {}
  for (const p of prods ?? []) {
    if (p.category_id) countMap[p.category_id] = (countMap[p.category_id] ?? 0) + 1
  }
  return (cats ?? []).map((c) => ({ ...c, productCount: countMap[c.id] ?? 0 }))
}

export async function createCategory(name: string, description?: string): Promise<Category> {
  const { data, error } = await supabase
    .from('categories')
    .insert({ name, description: description || null })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateCategory(id: string, name: string, description?: string): Promise<void> {
  const { error } = await supabase
    .from('categories')
    .update({ name, description: description || null, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}

export async function deleteCategory(id: string): Promise<void> {
  const { error } = await supabase.from('categories').delete().eq('id', id)
  if (error) throw error
}

// ─── Units ────────────────────────────────────────────────────────────────────

export async function getUnits(): Promise<Unit[]> {
  const { data, error } = await supabase.from('units').select('*').order('name')
  if (error) throw error
  return data ?? []
}

export interface UnitWithCount extends Unit {
  productCount: number
}

export async function getUnitsWithCount(): Promise<UnitWithCount[]> {
  const [{ data: units, error: unitsErr }, { data: prods, error: prodsErr }] = await Promise.all([
    supabase.from('units').select('*').order('name'),
    supabase.from('products').select('unit_id').eq('is_deleted', false),
  ])
  if (unitsErr) throw unitsErr
  if (prodsErr) throw prodsErr
  const countMap: Record<string, number> = {}
  for (const p of prods ?? []) {
    if (p.unit_id) countMap[p.unit_id] = (countMap[p.unit_id] ?? 0) + 1
  }
  return (units ?? []).map((u) => ({ ...u, productCount: countMap[u.id] ?? 0 }))
}

export async function createUnit(name: string, abbreviation: string): Promise<Unit> {
  const { data, error } = await supabase
    .from('units')
    .insert({ name, abbreviation })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateUnit(id: string, name: string, abbreviation: string): Promise<void> {
  const { error } = await supabase
    .from('units')
    .update({ name, abbreviation })
    .eq('id', id)
  if (error) throw error
}

export async function deleteUnit(id: string): Promise<void> {
  const { error } = await supabase.from('units').delete().eq('id', id)
  if (error) throw error
}

// ─── Products ─────────────────────────────────────────────────────────────────

export async function getProducts(): Promise<DbProduct[]> {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('is_deleted', false)
    .order('name')
  if (error) throw error
  return (data ?? []).map(mapProduct)
}

export async function createProduct(input: {
  name: string
  barcode?: string
  categoryId?: string
  unitId: string
  sellingPrice: number
  costPrice: number
  stockQuantity: number
  lowStockThreshold: number
  description?: string
}): Promise<DbProduct> {
  const { data, error } = await supabase
    .from('products')
    .insert({
      name: input.name,
      barcode: input.barcode || null,
      category_id: input.categoryId || null,
      unit_id: input.unitId,
      selling_price: input.sellingPrice,
      cost_price: input.costPrice,
      stock_quantity: input.stockQuantity,
      low_stock_threshold: input.lowStockThreshold,
      description: input.description || null,
      is_deleted: false,
    })
    .select()
    .single()
  if (error) throw error
  return mapProduct(data)
}

export async function updateProduct(
  id: string,
  input: {
    name?: string
    barcode?: string
    categoryId?: string
    unitId?: string
    sellingPrice?: number
    costPrice?: number
    stockQuantity?: number
    lowStockThreshold?: number
    description?: string
  },
): Promise<DbProduct> {
  const patch: Record<string, unknown> = {}
  if (input.name !== undefined) patch.name = input.name
  if (input.barcode !== undefined) patch.barcode = input.barcode
  if (input.categoryId !== undefined) patch.category_id = input.categoryId
  if (input.unitId !== undefined) patch.unit_id = input.unitId
  if (input.sellingPrice !== undefined) patch.selling_price = input.sellingPrice
  if (input.costPrice !== undefined) patch.cost_price = input.costPrice
  if (input.stockQuantity !== undefined) patch.stock_quantity = input.stockQuantity
  if (input.lowStockThreshold !== undefined) patch.low_stock_threshold = input.lowStockThreshold
  if (input.description !== undefined) patch.description = input.description
  patch.updated_at = new Date().toISOString()

  const { data, error } = await supabase
    .from('products')
    .update(patch)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return mapProduct(data)
}

export async function softDeleteProduct(id: string): Promise<void> {
  const { error } = await supabase
    .from('products')
    .update({ is_deleted: true, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}

// ─── Transactions ─────────────────────────────────────────────────────────────

export interface CreateTransactionInput {
  transactionCode: string
  subtotal: number
  discountAmount: number
  total: number
  paymentMethod: 'cash' | 'qr'
  notes?: string
  items: {
    productId: string
    productName: string
    unitPrice: number
    quantity: number
    subtotal: number
    unitId?: string
    unitName: string
  }[]
}

/**
 * Tạo transaction + items + trừ tồn kho theo thứ tự tuần tự.
 * Supabase JS không có client-side transaction nên dùng sequential inserts.
 */
export async function createTransaction(input: CreateTransactionInput): Promise<{
  transaction: DbTransaction
  items: DbTransactionItem[]
}> {
  // 1. Insert transaction
  const { data: txData, error: txError } = await supabase
    .from('transactions')
    .insert({
      transaction_code: input.transactionCode,
      subtotal: input.subtotal,
      discount_amount: input.discountAmount,
      total_amount: input.total,
      payment_method: input.paymentMethod,
      notes: input.notes || null,
    })
    .select()
    .single()
  if (txError) throw txError

  // 2. Insert transaction items
  const itemsToInsert = input.items.map((item) => ({
    transaction_id: txData.id,
    product_id: item.productId,
    product_name: item.productName,
    unit_price: item.unitPrice,
    quantity: item.quantity,
    subtotal: item.subtotal,
    unit_id: item.unitId,
    unit_name: item.unitName,
  }))

  const { data: itemsData, error: itemsError } = await supabase
    .from('transaction_items')
    .insert(itemsToInsert)
    .select()
  if (itemsError) throw itemsError

  // 3. Cập nhật stock và tạo inventory logs cho từng sản phẩm
  for (const item of input.items) {
    // Lấy stock hiện tại
    const { data: prod, error: prodError } = await supabase
      .from('products')
      .select('stock_quantity')
      .eq('id', item.productId)
      .single()
    if (prodError) throw prodError

    const qtyBefore = prod.stock_quantity
    const qtyAfter = qtyBefore - item.quantity

    // Cập nhật stock
    const { error: updateError } = await supabase
      .from('products')
      .update({ stock_quantity: qtyAfter, updated_at: new Date().toISOString() })
      .eq('id', item.productId)
    if (updateError) throw updateError

    // Tạo inventory log
    const { error: logError } = await supabase.from('inventory_logs').insert({
      product_id: item.productId,
      change_quantity: -item.quantity,
      quantity_before: qtyBefore,
      quantity_after: qtyAfter,
      reason: 'sale',
      reference_id: txData.id,
    })
    if (logError) throw logError
  }

  return {
    transaction: mapTransaction(txData),
    items: (itemsData ?? []).map(mapTransactionItem),
  }
}

export async function getTransactions(filter: {
  from?: number // timestamp ms
  to?: number // timestamp ms
}): Promise<DbTransaction[]> {
  let query = supabase.from('transactions').select('*').order('created_at', { ascending: false })

  if (filter.from) {
    query = query.gte('created_at', new Date(filter.from).toISOString())
  }
  if (filter.to) {
    query = query.lte('created_at', new Date(filter.to).toISOString())
  }

  const { data, error } = await query
  if (error) throw error
  return (data ?? []).map(mapTransaction)
}

export async function getTransactionItems(transactionId: string): Promise<DbTransactionItem[]> {
  const { data, error } = await supabase
    .from('transaction_items')
    .select('*')
    .eq('transaction_id', transactionId)
  if (error) throw error
  return (data ?? []).map(mapTransactionItem)
}

// ─── Inventory / Stock Adjustment ────────────────────────────────────────────

export async function adjustStock(
  productId: string,
  changeQty: number,
  reason: 'adjust_in' | 'adjust_out' | 'set_stock',
): Promise<void> {
  const { data: prod, error: prodError } = await supabase
    .from('products')
    .select('stock_quantity')
    .eq('id', productId)
    .single()
  if (prodError) throw prodError

  const qtyBefore = prod.stock_quantity
  const qtyAfter = reason === 'set_stock' ? changeQty : qtyBefore + changeQty

  const { error: updateError } = await supabase
    .from('products')
    .update({ stock_quantity: qtyAfter, updated_at: new Date().toISOString() })
    .eq('id', productId)
  if (updateError) throw updateError

  const { error: logError } = await supabase.from('inventory_logs').insert({
    product_id: productId,
    change_quantity: qtyAfter - qtyBefore,
    quantity_before: qtyBefore,
    quantity_after: qtyAfter,
    reason,
  })
  if (logError) throw logError
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export interface DashboardRawData {
  transactions: DbTransaction[]
  transactionItems: DbTransactionItem[]
  products: DbProduct[]
}

/**
 * Fetch all data needed for dashboard aggregation in a given date range.
 */
export async function getDashboardData(from: Date, to: Date): Promise<DashboardRawData> {
  const fromISO = from.toISOString()
  const toISO = to.toISOString()

  const { data: txRaw, error: txErr } = await supabase
    .from('transactions')
    .select('*')
    .gte('created_at', fromISO)
    .lte('created_at', toISO)
    .order('created_at', { ascending: true })
  if (txErr) throw txErr

  const transactions = (txRaw ?? []).map(mapTransaction)

  let transactionItems: DbTransactionItem[] = []
  if (transactions.length > 0) {
    const txIds = transactions.map((t) => t.id)
    const { data: itemsRaw, error: itemsErr } = await supabase
      .from('transaction_items')
      .select('*')
      .in('transaction_id', txIds)
    if (itemsErr) throw itemsErr
    transactionItems = (itemsRaw ?? []).map(mapTransactionItem)
  }

  // Fetch all products including soft-deleted ones to preserve cost lookup for past sales
  const { data: prodsRaw, error: prodsErr } = await supabase
    .from('products')
    .select('*')
  if (prodsErr) throw prodsErr
  const products = (prodsRaw ?? []).map(mapProduct)

  return { transactions, transactionItems, products }
}

export async function getInventoryLogs(filter: {
  productId?: string
  from?: number
  to?: number
  limit?: number
}): Promise<DbInventoryLog[]> {
  let query = supabase
    .from('inventory_logs')
    .select('*')
    .order('created_at', { ascending: false })

  if (filter.productId) {
    query = query.eq('product_id', filter.productId)
  }
  if (filter.from) {
    query = query.gte('created_at', new Date(filter.from).toISOString())
  }
  if (filter.to) {
    query = query.lte('created_at', new Date(filter.to).toISOString())
  }
  if (filter.limit) {
    query = query.limit(filter.limit)
  }

  const { data, error } = await query
  if (error) throw error
  return (data ?? []).map(mapInventoryLog)
}

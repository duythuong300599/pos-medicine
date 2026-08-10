import { supabase, mapProduct, mapTransaction, mapTransactionItem, mapInventoryLog, mapTransactionEditLog } from './supabase'
import type { DbProduct, DbTransaction, DbTransactionItem, DbInventoryLog, DbTransactionEditLog, Unit, Category } from './supabase'

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
  categoryId?: string
  unitId: string
  sellingPrice: number
  costPrice: number
  stockQuantity: number
  description?: string
}): Promise<DbProduct> {
  const { data, error } = await supabase
    .from('products')
    .insert({
      name: input.name,
      category_id: input.categoryId || null,
      unit_id: input.unitId,
      selling_price: input.sellingPrice,
      cost_price: input.costPrice,
      stock_quantity: input.stockQuantity,
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
    categoryId?: string
    unitId?: string
    sellingPrice?: number
    costPrice?: number
    stockQuantity?: number
    description?: string
  },
): Promise<DbProduct> {
  const patch: Record<string, unknown> = {}
  if (input.name !== undefined) patch.name = input.name
  if (input.categoryId !== undefined) patch.category_id = input.categoryId
  if (input.unitId !== undefined) patch.unit_id = input.unitId
  if (input.sellingPrice !== undefined) patch.selling_price = input.sellingPrice
  if (input.costPrice !== undefined) patch.cost_price = input.costPrice
  if (input.stockQuantity !== undefined) patch.stock_quantity = input.stockQuantity
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
  /** Ngày bán thực tế (ISO string). Mặc định = now() nếu không truyền. */
  saleDate?: string
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
      sale_date: input.saleDate || new Date().toISOString(),
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
  let query = supabase.from('transactions').select('*').neq('status', 'voided').order('sale_date', { ascending: false })

  if (filter.from) {
    query = query.gte('sale_date', new Date(filter.from).toISOString())
  }
  if (filter.to) {
    query = query.lte('sale_date', new Date(filter.to).toISOString())
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

export interface UpdateTransactionInput {
  paymentMethod?: 'cash' | 'qr'
  notes?: string | null
  saleDate?: string
  discountAmount?: number
  subtotal?: number
  total?: number
  /** Lý do chỉnh sửa để ghi vào audit log */
  editReason?: string
}

/**
 * Cập nhật thông tin hoá đơn và ghi audit log cho từng trường thay đổi.
 * Chỉ hỗ trợ chỉnh sửa metadata (không thay đổi items để tránh phức tạp hóa tồn kho).
 */
export async function updateTransaction(
  id: string,
  input: UpdateTransactionInput,
  original: DbTransaction,
): Promise<DbTransaction> {
  if (original.status === 'voided') throw new Error('Không thể chỉnh sửa hoá đơn đã huỷ')

  const patch: Record<string, unknown> = {}
  const logs: { field_name: string; old_value: string | null; new_value: string | null }[] = []

  if (input.paymentMethod !== undefined && input.paymentMethod !== original.payment_method) {
    patch.payment_method = input.paymentMethod
    logs.push({
      field_name: 'payment_method',
      old_value: original.payment_method,
      new_value: input.paymentMethod,
    })
  }

  if (input.notes !== undefined && input.notes !== original.notes) {
    patch.notes = input.notes
    logs.push({
      field_name: 'notes',
      old_value: original.notes ?? null,
      new_value: input.notes,
    })
  }

  if (input.saleDate !== undefined && input.saleDate !== original.sale_date) {
    patch.sale_date = input.saleDate
    logs.push({
      field_name: 'sale_date',
      old_value: original.sale_date ?? null,
      new_value: input.saleDate,
    })
  }

  if (input.discountAmount !== undefined && input.discountAmount !== original.discount_amount) {
    patch.discount_amount = input.discountAmount
    logs.push({
      field_name: 'discount_amount',
      old_value: String(original.discount_amount),
      new_value: String(input.discountAmount),
    })
  }

  if (input.subtotal !== undefined && input.subtotal !== original.subtotal) {
    patch.subtotal = input.subtotal
    logs.push({
      field_name: 'subtotal',
      old_value: String(original.subtotal),
      new_value: String(input.subtotal),
    })
  }

  if (input.total !== undefined && input.total !== original.total_amount) {
    patch.total_amount = input.total
    logs.push({
      field_name: 'total_amount',
      old_value: String(original.total_amount),
      new_value: String(input.total),
    })
  }

  if (Object.keys(patch).length === 0) {
    return original
  }

  const { data, error } = await supabase
    .from('transactions')
    .update(patch)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error

  // Ghi audit logs
  if (logs.length > 0) {
    const logsToInsert = logs.map((l) => ({
      transaction_id: id,
      field_name: l.field_name,
      old_value: l.old_value,
      new_value: l.new_value,
      edit_reason: input.editReason || null,
    }))
    const { error: logError } = await supabase.from('transaction_edit_logs').insert(logsToInsert)
    if (logError) throw logError
  }

  return mapTransaction(data)
}

export interface UpdateItemPriceInput {
  itemId: string
  oldPrice: number
  newPrice: number
}

/**
 * Cập nhật giá bán của từng item trong hoá đơn đã lưu.
 * - Cập nhật unit_price và subtotal của từng transaction_item bị thay đổi
 * - Tính lại transactions.subtotal và total_amount
 * - Ghi audit logs cho từng item thay đổi giá
 */
export async function updateTransactionItemPrices(
  transactionId: string,
  original: DbTransaction,
  changes: UpdateItemPriceInput[],
  editReason?: string,
): Promise<DbTransaction> {
  const actualChanges = changes.filter((c) => c.oldPrice !== c.newPrice)
  if (actualChanges.length === 0) return original

  // 1. Fetch all items để tính lại subtotal
  const { data: allItems, error: fetchErr } = await supabase
    .from('transaction_items')
    .select('id, unit_price, quantity, subtotal')
    .eq('transaction_id', transactionId)
  if (fetchErr) throw fetchErr

  // 2. Cập nhật từng item bị thay đổi giá
  for (const change of actualChanges) {
    const item = (allItems ?? []).find((i) => i.id === change.itemId)
    if (!item) continue
    const newSubtotal = change.newPrice * item.quantity
    const { error } = await supabase
      .from('transaction_items')
      .update({ unit_price: change.newPrice, subtotal: newSubtotal })
      .eq('id', change.itemId)
    if (error) throw error
  }

  // 3. Tính lại subtotal và total_amount cho transaction
  const newSubtotals = (allItems ?? []).map((item) => {
    const change = actualChanges.find((c) => c.itemId === item.id)
    const price = change ? change.newPrice : item.unit_price
    return price * item.quantity
  })
  const newSubtotal = newSubtotals.reduce((s, v) => s + v, 0)
  const discount = original.discount_amount ?? 0
  const newTotal = Math.max(0, newSubtotal - discount)

  const txPatch: Record<string, unknown> = {}
  if (newSubtotal !== original.subtotal) txPatch.subtotal = newSubtotal
  if (newTotal !== original.total_amount) txPatch.total_amount = newTotal

  let updatedTx = original
  if (Object.keys(txPatch).length > 0) {
    const { data, error } = await supabase
      .from('transactions')
      .update(txPatch)
      .eq('id', transactionId)
      .select()
      .single()
    if (error) throw error
    updatedTx = mapTransaction(data)
  }

  // 4. Ghi audit logs
  const logsToInsert = actualChanges.map((c) => ({
    transaction_id: transactionId,
    field_name: `item_price:${c.itemId}`,
    old_value: String(c.oldPrice),
    new_value: String(c.newPrice),
    edit_reason: editReason || null,
  }))
  const { error: logErr } = await supabase.from('transaction_edit_logs').insert(logsToInsert)
  if (logErr) throw logErr

  return updatedTx
}

/**
 * Huỷ hoá đơn: hoàn kho từng sản phẩm, đánh dấu voided, giữ nguyên audit trail.
 */
export async function voidTransaction(
  id: string,
  reason: string,
): Promise<DbTransaction> {
  // 1. Lấy transaction + items
  const { data: tx, error: txErr } = await supabase
    .from('transactions')
    .select('*')
    .eq('id', id)
    .single()
  if (txErr) throw txErr
  if (tx.status === 'voided') throw new Error('Hoá đơn đã bị huỷ trước đó')

  const { data: items, error: itemsErr } = await supabase
    .from('transaction_items')
    .select('*')
    .eq('transaction_id', id)
  if (itemsErr) throw itemsErr

  // 2. Hoàn kho từng sản phẩm + tạo inventory log
  for (const item of items ?? []) {
    const { data: prod, error: prodErr } = await supabase
      .from('products')
      .select('stock_quantity')
      .eq('id', item.product_id)
      .single()
    if (prodErr) throw prodErr

    const qtyBefore = prod.stock_quantity
    const qtyAfter = qtyBefore + item.quantity

    const { error: updateErr } = await supabase
      .from('products')
      .update({ stock_quantity: qtyAfter, updated_at: new Date().toISOString() })
      .eq('id', item.product_id)
    if (updateErr) throw updateErr

    const { error: logErr } = await supabase.from('inventory_logs').insert({
      product_id: item.product_id,
      change_quantity: item.quantity,
      quantity_before: qtyBefore,
      quantity_after: qtyAfter,
      reason: 'void_return',
      reference_id: id,
    })
    if (logErr) throw logErr
  }

  // 3. Đánh dấu voided
  const { data: updated, error: voidErr } = await supabase
    .from('transactions')
    .update({
      status: 'voided',
      voided_at: new Date().toISOString(),
      voided_reason: reason,
    })
    .eq('id', id)
    .select()
    .single()
  if (voidErr) throw voidErr

  return mapTransaction(updated)
}

export async function getTransactionEditLogs(transactionId: string): Promise<DbTransactionEditLog[]> {
  const { data, error } = await supabase
    .from('transaction_edit_logs')
    .select('*')
    .eq('transaction_id', transactionId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map(mapTransactionEditLog)
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
    .neq('status', 'voided')
    .gte('sale_date', fromISO)
    .lte('sale_date', toISO)
    .order('sale_date', { ascending: true })
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

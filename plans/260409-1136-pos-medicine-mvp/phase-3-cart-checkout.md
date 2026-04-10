# Phase 3: Cart & Checkout Feature

## Mục tiêu

Giỏ hàng, thanh toán (cash + QR tĩnh), lưu giao dịch vào DB, trừ tồn kho, in/lưu hóa đơn.

## Requirements

- Thêm sản phẩm vào cart từ catalog
- Thay đổi số lượng, xóa item trong cart
- Áp dụng discount (% hoặc số tiền cố định)
- Thanh toán: Cash (tính tiền thừa) + QR tĩnh
- Lưu Transaction + TransactionItems vào DB
- Trừ stock_quantity sau checkout (theo unit conversion)
- Tạo InventoryLog với reason = 'sale'
- Receipt screen + in/share hóa đơn

## Architecture

```
lib/features/cart/
├── domain/
│   ├── cart_item.dart       # CartItem model (Equatable)
│   └── cart_state.dart      # CartState (items, discount, total)
└── presentation/
    ├── cart_provider.dart   # CartNotifier (Notifier)
    ├── cart_screen.dart
    └── cart_item_widget.dart

lib/features/checkout/
├── domain/
│   ├── transaction.dart
│   └── transaction_item.dart
├── data/
│   ├── transaction_repository.dart          # abstract
│   └── drift_transaction_repository.dart    # Drift impl
└── presentation/
    ├── checkout_provider.dart
    ├── checkout_screen.dart
    ├── payment_method_widget.dart
    └── receipt_screen.dart
```

## Implementation Steps

1. Tạo `CartItem` model: productId, productName, unitId, unitPrice, quantity, subtotal
2. Tạo `CartState`: items (List<CartItem>), discountAmount, totalBeforeDiscount, totalAfterDiscount
3. Tạo `CartNotifier` (Notifier):
   - `addItem(product, quantity)` — nếu đã có thì tăng qty
   - `updateQuantity(productId, quantity)` — qty = 0 → remove
   - `removeItem(productId)`
   - `applyDiscount(amount)` — fixed amount discount
   - `applyDiscountPercent(percent)` — percent discount
   - `clearCart()`
4. Tạo `Transaction` và `TransactionItem` domain entities
5. Implement `DriftTransactionRepository`:
   - `createTransaction(transaction, items)` — transaction DB (atomic)
   - `getAll()` → Stream
   - `getById(id)`
6. `CheckoutNotifier`:
   - `checkout(cartState, paymentMethod)`:
     1. Generate transaction ID + code
     2. Insert transaction + items
     3. Trừ stock cho từng item (theo unit conversion chain)
     4. Tạo InventoryLog entries (reason: 'sale')
     5. Clear cart
     6. Navigate to receipt
7. `CheckoutScreen`: tóm tắt giỏ hàng + chọn payment method + nhập tiền khách đưa (cash)
8. `PaymentMethodWidget`: Cash / QR tabs
9. `ReceiptScreen`: hiển thị transaction detail + nút Print/Share (pdf + printing)

## Cart Flow

```
CatalogScreen → [Add to Cart] →
CartScreen (adjust qty/discount) →
CheckoutScreen (select Cash/QR, enter cash amount) →
[Confirm] →
  - save Transaction + TransactionItems to DB
  - deduct stock_quantity (via unit conversion)
  - create InventoryLog (reason: 'sale')
  - clear cart →
ReceiptScreen
```

## Acceptance Criteria

- [ ] Thêm sản phẩm vào cart từ catalog hoạt động
- [ ] Thay đổi số lượng trong cart, xóa item hoạt động
- [ ] Discount (% và số tiền) tính đúng
- [ ] Tổng tiền tính đúng, tiền thừa (cash change) hiển thị đúng
- [ ] Checkout lưu transaction vào DB thành công
- [ ] Tồn kho bị trừ đúng sau checkout (theo unit conversion)
- [ ] InventoryLog được tạo với reason = 'sale'
- [ ] Receipt hiển thị đầy đủ: items, số lượng, giá, tổng, phương thức TT
- [ ] Print/Share receipt hoạt động qua iOS/Android system share sheet
- [ ] Cart empty sau checkout thành công
- [ ] `flutter analyze` không có lỗi mới

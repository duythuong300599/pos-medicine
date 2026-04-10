# Phase 5: Inventory Management Feature

## Mục tiêu

Quản lý tồn kho, cảnh báo hết hàng, điều chỉnh thủ công, lịch sử nhập/xuất kho.

## Requirements

- Danh sách sản phẩm với tồn kho hiện tại
- Highlight sản phẩm dưới ngưỡng low_stock_threshold
- Điều chỉnh thủ công: nhập thêm (+), xuất (-), đặt lại (=)
- InventoryLog ghi lại mọi thay đổi kho với lý do
- Lịch sử nhập/xuất theo từng sản phẩm

## Architecture

```
lib/features/inventory/
├── domain/
│   └── inventory_log.dart               # InventoryLog entity
├── data/
│   ├── inventory_repository.dart        # abstract
│   └── drift_inventory_repository.dart  # Drift impl
└── presentation/
    ├── inventory_provider.dart          # Riverpod providers
    ├── inventory_screen.dart            # danh sách + stock levels
    └── stock_adjustment_screen.dart     # nhập/điều chỉnh kho
```

## Implementation Steps

1. Tạo `InventoryLog` entity: id, productId, changeQuantity, reason, referenceId, syncStatus, createdAt
2. Implement `DriftInventoryRepository`:
   - `adjustStock(productId, changeQty, reason, referenceId)` — atomic: update products.stock_quantity + insert inventory_logs
   - `setStock(productId, newQty, reason)` — set tuyệt đối (= mode)
   - `watchLogsByProduct(productId)` → Stream<List<InventoryLog>>
   - `watchLowStockProducts(threshold)` → Stream (products where stock < threshold)
3. Tạo `InventoryProvider`:
   - `inventoryProductsProvider` — watch all products với stock info
   - `lowStockProductsProvider` — chỉ products dưới ngưỡng
   - `inventoryLogsProvider(productId)` — log theo product
   - `stockAdjustmentProvider` — Notifier cho adjustment form
4. Tạo `InventoryScreen`:
   - Tab: Tất cả / Sắp hết hàng
   - Product list với stock quantity + highlight khi low
   - Tap → `StockAdjustmentScreen`
5. Tạo `StockAdjustmentScreen`:
   - Hiển thị tồn kho hiện tại
   - Mode selector: Nhập thêm (+) / Xuất (-) / Đặt lại (=)
   - Nhập số lượng + lý do (text field)
   - Submit → gọi repository adjust/set

## Acceptance Criteria

- [ ] Danh sách sản phẩm với tồn kho hiện tại hiển thị đúng
- [ ] Sản phẩm dưới ngưỡng được highlight rõ ràng
- [ ] Điều chỉnh thủ công (+/-/=) cập nhật stock_quantity đúng
- [ ] InventoryLog được tạo cho mọi thay đổi kho thủ công
- [ ] Lịch sử nhập/xuất kho theo sản phẩm hiển thị đúng thứ tự
- [ ] Tồn kho đồng bộ với catalog screen (cùng nguồn dữ liệu)
- [ ] `flutter analyze` không có lỗi mới

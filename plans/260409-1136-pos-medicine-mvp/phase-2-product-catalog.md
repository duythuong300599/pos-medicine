# Phase 2: Product Catalog Feature

## Mục tiêu

Quản lý danh mục thuốc, tìm kiếm realtime, barcode scan, đơn vị lồng nhau (hộp/vỉ/viên).

## Requirements

- CRUD sản phẩm (thêm/sửa/xóa mềm)
- Tìm kiếm theo tên realtime
- Filter theo danh mục
- Scan barcode để tìm hoặc tạo sản phẩm mới
- Đơn vị lồng nhau với conversion chain
- Hiển thị tồn kho, cảnh báo dưới ngưỡng

## Architecture

```
lib/features/catalog/
├── domain/
│   ├── product.dart               # Product entity (Equatable)
│   └── category.dart              # Category entity (Equatable)
├── data/
│   ├── product_repository.dart    # abstract interface
│   ├── drift_product_repository.dart  # Drift impl
│   ├── category_repository.dart
│   └── drift_category_repository.dart
└── presentation/
    ├── catalog_provider.dart      # Riverpod providers
    ├── catalog_screen.dart        # danh sách + search + filter
    ├── product_form_screen.dart   # thêm/sửa sản phẩm
    └── product_card_widget.dart

lib/shared/widgets/
└── barcode_scanner_widget.dart    # mobile_scanner wrapper
```

## Implementation Steps

1. Tạo `Product` entity (Equatable): id, name, barcode, categoryId, unitId, price, stockQuantity, lowStockThreshold, isActive, isDeleted, syncStatus, createdAt, updatedAt
2. Tạo `Category` entity (Equatable): id, name, createdAt, updatedAt, isDeleted
3. Định nghĩa abstract `ProductRepository` và `CategoryRepository` interfaces
4. Implement `DriftProductRepository`:
   - `watchAll(searchQuery, categoryId)` → Stream với `where` filter
   - `getById(id)` → nullable
   - `insert(product)`, `update(product)`, `softDelete(id)` (set is_deleted = true)
   - `getByBarcode(barcode)` → nullable
5. Implement `DriftCategoryRepository`: CRUD cơ bản
6. Tạo Riverpod providers:
   - `productRepositoryProvider` (Provider)
   - `productsProvider(searchQuery, categoryId)` (StreamProvider)
   - `categoriesProvider` (StreamProvider)
   - `productFormProvider` (StateNotifierProvider hoặc NotifierProvider)
7. Tạo `BarcodeScanner Widget` bọc `mobile_scanner`:
   - Callback `onDetect(barcode)`
   - Nút toggle flash, switch camera
8. Tạo `CatalogScreen`: search bar + category filter chips + product grid
9. Tạo `ProductFormScreen`: form thêm/sửa với barcode scan trigger
10. Tạo `ProductCardWidget`: hiển thị tên, giá, tồn kho, low-stock indicator

## Unit Conversion Logic

```dart
// Trong domain layer — UnitConverter utility
// VD: hộp (10 vỉ) → vỉ (10 viên) → viên (base)
// getBaseQuantity(quantity: 1, unitId: 'hop') → 100 viên
// Traversal: load unit chain đến khi base_unit_id == null
// multiply conversion_factor at each level
```

## Acceptance Criteria

- [ ] Thêm/sửa/xóa mềm sản phẩm hoạt động đúng
- [ ] Tìm kiếm sản phẩm theo tên realtime (debounced 300ms)
- [ ] Filter theo danh mục hoạt động
- [ ] Scan barcode → tìm sản phẩm tương ứng trong DB
- [ ] Scan barcode sản phẩm chưa có → mở form thêm mới với barcode prefill
- [ ] Đơn vị lồng nhau cấu hình được (hộp/vỉ/viên) và conversion_factor đúng
- [ ] Tồn kho hiển thị đúng trên product card
- [ ] Low-stock warning hiển thị khi stock < low_stock_threshold
- [ ] `flutter analyze` không có lỗi mới

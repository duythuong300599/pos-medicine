---
id: 260409-1136-pos-medicine-mvp
title: POS Medicine MVP — Implementation Plan
status: pending
tech_stack: [flutter, dart, drift, riverpod, go_router]
platform: [ios, android]
developer: duythuong
created_at: 2026-04-09
---

# POS Medicine MVP — Implementation Plan

## Overview

Flutter mobile app (iOS & Android) cho nhà thuốc nhỏ lẻ. Offline-first, SQLite local storage, không có backend trong MVP. Architecture: Clean Architecture + Feature-first + Riverpod 2.x codegen + Drift ORM.

## Phases

| Phase | Tên | Phụ thuộc |
|-------|-----|-----------|
| 1 | Project Setup & Core Infrastructure | none |
| 2 | Product Catalog Feature | Phase 1 |
| 3 | Cart & Checkout Feature | Phase 2 |
| 4 | Transaction History Feature | Phase 3 |
| 5 | Inventory Management Feature | Phase 3 |
| 6 | Polish & QA | Phase 4, Phase 5 |

## Dependencies

- Phase 1 → base cho tất cả phases
- Phase 2 → phải xong trước Phase 3 (Cart cần Product data)
- Phase 3 → phải xong trước Phase 4, 5
- Phase 4 + Phase 5 → có thể chạy song song
- Phase 6 → cần tất cả phases trước

## Test Strategy

- **Unit tests:** CartNotifier, Repository implementations (NativeDatabase.memory()), business logic (unit conversion, discount calc)
- **Integration tests:** Drift DB operations, full checkout flow (add to cart → checkout → verify transaction + inventory)
- **Manual testing:** UI flows trên iOS + Android simulator
- **Tool:** Flutter built-in `flutter_test`, `drift` in-memory DB cho test isolation
- **Coverage target:** Business logic và repository layer ≥ 80%

## Tổng quan

Flutter mobile app (iOS & Android) cho nhà thuốc nhỏ lẻ. Offline-first, SQLite local storage, không có backend trong MVP.

**Architecture:** Clean Architecture + Feature-first folder + Riverpod 2.x codegen + Drift ORM

---

## Packages cần thiết (pubspec.yaml)

```yaml
dependencies:
  flutter:
    sdk: flutter

  # State management + DI
  flutter_riverpod: ^2.5.1
  riverpod_annotation: ^2.3.5

  # Database
  drift: ^2.18.0
  sqlite3_flutter_libs: ^0.5.0
  path_provider: ^2.1.3
  path: ^1.9.0

  # Navigation
  go_router: ^13.2.0

  # Barcode scanning
  mobile_scanner: ^5.2.3

  # Receipt / PDF
  pdf: ^3.11.0
  printing: ^5.12.0

  # Utilities
  uuid: ^4.4.0
  intl: ^0.19.0
  equatable: ^2.0.5

dev_dependencies:
  flutter_test:
    sdk: flutter
  build_runner: ^2.4.9
  drift_dev: ^2.18.0
  riverpod_generator: ^2.4.0
  flutter_lints: ^3.0.0
```

---

## Folder Structure

```
lib/
├── main.dart
├── app.dart                        # MaterialApp + routing
│
├── core/
│   ├── database/
│   │   ├── app_database.dart       # Drift DB definition (tables)
│   │   ├── app_database.g.dart     # generated
│   │   └── migrations/
│   │       └── migration_strategy.dart
│   ├── constants/
│   │   └── app_constants.dart
│   ├── extensions/
│   │   ├── date_extensions.dart
│   │   └── number_extensions.dart
│   └── utils/
│       ├── uuid_generator.dart
│       └── currency_formatter.dart
│
├── features/
│   ├── catalog/
│   │   ├── data/
│   │   │   ├── product_repository.dart          # abstract
│   │   │   ├── drift_product_repository.dart    # impl
│   │   │   ├── category_repository.dart
│   │   │   └── drift_category_repository.dart
│   │   ├── domain/
│   │   │   ├── product.dart
│   │   │   └── category.dart
│   │   └── presentation/
│   │       ├── catalog_screen.dart
│   │       ├── product_form_screen.dart
│   │       ├── product_card_widget.dart
│   │       └── catalog_provider.dart            # Riverpod
│   │
│   ├── cart/
│   │   ├── domain/
│   │   │   ├── cart_item.dart
│   │   │   └── cart_state.dart
│   │   └── presentation/
│   │       ├── cart_screen.dart
│   │       ├── cart_item_widget.dart
│   │       └── cart_provider.dart               # CartNotifier
│   │
│   ├── checkout/
│   │   ├── data/
│   │   │   ├── transaction_repository.dart
│   │   │   └── drift_transaction_repository.dart
│   │   ├── domain/
│   │   │   ├── transaction.dart
│   │   │   └── transaction_item.dart
│   │   └── presentation/
│   │       ├── checkout_screen.dart
│   │       ├── payment_method_widget.dart
│   │       ├── receipt_screen.dart
│   │       └── checkout_provider.dart
│   │
│   ├── history/
│   │   └── presentation/
│   │       ├── history_screen.dart
│   │       ├── transaction_detail_screen.dart
│   │       └── history_provider.dart
│   │
│   └── inventory/
│       ├── data/
│       │   ├── inventory_repository.dart
│       │   └── drift_inventory_repository.dart
│       ├── domain/
│       │   └── inventory_log.dart
│       └── presentation/
│           ├── inventory_screen.dart
│           ├── stock_adjustment_screen.dart
│           └── inventory_provider.dart
│
└── shared/
    ├── widgets/
    │   ├── app_button.dart
    │   ├── app_text_field.dart
    │   ├── loading_widget.dart
    │   ├── empty_state_widget.dart
    │   └── barcode_scanner_widget.dart
    └── theme/
        ├── app_theme.dart
        ├── app_colors.dart
        └── app_text_styles.dart
```

---

## Phase 1: Project Setup & Core Infrastructure

**Mục tiêu:** Khởi tạo Flutter project với clean architecture, Drift database, Riverpod, go_router, theme.

**Files sẽ tạo:**
- `pubspec.yaml` — thêm tất cả dependencies
- `lib/main.dart` — app entry point + ProviderScope
- `lib/app.dart` — MaterialApp.router + go_router config
- `lib/core/database/app_database.dart` — Drift DB + tất cả table definitions
- `lib/core/database/migrations/migration_strategy.dart` — MigrationStrategy
- `lib/core/constants/app_constants.dart` — app-wide constants
- `lib/core/utils/uuid_generator.dart` — UUID v4 helper
- `lib/core/utils/currency_formatter.dart` — VND format
- `lib/shared/theme/app_theme.dart` + `app_colors.dart` + `app_text_styles.dart`

**Database Schema (Drift tables):**
```dart
// Trong app_database.dart định nghĩa các tables:
// - CategoriesTable
// - UnitsTable (có base_unit_id nullable FK, conversion_factor REAL)
// - ProductsTable
// - TransactionsTable
// - TransactionItemsTable
// - InventoryLogsTable
```

**Acceptance criteria:**
- [ ] `flutter pub get` thành công, không có conflict
- [ ] `flutter run` build thành công trên iOS + Android simulator
- [ ] Drift DB khởi tạo được, tất cả tables được tạo khi app start lần đầu
- [ ] `flutter pub run build_runner build` generate code thành công (Drift + Riverpod)
- [ ] Theme áp dụng đúng, không có default blue theme của Flutter
- [ ] go_router navigate được giữa 2 màn hình test

---

## Phase 2: Product Catalog Feature

**Mục tiêu:** Quản lý danh mục thuốc, tìm kiếm, barcode scan, đơn vị lồng nhau.

**Files sẽ tạo:**
- `lib/features/catalog/domain/product.dart` — Product entity (Equatable)
- `lib/features/catalog/domain/category.dart` — Category entity
- `lib/features/catalog/data/product_repository.dart` — abstract interface
- `lib/features/catalog/data/drift_product_repository.dart` — Drift impl
- `lib/features/catalog/data/category_repository.dart`
- `lib/features/catalog/data/drift_category_repository.dart`
- `lib/features/catalog/presentation/catalog_provider.dart` — Riverpod providers
- `lib/features/catalog/presentation/catalog_screen.dart` — danh sách + search
- `lib/features/catalog/presentation/product_form_screen.dart` — thêm/sửa sản phẩm
- `lib/features/catalog/presentation/product_card_widget.dart`
- `lib/shared/widgets/barcode_scanner_widget.dart` — mobile_scanner wrapper

**Unit đơn vị lồng nhau:**
- Bảng `units`: `id, name, base_unit_id (FK self), conversion_factor`
- VD: hộp (10 vỉ) → vỉ (10 viên) → viên (base)
- Khi bán 1 hộp → trừ kho 100 viên (tính qua conversion chain)

**Acceptance criteria:**
- [ ] Thêm/sửa/xóa (soft delete) sản phẩm hoạt động
- [ ] Tìm kiếm sản phẩm theo tên realtime
- [ ] Filter theo danh mục
- [ ] Scan barcode → tìm sản phẩm tương ứng
- [ ] Thêm sản phẩm mới qua barcode scan nếu chưa có
- [ ] Đơn vị lồng nhau setup được (hộp/vỉ/viên)
- [ ] Tồn kho hiển thị đúng, cảnh báo khi dưới ngưỡng

---

## Phase 3: Cart & Checkout Feature

**Mục tiêu:** Giỏ hàng, thanh toán (cash + QR), lưu giao dịch, trừ tồn kho.

**Files sẽ tạo:**
- `lib/features/cart/domain/cart_item.dart` — CartItem model
- `lib/features/cart/domain/cart_state.dart` — CartState (items, discount, total)
- `lib/features/cart/presentation/cart_provider.dart` — CartNotifier (AsyncNotifier)
- `lib/features/cart/presentation/cart_screen.dart` — danh sách items + tổng tiền
- `lib/features/cart/presentation/cart_item_widget.dart`
- `lib/features/checkout/domain/transaction.dart`
- `lib/features/checkout/domain/transaction_item.dart`
- `lib/features/checkout/data/transaction_repository.dart`
- `lib/features/checkout/data/drift_transaction_repository.dart`
- `lib/features/checkout/presentation/checkout_provider.dart`
- `lib/features/checkout/presentation/checkout_screen.dart` — chọn phương thức TT
- `lib/features/checkout/presentation/payment_method_widget.dart`
- `lib/features/checkout/presentation/receipt_screen.dart` — in/lưu hóa đơn

**Cart flow:**
```
Catalog → [Add to Cart] → Cart (update qty/discount) → Checkout
→ chọn Cash/QR → Confirm → lưu Transaction + TransactionItems
→ trừ inventory (stock_quantity) → tạo InventoryLog(reason: 'sale')
→ clear cart → Receipt Screen
```

**QR payment:** Hiển thị QR code tĩnh (số tài khoản/VietQR link) — không tích hợp cổng TT thật trong MVP.

**Acceptance criteria:**
- [ ] Thêm sản phẩm vào cart từ catalog screen
- [ ] Thay đổi số lượng trong cart, xóa item
- [ ] Áp dụng discount (% hoặc số tiền)
- [ ] Tổng tiền tính đúng, hiển thị tiền thừa (cash change)
- [ ] Checkout → lưu transaction thành công vào DB
- [ ] Tồn kho bị trừ đúng sau checkout (theo unit conversion)
- [ ] InventoryLog được tạo với reason='sale'
- [ ] Receipt screen hiển thị đầy đủ thông tin đơn hàng
- [ ] Print/Share receipt qua hệ thống iOS/Android
- [ ] Cart clear sau checkout thành công

---

## Phase 4: Transaction History Feature

**Mục tiêu:** Xem lịch sử giao dịch, filter, in lại hóa đơn.

**Files sẽ tạo:**
- `lib/features/history/presentation/history_screen.dart` — danh sách transactions
- `lib/features/history/presentation/transaction_detail_screen.dart`
- `lib/features/history/presentation/history_provider.dart`

**Acceptance criteria:**
- [ ] Danh sách transactions sorted by created_at DESC
- [ ] Filter theo ngày (hôm nay / tuần này / tháng này / custom)
- [ ] Tổng doanh thu theo ngày/kỳ filter
- [ ] Xem chi tiết transaction (items, số lượng, giá)
- [ ] In lại receipt từ transaction detail

---

## Phase 5: Inventory Management Feature

**Mục tiêu:** Quản lý tồn kho, cảnh báo hết hàng, điều chỉnh thủ công.

**Files sẽ tạo:**
- `lib/features/inventory/domain/inventory_log.dart`
- `lib/features/inventory/data/inventory_repository.dart`
- `lib/features/inventory/data/drift_inventory_repository.dart`
- `lib/features/inventory/presentation/inventory_screen.dart` — danh sách + stock levels
- `lib/features/inventory/presentation/stock_adjustment_screen.dart` — nhập/điều chỉnh kho
- `lib/features/inventory/presentation/inventory_provider.dart`

**Acceptance criteria:**
- [ ] Danh sách sản phẩm với tồn kho hiện tại
- [ ] Highlight sản phẩm dưới ngưỡng `low_stock_threshold`
- [ ] Điều chỉnh thủ công số lượng kho (+ nhập / - xuất / = set)
- [ ] InventoryLog ghi lại mọi thay đổi tồn kho với lý do
- [ ] Lịch sử nhập/xuất kho theo sản phẩm

---

## Phase 6: Polish & QA

**Mục tiêu:** UI responsive, error handling, unit tests, integration tests.

**Files sẽ tạo/sửa:**
- `lib/shared/widgets/empty_state_widget.dart` — empty state thống nhất
- `lib/shared/widgets/loading_widget.dart` — loading indicator
- `test/features/catalog/product_repository_test.dart`
- `test/features/cart/cart_notifier_test.dart`
- `test/features/checkout/checkout_flow_test.dart`
- `test/core/database/drift_db_test.dart` — dùng `NativeDatabase.memory()`

**Acceptance criteria:**
- [ ] App hoạt động tốt trên phone (portrait) và tablet (landscape split-view nếu có)
- [ ] Tất cả error states có UX feedback (SnackBar/Dialog)
- [ ] Không có crash khi offline hoàn toàn
- [ ] Unit tests cho CartNotifier pass
- [ ] Unit tests cho repository implementations pass (in-memory DB)
- [ ] `flutter analyze` không có warnings
- [ ] Build release APK + IPA thành công

---

## Thứ tự implementation (dependencies)

```
Phase 1 (Setup)
    ↓
Phase 2 (Catalog)   ← cần trước vì Cart cần Product data
    ↓
Phase 3 (Cart + Checkout)
    ↓
Phase 4 (History)   ← parallel với Phase 5 (không phụ thuộc nhau)
Phase 5 (Inventory) ←
    ↓
Phase 6 (Polish)
```

---

## Unresolved questions

1. QR payment: dùng VietQR static hay dynamic? Dynamic cần tích hợp bank API.
2. Multi-device: 1 nhà thuốc có nhiều thiết bị không? Ảnh hưởng đến sync design sau MVP.
3. Prescription (`kê toa`): có cần flag `prescription_required` trong products ngay từ đầu không?
4. Staff management: có cần `staff_id` trong transactions (nhiều dược sĩ dùng chung 1 device)?

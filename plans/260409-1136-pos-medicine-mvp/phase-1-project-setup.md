# Phase 1: Project Setup & Core Infrastructure

## Mục tiêu

Khởi tạo Flutter project với clean architecture, Drift database schema, Riverpod DI, go_router navigation, theme hệ thống.

## Requirements

- Flutter project có đầy đủ dependencies trong `pubspec.yaml`
- Drift DB khởi tạo với tất cả tables (categories, units, products, transactions, transaction_items, inventory_logs)
- Riverpod ProviderScope bọc toàn bộ app
- go_router cấu hình với named routes cho tất cả screens
- Theme (colors, typography) nhất quán theo design system nhà thuốc

## Architecture

```
lib/
├── main.dart               # entry point + ProviderScope
├── app.dart                # MaterialApp.router + go_router
├── core/
│   ├── database/
│   │   ├── app_database.dart           # Drift DB + all table defs
│   │   ├── app_database.g.dart         # generated
│   │   └── migrations/migration_strategy.dart
│   ├── constants/app_constants.dart
│   ├── utils/uuid_generator.dart
│   └── utils/currency_formatter.dart
└── shared/theme/
    ├── app_theme.dart
    ├── app_colors.dart
    └── app_text_styles.dart
```

## Implementation Steps

1. Tạo Flutter project: `flutter create pos_medicine --org com.duythuong`
2. Thêm dependencies vào `pubspec.yaml` (drift, riverpod, go_router, uuid, intl, mobile_scanner, pdf, printing)
3. Định nghĩa Drift tables trong `app_database.dart`:
   - `CategoriesTable`: id(TEXT PK), name, created_at, updated_at, is_deleted, sync_status
   - `UnitsTable`: id, name, base_unit_id(FK self nullable), conversion_factor(REAL default 1)
   - `ProductsTable`: id, name, barcode, category_id, unit_id, price, stock_quantity, low_stock_threshold, is_active, is_deleted, sync_status, created_at, updated_at
   - `TransactionsTable`: id, transaction_code, total_amount, discount_amount, payment_method, status, note, sync_status, created_at, updated_at
   - `TransactionItemsTable`: id, transaction_id, product_id, product_name(snapshot), unit_price(snapshot), quantity, subtotal, created_at
   - `InventoryLogsTable`: id, product_id, change_quantity, reason, reference_id, sync_status, created_at
4. Chạy `flutter pub run build_runner build --delete-conflicting-outputs`
5. Setup `MigrationStrategy` (schemaVersion: 1)
6. Cấu hình go_router với routes: `/`, `/catalog`, `/catalog/add`, `/cart`, `/checkout`, `/receipt/:id`, `/history`, `/history/:id`, `/inventory`
7. Tạo `AppTheme` — màu xanh y tế, font Roboto, spacing system

## Acceptance Criteria

- [ ] `flutter pub get` thành công, zero conflicts
- [ ] `flutter pub run build_runner build` generate code thành công (không có lỗi)
- [ ] App khởi động trên iOS + Android simulator không crash
- [ ] Drift DB tạo tất cả 6 tables khi lần đầu chạy (kiểm tra via sqlite browser hoặc log)
- [ ] go_router navigate được giữa ít nhất 2 routes
- [ ] Theme áp dụng đúng — không còn default Flutter blue
- [ ] `flutter analyze` — zero errors

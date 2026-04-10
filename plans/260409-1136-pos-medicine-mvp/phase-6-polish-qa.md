# Phase 6: Polish & QA

## Mục tiêu

UI responsive, error handling nhất quán, unit tests, integration tests, build release.

## Requirements

- Shared widgets: empty state, loading indicator
- Error handling với UX feedback (SnackBar/Dialog) trên tất cả screens
- Unit tests cho CartNotifier và repository implementations
- Integration test cho checkout flow end-to-end
- `flutter analyze` zero warnings
- Build release APK + IPA thành công

## Architecture

```
lib/shared/widgets/
├── empty_state_widget.dart     # empty state thống nhất
├── loading_widget.dart         # loading indicator
└── app_button.dart             # (review/polish nếu cần)

test/
├── features/
│   ├── catalog/
│   │   └── product_repository_test.dart
│   ├── cart/
│   │   └── cart_notifier_test.dart
│   └── checkout/
│       └── checkout_flow_test.dart
└── core/
    └── database/
        └── drift_db_test.dart
```

## Implementation Steps

1. Tạo `EmptyStateWidget`: icon, title, subtitle, optional CTA button
2. Tạo `LoadingWidget`: centered CircularProgressIndicator với theme color
3. Audit tất cả screens — thêm error handling:
   - AsyncValue.error → show SnackBar hoặc inline error message
   - Form validation errors → inline field errors
   - Network/DB errors → Dialog với retry option
4. Viết `drift_db_test.dart`:
   - Dùng `NativeDatabase.memory()` để test isolation
   - Test: table creation, insert/query/update/delete cho từng table
5. Viết `product_repository_test.dart`:
   - CRUD operations với in-memory DB
   - Test search filter, soft delete, barcode lookup
6. Viết `cart_notifier_test.dart`:
   - addItem, updateQuantity, removeItem
   - applyDiscount (fixed + percent)
   - clearCart
   - Tính tổng tiền đúng
7. Viết `checkout_flow_test.dart`:
   - Full flow: add to cart → checkout → verify transaction saved + stock deducted + inventory log created
8. Chạy `flutter analyze` và fix toàn bộ warnings
9. Test build: `flutter build apk --release` + `flutter build ios --release`

## Acceptance Criteria

- [ ] `EmptyStateWidget` và `LoadingWidget` dùng nhất quán trên tất cả screens
- [ ] Tất cả error states có UX feedback rõ ràng (không silent fail)
- [ ] App không crash khi offline hoàn toàn
- [ ] `drift_db_test.dart` — tất cả tests pass
- [ ] `product_repository_test.dart` — tất cả tests pass
- [ ] `cart_notifier_test.dart` — tất cả tests pass
- [ ] `checkout_flow_test.dart` — end-to-end flow pass
- [ ] Coverage business logic + repository ≥ 80%
- [ ] `flutter analyze` — zero errors, zero warnings
- [ ] `flutter build apk --release` thành công
- [ ] `flutter build ios --release` thành công

# Phase 4: Transaction History Feature

## Mục tiêu

Xem lịch sử giao dịch, filter theo thời gian, xem chi tiết, in lại hóa đơn.

## Requirements

- Danh sách transactions sorted by created_at DESC
- Filter theo ngày: hôm nay / tuần này / tháng này / custom range
- Tổng doanh thu theo kỳ filter
- Xem chi tiết transaction (items, số lượng, giá)
- In lại receipt từ transaction detail

## Architecture

```
lib/features/history/
└── presentation/
    ├── history_provider.dart              # Riverpod providers
    ├── history_screen.dart                # danh sách + filter + tổng doanh thu
    └── transaction_detail_screen.dart     # chi tiết + reprint
```

## Implementation Steps

1. Tạo `HistoryProvider`:
   - `transactionsProvider(dateFilter)` (StreamProvider) — watch transactions với date range
   - `totalRevenueProvider(dateFilter)` — sum total_amount theo filter
   - `DateFilter` enum/class: today, thisWeek, thisMonth, custom(start, end)
2. Tạo `HistoryScreen`:
   - Filter chips: Hôm nay / Tuần này / Tháng này / Tùy chọn
   - Date range picker cho custom filter
   - Tổng doanh thu header
   - ListView transactions (transaction_code, total, created_at, payment_method)
3. Tạo `TransactionDetailScreen`:
   - Thông tin transaction: mã, ngày giờ, phương thức TT, discount, tổng
   - Danh sách items: tên, SL, đơn giá, thành tiền
   - Nút "In lại hóa đơn" → reuse receipt PDF logic từ Phase 3

## Acceptance Criteria

- [ ] Danh sách transactions hiển thị đúng, sorted by created_at DESC
- [ ] Filter hôm nay / tuần này / tháng này hoạt động chính xác
- [ ] Custom date range picker hoạt động
- [ ] Tổng doanh thu tính đúng theo filter đang chọn
- [ ] Xem chi tiết transaction với đầy đủ items, giá, tổng
- [ ] In lại receipt từ transaction detail hoạt động
- [ ] `flutter analyze` không có lỗi mới

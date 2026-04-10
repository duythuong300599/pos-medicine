---
id: 260409-web-migration
title: POS Medicine — Web App Migration (React + Tailwind + shadcn/ui)
status: ready-to-cook
created_at: 2026-04-09
---

# POS Medicine Web Migration

Chuyển đổi toàn bộ dự án từ Flutter mobile sang **React + TypeScript + Vite + Tailwind CSS v4 + shadcn/ui** web app. Giữ nguyên style teal (#26A881), tái tạo đầy đủ 8 màn hình. Offline-first với Dexie.js (IndexedDB). Output: `web/` directory trong root project.

---

## Tech Stack

| Layer | Công nghệ |
|-------|-----------|
| Framework | React 19 + TypeScript + Vite |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Database | Dexie.js (IndexedDB) — offline-first |
| State (cart) | Zustand v5 (persist to localStorage) |
| Router | React Router v6 |
| Icons | Lucide React |
| Số + tiền | Intl.NumberFormat (built-in) |

## Layout Architecture

```
RootLayout (sidebar + inset)
├── AppSidebar (left, collapsible icons)
│   ├── /           → SalesPage (Bán hàng)
│   ├── /history    → HistoryPage (Lịch sử)
│   └── /inventory  → InventoryPage (Kho)
└── SidebarInset (main content)

SalesPage — split view:
├── ResizablePanel 60% → ProductCatalogPanel
│   ├── SearchInput + CategoryChips (ToggleGroup)
│   └── ProductGrid (2–4 cols grid)
└── ResizablePanel 40% → CartPanel
    ├── CartItemList (ScrollArea)
    ├── DiscountRow
    ├── SummaryTotals
    └── Button "Checkout" → CheckoutDialog
```

---

## Phases

### Phase 1 — Project Setup & Foundation
**Thư mục:** `web/`

- [ ] Khởi tạo Vite React TS project trong `web/`
- [ ] Cài đặt Tailwind CSS v4 (`@tailwindcss/vite`)
- [ ] Init shadcn/ui với custom theme teal (#26A881 = oklch(0.62 0.14 165))
- [ ] Cài đặt dependencies: `dexie`, `dexie-react-hooks`, `react-router-dom`, `zustand`, `lucide-react`
- [ ] Cấu hình path aliases (`@/` → `src/`)
- [ ] Setup Dexie.js database schema (6 tables + seed data)
- [ ] Tạo Zustand cart store
- [ ] Tạo React Router layout + routes
- [ ] Tạo AppSidebar component

**File structure:**
```
web/src/
├── lib/
│   └── db.ts              # Dexie schema + seed
├── stores/
│   └── cart-store.ts      # Zustand cart
├── layouts/
│   └── app-layout.tsx     # Sidebar + inset
├── components/
│   └── app-sidebar.tsx    # Nav sidebar
└── main.tsx
```

---

### Phase 2 — Sales Page (Catalog + Cart)
**Màn hình:** `/` (SalesPage)

- [ ] `ProductCatalogPanel` — search input + category filter chips
- [ ] `ProductGrid` — 2-4 col responsive grid với `useLiveQuery`
- [ ] `ProductCard` — name, price, stock badge, nút thêm giỏ hàng
  - Low stock highlight (orange border/bg)
  - Context menu (right-click/long-press): sửa, xóa
- [ ] `CartPanel` (persistent right panel, 40% width)
  - `CartItemRow` — qty stepper (−/+/Input), xóa
  - Discount row (₫ hoặc %)
  - Summary (tạm tính, giảm giá, tổng)
  - Button "Thanh toán"
- [ ] `CheckoutDialog` — modal thanh toán
  - Payment method: cash / QR
  - Tiền khách nhập (cash), tiền thừa tự tính
  - Confirm → lưu transaction → toast success → clear cart
- [ ] `ReceiptDialog` — hiển thị hóa đơn sau thanh toán
  - Nút in (window.print)
- [ ] `ProductFormDialog` — thêm/sửa thuốc (từ catalog)

---

### Phase 3 — History Page
**Màn hình:** `/history`

- [ ] `HistoryPage` — layout với filter bar + data table
- [ ] Date filter chips: Hôm nay, Tuần này, Tháng này + date range picker
- [ ] Revenue summary header (tổng doanh thu, số giao dịch)
- [ ] `TransactionTable` — DataTable với columns: Mã GD, Thời gian, SP, Tổng tiền, Thanh toán
- [ ] `TransactionDetailDialog` — modal chi tiết giao dịch với danh sách items

---

### Phase 4 — Inventory Page
**Màn hình:** `/inventory`

- [ ] `InventoryPage` — tabs: Tất cả / Thiếu hàng
- [ ] `InventoryTable` — DataTable: Tên, Đơn vị, Tồn kho, Giá bán, Cảnh báo
  - Badge màu đỏ cho sp thiếu hàng
- [ ] `StockAdjustmentDialog` — modal điều chỉnh tồn kho
  - Số lượng điều chỉnh (+ nhập hàng / - xuất)
  - Lý do điều chỉnh
- [ ] `ProductFormDialog` (reuse từ Phase 2) — thêm sp mới từ inventory

---

### Phase 5 — Polish & Seed Data
- [ ] Seed data mặc định (units: viên/hộp/vỉ/chai/gói, category: Chung)
- [ ] Responsive: mobile sheet cart (< 768px), tablet sidebar collapse
- [ ] Toast notifications (Sonner) cho tất cả actions
- [ ] Empty states cho catalog, history, inventory
- [ ] Loading skeletons
- [ ] Error boundaries
- [ ] README cho `web/` directory

---

## Data Model (Dexie.js)

Mapping trực tiếp từ Flutter Drift schema:

```typescript
// src/lib/db.ts
interface Category {
  id: string;           // uuid
  name: string;
  description?: string;
  createdAt: number;    // timestamp
  updatedAt: number;
}

interface Unit {
  id: string;
  name: string;
  abbreviation: string;
  baseUnitId?: string;
  conversionFactor: number;
  createdAt: number;
}

interface Product {
  id: string;
  name: string;
  barcode?: string;
  categoryId?: string;
  unitId: string;
  sellingPrice: number;
  costPrice: number;
  stockQuantity: number;
  lowStockThreshold: number;
  description?: string;
  isDeleted: boolean;
  createdAt: number;
  updatedAt: number;
}

interface Transaction {
  id: string;
  transactionCode: string;
  subtotal: number;
  discountAmount: number;
  totalAmount: number;
  paymentMethod: 'cash' | 'qr';
  notes?: string;
  createdAt: number;
}

interface TransactionItem {
  id: string;
  transactionId: string;
  productId: string;
  productName: string;  // snapshot
  unitPrice: number;
  quantity: number;
  subtotal: number;
  unitId: string;
  unitName: string;     // snapshot
}

interface InventoryLog {
  id: string;
  productId: string;
  changeQuantity: number;   // +/- 
  quantityBefore: number;
  quantityAfter: number;
  reason: 'sale' | 'adjust_in' | 'adjust_out' | 'set_stock';
  referenceId?: string;
  createdAt: number;
}
```

**Dexie stores:**
```
categories:       "id, name"
units:            "id, name"
products:         "id, barcode, categoryId, unitId, isDeleted"
transactions:     "id, transactionCode, createdAt, paymentMethod"
transactionItems: "id, transactionId, productId"
inventoryLogs:    "id, productId, createdAt, reason"
```

---

## Style Token Map (Flutter → Tailwind/shadcn)

| Flutter AppColors | CSS Variable / Tailwind |
|-------------------|------------------------|
| primary #26A881 | `--primary: oklch(0.62 0.14 165)` |
| background #F0F2F0 | `--background: oklch(0.96 0.005 120)` |
| surface #FFFFFF | `--card: oklch(1 0 0)` |
| textPrimary #212121 | `--foreground: oklch(0.145 0 0)` |
| textSecondary #757575 | `--muted-foreground: oklch(0.556 0 0)` |
| divider #E0E0E0 | `--border: oklch(0.922 0 0)` |
| error #D32F2F | `--destructive` (default) |
| warning #F57C00 | `text-orange-600` |
| lowStockHighlight #FFF3E0 | `bg-orange-50` |
| badgeColor #FF5252 | `bg-red-400` |

---

## Test Strategy

- **Unit:** Zustand cart store actions (add/remove/discount/total)
- **Integration:** Dexie.js CRUD operations với `fake-indexeddb`
- **Manual:** Toàn bộ user journey bán hàng (catalog → cart → checkout → receipt)

---

## Unresolved Questions

1. PWA / offline caching — có cần service worker cho web không? (Dexie tự offline nhưng app shell cần SW để load offline)
2. Print receipt — browser window.print() hay tích hợp máy in thermal sau?
3. Multi-tab sync — IndexedDB sẽ conflict nếu mở 2 tab, cần broadcast channel?

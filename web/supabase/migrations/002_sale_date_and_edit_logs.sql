-- Migration: 002_sale_date_and_edit_logs
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)

-- 1. Thêm cột sale_date vào transactions
-- sale_date: ngày bán thực tế (do người dùng chọn), mặc định = created_at
alter table transactions
  add column if not exists sale_date timestamptz;

-- Backfill sale_date = created_at cho các bản ghi cũ
update transactions
  set sale_date = created_at
  where sale_date is null;

-- Đặt default cho bản ghi mới
alter table transactions
  alter column sale_date set default now();

-- Index để filter/sort theo sale_date
create index if not exists idx_transactions_sale_date on transactions(sale_date);

-- 2. Bảng lưu lịch sử chỉnh sửa hoá đơn
create table if not exists transaction_edit_logs (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid references transactions(id) not null,
  -- Trường nào bị thay đổi
  field_name text not null,
  -- Giá trị cũ và mới dạng text để linh hoạt
  old_value text,
  new_value text,
  -- Ghi chú lý do chỉnh sửa (tuỳ chọn)
  edit_reason text,
  created_at timestamptz default now()
);

create index if not exists idx_transaction_edit_logs_transaction_id on transaction_edit_logs(transaction_id);
create index if not exists idx_transaction_edit_logs_created_at on transaction_edit_logs(created_at);

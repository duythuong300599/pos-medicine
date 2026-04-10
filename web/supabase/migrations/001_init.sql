-- Migration: 001_init
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)

create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists units (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  abbreviation text not null,
  base_unit_id uuid references units(id),
  conversion_factor numeric default 1,
  created_at timestamptz default now()
);

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  barcode text,
  category_id uuid references categories(id),
  unit_id uuid references units(id) not null,
  selling_price numeric not null,
  cost_price numeric not null,
  stock_quantity integer default 0,
  low_stock_threshold integer default 10,
  description text,
  is_deleted boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists transactions (
  id uuid primary key default gen_random_uuid(),
  transaction_code text unique not null,
  subtotal numeric not null,
  discount_amount numeric default 0,
  total_amount numeric not null,
  payment_method text check (payment_method in ('cash','qr')) not null,
  notes text,
  created_at timestamptz default now()
);

create table if not exists transaction_items (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid references transactions(id) not null,
  product_id uuid references products(id) not null,
  product_name text not null,
  unit_price numeric not null,
  quantity integer not null,
  subtotal numeric not null,
  unit_id uuid,
  unit_name text not null
);

create table if not exists inventory_logs (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references products(id) not null,
  change_quantity integer not null,
  quantity_before integer not null,
  quantity_after integer not null,
  reason text check (reason in ('sale','adjust_in','adjust_out','set_stock')) not null,
  reference_id uuid,
  created_at timestamptz default now()
);

-- Indexes for common queries
create index if not exists idx_products_is_deleted on products(is_deleted);
create index if not exists idx_products_category_id on products(category_id);
create index if not exists idx_transactions_created_at on transactions(created_at);
create index if not exists idx_transaction_items_transaction_id on transaction_items(transaction_id);
create index if not exists idx_inventory_logs_product_id on inventory_logs(product_id);

-- Row Level Security (RLS) — tắt cho local dev, bật lại khi deploy thật
-- alter table categories enable row level security;
-- alter table units enable row level security;
-- alter table products enable row level security;
-- alter table transactions enable row level security;
-- alter table transaction_items enable row level security;
-- alter table inventory_logs enable row level security;

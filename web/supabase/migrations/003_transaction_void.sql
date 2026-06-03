-- Migration: 003_transaction_void
-- Run in Supabase SQL Editor

-- 1. Thêm cột status vào transactions
ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS status text
  CHECK (status IN ('active','voided')) DEFAULT 'active';

ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS voided_at timestamptz;

ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS voided_reason text;

-- 2. Backfill bản ghi cũ
UPDATE transactions SET status = 'active' WHERE status IS NULL;

-- 3. Thêm void_return vào inventory_logs.reason enum
ALTER TABLE inventory_logs DROP CONSTRAINT IF EXISTS inventory_logs_reason_check;
ALTER TABLE inventory_logs ADD CONSTRAINT inventory_logs_reason_check
  CHECK (reason IN ('sale','adjust_in','adjust_out','set_stock','void_return'));

-- 4. Index cho filter status
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);

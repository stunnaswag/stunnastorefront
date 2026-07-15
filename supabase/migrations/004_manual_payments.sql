-- ============================================================
-- 004_manual_payments.sql
-- Run this script in the Supabase SQL Editor.
-- ============================================================

-- 1. Modify the existing orders table to accept 'manual_pending' status
-- Drop the existing auto-named CHECK constraint
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_payment_status_check;

-- Add the new constraint including 'manual_pending'
ALTER TABLE orders ADD CONSTRAINT orders_payment_status_check 
  CHECK (payment_status IN ('pending', 'manual_pending', 'success', 'failed', 'refunded'));

COMMENT ON COLUMN orders.payment_status IS 'Tracks payment lifecycle. Includes manual_pending for manual bank transfers.';

-- 2. Create the manual_payments table
CREATE TABLE IF NOT EXISTS manual_payments (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id            UUID        NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  customer_email      TEXT        NOT NULL,
  amount              NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
  reference_id        TEXT        UNIQUE NOT NULL,
  status              TEXT        NOT NULL DEFAULT 'Pending' 
                      CHECK (status IN ('Pending', 'Verified', 'Rejected')),
  verification_notes  TEXT,
  receipt_url         TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE manual_payments IS 'Stores manual bank transfer submissions for verification.';
COMMENT ON COLUMN manual_payments.reference_id IS 'Unique transaction ID provided by the customer to prevent duplicates.';

-- 3. Indexes for fast lookup
CREATE INDEX IF NOT EXISTS idx_manual_payments_status ON manual_payments(status);
CREATE INDEX IF NOT EXISTS idx_manual_payments_order_id ON manual_payments(order_id);

-- 4. Auto-update timestamp trigger
CREATE TRIGGER trg_manual_payments_updated_at
  BEFORE UPDATE ON manual_payments
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 5. Row Level Security (RLS)
ALTER TABLE manual_payments ENABLE ROW LEVEL SECURITY;

-- Service role only — ensures no client-side access is possible.
CREATE POLICY "Service role only — manual_payments"
  ON manual_payments FOR ALL
  USING (false)
  WITH CHECK (false);

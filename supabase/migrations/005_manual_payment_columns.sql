-- ============================================================
-- 005_manual_payment_columns.sql
-- Add the missing order/manual-payment proof URL columns needed
-- by the manual checkout flow.
-- ============================================================

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS payment_proof_url TEXT;

ALTER TABLE manual_payments
  ADD COLUMN IF NOT EXISTS payment_proof_url TEXT;

COMMENT ON COLUMN orders.payment_proof_url IS 'Public URL of the uploaded payment proof image for manual bank transfer verification.';
COMMENT ON COLUMN manual_payments.payment_proof_url IS 'Public URL of the uploaded payment proof image for manual bank transfer verification.';

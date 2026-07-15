-- ============================================================
-- 002_admin_updates.sql
-- Run this script in the Supabase SQL Editor.
-- ============================================================

-- Add Fulfillment tracking to orders
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS fulfillment_status VARCHAR DEFAULT 'pending' CHECK (fulfillment_status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
  ADD COLUMN IF NOT EXISTS tracking_number VARCHAR,
  ADD COLUMN IF NOT EXISTS fulfilled_at TIMESTAMPTZ;

-- Add Media management to products
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS thumbnail_url VARCHAR,
  ADD COLUMN IF NOT EXISTS image_urls TEXT[];

COMMENT ON COLUMN orders.fulfillment_status IS 'Tracks physical shipping status of the order.';
COMMENT ON COLUMN products.thumbnail_url IS 'Primary product card image.';
COMMENT ON COLUMN products.image_urls IS 'Array of product gallery images.';

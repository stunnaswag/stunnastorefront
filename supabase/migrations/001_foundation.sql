-- ============================================================
-- STUNNA E-COMMERCE — FOUNDATIONAL MIGRATION
-- Run this script in the Supabase SQL Editor (one shot).
-- ============================================================

-- 0. EXTENSIONS
-- gen_random_uuid() lives in pgcrypto; Supabase enables it by
-- default, but this is a safe no-op if it already exists.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================
-- 1. TABLES
-- ============================================================

-- 1a. products — core catalogue entries
CREATE TABLE IF NOT EXISTS products (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT        NOT NULL,
  slug        TEXT        NOT NULL UNIQUE,          -- URL-friendly handle
  description TEXT,
  base_price  NUMERIC(10,2) NOT NULL CHECK (base_price >= 0),
  collection  TEXT,                                 -- e.g. "Summer 25", "Essentials"
  is_active   BOOLEAN     NOT NULL DEFAULT true,    -- soft-delete / hide from store
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE  products IS 'Core product catalogue for the Stunna storefront.';
COMMENT ON COLUMN products.base_price IS 'Stored in the store''s base currency (NGN). Two-decimal precision.';
COMMENT ON COLUMN products.slug IS 'Unique, URL-safe identifier generated from the product name.';

-- 1b. variants — physical SKUs (size × colour)
CREATE TABLE IF NOT EXISTS variants (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  UUID        NOT NULL
              REFERENCES products(id) ON DELETE CASCADE,
  sku         TEXT        UNIQUE,                   -- optional warehouse SKU
  size        TEXT        NOT NULL,                  -- e.g. "S", "M", "L", "XL"
  color       TEXT        NOT NULL,                  -- e.g. "Black", "White"
  stock       INTEGER     NOT NULL DEFAULT 0 CHECK (stock >= 0),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- prevent duplicate size+colour combos per product
  UNIQUE (product_id, size, color)
);

COMMENT ON TABLE  variants IS 'Purchasable SKUs. Stock is decremented atomically at checkout.';
COMMENT ON COLUMN variants.stock IS 'Current inventory count. CHECK constraint prevents negative stock (no overselling).';

-- 1c. orders — one row per customer transaction
CREATE TABLE IF NOT EXISTS orders (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_email      TEXT        NOT NULL,
  customer_name       TEXT        NOT NULL,
  customer_phone      TEXT,                          -- optional, useful for shipping
  shipping_address    JSONB,                         -- flexible address blob
  total_amount        NUMERIC(12,2) NOT NULL CHECK (total_amount >= 0),
  currency            TEXT        NOT NULL DEFAULT 'NGN',
  payment_status      TEXT        NOT NULL DEFAULT 'pending'
                      CHECK (payment_status IN (
                        'pending', 'success', 'failed', 'refunded'
                      )),
  paystack_reference  TEXT        UNIQUE,            -- idempotency key from Paystack
  notes               TEXT,                          -- internal staff notes
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE  orders IS 'Immutable transaction record. Never delete — use payment_status to track lifecycle.';
COMMENT ON COLUMN orders.paystack_reference IS 'Unique Paystack transaction reference for verification & idempotency.';

-- 1d. order_items — line items within an order
--     Uses ON DELETE CASCADE on order_id so cancelling an order
--     removes its line items.
--     Uses ON DELETE SET NULL on variant_id so historical purchase
--     records survive product/variant deletion.
CREATE TABLE IF NOT EXISTS order_items (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id          UUID        NOT NULL
                    REFERENCES orders(id) ON DELETE CASCADE,
  variant_id        UUID
                    REFERENCES variants(id) ON DELETE SET NULL,
  product_name      TEXT        NOT NULL,            -- denormalised snapshot
  variant_label     TEXT        NOT NULL,            -- e.g. "Black / L"
  quantity          INTEGER     NOT NULL CHECK (quantity > 0),
  price_at_purchase NUMERIC(10,2) NOT NULL CHECK (price_at_purchase >= 0),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE  order_items IS 'Snapshot of what was purchased. Prices are frozen at checkout time.';
COMMENT ON COLUMN order_items.product_name IS 'Denormalised product name so the receipt survives product edits/deletes.';

-- ============================================================
-- 2. INDEXES  (beyond the auto-created PK & UNIQUE indexes)
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_variants_product_id   ON variants(product_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id   ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_variant_id ON order_items(variant_id);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status  ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_customer_email  ON orders(customer_email);
CREATE INDEX IF NOT EXISTS idx_products_collection    ON products(collection);
CREATE INDEX IF NOT EXISTS idx_products_is_active     ON products(is_active);

-- ============================================================
-- 3. HELPER FUNCTION — auto-update `updated_at`
-- ============================================================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_variants_updated_at
  BEFORE UPDATE ON variants
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- 4. STOCK DECREMENT FUNCTION  (atomic, oversell-proof)
-- ============================================================
-- Call from your Express backend:
--   SELECT decrement_stock(variant_uuid, qty);
-- Raises an exception if insufficient stock.

CREATE OR REPLACE FUNCTION decrement_stock(
  p_variant_id UUID,
  p_quantity   INTEGER
)
RETURNS INTEGER AS $$
DECLARE
  new_stock INTEGER;
BEGIN
  UPDATE variants
     SET stock = stock - p_quantity
   WHERE id = p_variant_id
     AND stock >= p_quantity          -- atomic guard
  RETURNING stock INTO new_stock;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Insufficient stock for variant %', p_variant_id;
  END IF;

  RETURN new_stock;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION decrement_stock IS 'Atomically decrements variant stock. Raises an exception on oversell.';

-- ============================================================
-- 5. ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Enable RLS on every table
ALTER TABLE products    ENABLE ROW LEVEL SECURITY;
ALTER TABLE variants    ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders      ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- ----- products & variants: public read, admin write ----------

-- Anyone (including anon) can SELECT active products
CREATE POLICY "Public can read active products"
  ON products FOR SELECT
  USING (is_active = true);

-- Authenticated users with the 'admin' role can do anything
CREATE POLICY "Admins have full access to products"
  ON products FOR ALL
  USING (
    auth.role() = 'authenticated'
    AND (auth.jwt() ->> 'user_role') = 'admin'
  )
  WITH CHECK (
    auth.role() = 'authenticated'
    AND (auth.jwt() ->> 'user_role') = 'admin'
  );

-- Public read for variants (joined through their product)
CREATE POLICY "Public can read variants"
  ON variants FOR SELECT
  USING (true);

CREATE POLICY "Admins have full access to variants"
  ON variants FOR ALL
  USING (
    auth.role() = 'authenticated'
    AND (auth.jwt() ->> 'user_role') = 'admin'
  )
  WITH CHECK (
    auth.role() = 'authenticated'
    AND (auth.jwt() ->> 'user_role') = 'admin'
  );

-- ----- orders & order_items: service-role only -----------------
-- Your Express backend calls Supabase with the service_role key,
-- which bypasses RLS entirely. These policies ensure that NO
-- client-side access is possible.

CREATE POLICY "Service role only — orders"
  ON orders FOR ALL
  USING (false)    -- blocks every non-service-role caller
  WITH CHECK (false);

CREATE POLICY "Service role only — order_items"
  ON order_items FOR ALL
  USING (false)
  WITH CHECK (false);

-- ============================================================
-- 6. SEED DATA  (2 products, 4 variants)
-- ============================================================

INSERT INTO products (id, name, slug, description, base_price, collection)
VALUES
  (
    'a1b2c3d4-0001-4000-8000-000000000001',
    'Stunna Classic Tee',
    'stunna-classic-tee',
    'Premium heavyweight cotton tee with embroidered Stunna logo on the chest. Oversized fit.',
    15000.00,
    'Essentials'
  ),
  (
    'a1b2c3d4-0002-4000-8000-000000000002',
    'Stunna Cargo Joggers',
    'stunna-cargo-joggers',
    'Relaxed-fit cargo joggers in ripstop nylon. Adjustable drawstring waist, six-pocket design.',
    28000.00,
    'Summer 26'
  );

INSERT INTO variants (id, product_id, sku, size, color, stock)
VALUES
  -- Classic Tee variants
  (
    'b1b2c3d4-0001-4000-8000-000000000001',
    'a1b2c3d4-0001-4000-8000-000000000001',
    'SCT-BLK-M',
    'M',
    'Black',
    25
  ),
  (
    'b1b2c3d4-0002-4000-8000-000000000002',
    'a1b2c3d4-0001-4000-8000-000000000001',
    'SCT-WHT-L',
    'L',
    'White',
    18
  ),
  -- Cargo Joggers variants
  (
    'b1b2c3d4-0003-4000-8000-000000000003',
    'a1b2c3d4-0002-4000-8000-000000000002',
    'SCJ-OLV-M',
    'M',
    'Olive',
    12
  ),
  (
    'b1b2c3d4-0004-4000-8000-000000000004',
    'a1b2c3d4-0002-4000-8000-000000000002',
    'SCJ-BLK-XL',
    'XL',
    'Black',
    8
  );

-- ============================================================
-- DONE. You can verify with:
--   SELECT * FROM products;
--   SELECT * FROM variants;
-- ============================================================

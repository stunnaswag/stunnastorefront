-- Web analytics events captured from the public storefront.
-- Events are intentionally anonymous: no email, account, or sensitive customer data is stored.
CREATE TABLE IF NOT EXISTS analytics_events (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type   TEXT NOT NULL CHECK (event_type IN ('page_view', 'click')),
  path         TEXT NOT NULL,
  target       TEXT,
  product_id   UUID REFERENCES products(id) ON DELETE SET NULL,
  product_slug TEXT,
  session_id   TEXT,
  metadata     JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON analytics_events(created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_events_type_created_at ON analytics_events(event_type, created_at);

ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role only — analytics events"
  ON analytics_events FOR ALL
  USING (false)
  WITH CHECK (false);

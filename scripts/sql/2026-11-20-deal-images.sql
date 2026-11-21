-- Resort image gallery: hero + gallery + FLASH SALE gif per deal (workstream #2, 2026-11-20).
-- Idempotent additive migration (prod is hand-SQL, not drizzle-kit migrate — keep schema.ts
-- in sync). Populated by the image pipeline; the listing page renders only status='published'.
-- Additive only — never deletes a deal or its price history.

CREATE TABLE IF NOT EXISTS deal_images (
  id          SERIAL PRIMARY KEY,
  deal_id     INTEGER NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  url         TEXT NOT NULL,
  alt         VARCHAR(500),
  kind        VARCHAR(20) NOT NULL DEFAULT 'gallery',   -- hero | gallery | flash_gif
  sort_order  INTEGER NOT NULL DEFAULT 0,
  width       INTEGER,
  height      INTEGER,
  bytes       INTEGER,
  source_url  TEXT,
  status      VARCHAR(20) NOT NULL DEFAULT 'candidate', -- candidate|cleaned|signed_off|published
  created_at  TIMESTAMP NOT NULL DEFAULT now()
);

-- Listing render path: published images for a deal, in order.
CREATE INDEX IF NOT EXISTS idx_deal_images_deal   ON deal_images (deal_id, status, sort_order);
CREATE INDEX IF NOT EXISTS idx_deal_images_status ON deal_images (status);

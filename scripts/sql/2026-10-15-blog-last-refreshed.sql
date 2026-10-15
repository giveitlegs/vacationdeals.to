-- vacpac-content-refresh: track when each blog post was last freshened (2026-10-15).
-- Idempotent additive migration (prod is hand-SQL, not drizzle-kit migrate — keep
-- schema.ts in sync). NULL = never refreshed, so oldest-by-created_at float to the top.
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS last_refreshed_at timestamp;

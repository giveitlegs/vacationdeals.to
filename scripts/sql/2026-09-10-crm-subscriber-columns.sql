-- Phase 0 CRM columns on subscribers (idempotent, additive-only, production-safe).
-- Applied directly (not via drizzle-kit) because the deploy flow doesn't run
-- migrations and the prod schema may have drifted; ADD COLUMN IF NOT EXISTS is safe.
ALTER TABLE subscribers ADD COLUMN IF NOT EXISTS sms_consent boolean NOT NULL DEFAULT false;
ALTER TABLE subscribers ADD COLUMN IF NOT EXISTS sms_consent_at timestamp;
ALTER TABLE subscribers ADD COLUMN IF NOT EXISTS lifecycle varchar(50) NOT NULL DEFAULT 'new';
ALTER TABLE subscribers ADD COLUMN IF NOT EXISTS notes text;

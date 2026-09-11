-- Phase 2 security columns on admin_users (idempotent, additive-only, production-safe).
-- MFA is opt-in: mfa_enabled stays false until the admin enrolls, so login is unchanged.
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS mfa_secret text;
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS mfa_enabled boolean NOT NULL DEFAULT false;
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS failed_attempts integer NOT NULL DEFAULT 0;
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS locked_until timestamp;

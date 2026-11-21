-- Lead Backend v2: per-submission channel attribution + admin reply thread (2026-11-20).
-- Idempotent additive migration (prod is hand-SQL, not drizzle-kit migrate — keep
-- schema.ts in sync). Safe to re-run. `subscribers` stays the person/list and
-- `consent_records` stays the immutable TCPA audit; these two tables are the
-- attribution + inbox layer that powers /admin/leads.

CREATE TABLE IF NOT EXISTS lead_submissions (
  id                SERIAL PRIMARY KEY,
  subscriber_email  VARCHAR(255) NOT NULL,
  source            VARCHAR(100),
  landing_path      VARCHAR(500),
  landing_url       TEXT,
  first_referrer    TEXT,
  utm_source        VARCHAR(255),
  utm_medium        VARCHAR(255),
  utm_campaign      VARCHAR(255),
  utm_term          VARCHAR(255),
  utm_content       VARCHAR(255),
  channel           VARCHAR(50) NOT NULL DEFAULT 'direct',
  ip_address        VARCHAR(100),
  user_agent        TEXT,
  status            VARCHAR(50) NOT NULL DEFAULT 'new',
  created_at        TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS lead_responses (
  id                   SERIAL PRIMARY KEY,
  lead_submission_id   INTEGER NOT NULL REFERENCES lead_submissions(id) ON DELETE CASCADE,
  admin_user_id        INTEGER REFERENCES admin_users(id),
  to_email             VARCHAR(255) NOT NULL,
  subject              VARCHAR(500) NOT NULL,
  body                 TEXT NOT NULL,
  provider_message_id  VARCHAR(255),
  sent_at              TIMESTAMP NOT NULL DEFAULT now()
);

-- Hot-path indexes (inbox lists newest-first, filters by channel/status, looks up by person).
CREATE INDEX IF NOT EXISTS idx_lead_submissions_created   ON lead_submissions (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lead_submissions_channel   ON lead_submissions (channel);
CREATE INDEX IF NOT EXISTS idx_lead_submissions_status    ON lead_submissions (status);
CREATE INDEX IF NOT EXISTS idx_lead_submissions_email     ON lead_submissions (subscriber_email);
CREATE INDEX IF NOT EXISTS idx_lead_responses_submission  ON lead_responses (lead_submission_id);

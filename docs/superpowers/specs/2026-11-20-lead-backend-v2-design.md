# Lead Backend v2 — Channel Attribution + Reply Inbox (2026-11-20)

**Status:** built (this session). Enhancement on top of the existing CRM — `subscribers`
(person/list), `consent_records` (immutable TCPA audit) and admin auth/2FA/CSRF all unchanged.

## Goal
corporateevents.at-style lead intake: for every popup/form opt-in, capture **where it came
in** (channel + exact lander + UTM) and give the owner a secure **inbox to reply** from.

## Data model (new, idempotent `scripts/sql/2026-11-20-lead-submissions.sql` + schema.ts)
- **`lead_submissions`** — one row per opt-in *event*: `subscriber_email, source, landing_path,
  landing_url, first_referrer, utm_source/medium/campaign/term/content, channel, ip_address,
  user_agent, status (new|contacted|replied|closed), created_at`. Indexed on created_at/channel/
  status/email.
- **`lead_responses`** — admin reply thread: `lead_submission_id, admin_user_id, to_email,
  subject, body, provider_message_id, sent_at`.

## Capture (single integration point — the 12 opt-in callers are untouched)
- **`AttributionBeacon`** (client, mounted in root `layout.tsx`): on first pageview, stores
  first-touch `{referrer, utm_*}` in a non-httpOnly `vd_attr` cookie (90d, first-touch wins).
- **`/api/leads`** adds a 3rd write (after subscriber upsert + consent record): reads
  `readAttribution(request)` — `vd_attr` cookie for first-touch referrer/UTM + the POST `Referer`
  header for the lander URL + IP/UA — then `deriveChannel()` and inserts `lead_submissions`.
  Best-effort: a failure here never blocks the opt-in.

## Channel derivation (`lib/leads/channel.ts`, pure + re-derivable)
UTM wins (owner-tagged); else referrer host; else `direct`. Taxonomy: `direct ·
organic-{google|bing|yahoo|duckduckgo|…} · ai-{chatgpt|perplexity|gemini|claude|copilot} ·
social-{facebook|instagram|x|reddit|tiktok|linkedin|pinterest|youtube} · paid · email · referral`.
Raw signals are stored on every row so channels can be re-bucketed later without data loss.

## Admin inbox — `/admin/leads` (reuses `AdminShell` auth)
Stat tiles (total / unactioned / replied / last-7d) + a **30-day channel rollup** + a filterable
table (Email · Channel badge · Lander link · Source · When · Status · Reply). Each row: inline
status select + a **Reply** modal → `POST /api/admin/leads {action:"reply"}` sends via `sendEmail()`
**from `contact@vacationdeals.to`** (override `LEADS_FROM`/`LEADS_REPLY_TO`), logs a `lead_responses`
row, flips status → `replied`, records `admin_actions`.

## Security
Only new public surface = extra fields ride in on the already-public `/api/leads` via cookie +
header (nothing user-typed into a URL; all values length-capped). The reply/status route is guarded
by `getCurrentAdmin` + `isSameOrigin` CSRF + admin-action logging, same as every admin mutation.
Workstream #5 (`security-review`) will re-audit before this is considered hardened.

## Deploy
Idempotent prod SQL applied first, then guarded build (`pnpm build` → `pm2 restart`). Backup taken
pre-change (`vacdeals-20261121T015903Z.pgdump`, 296,491 price rows).

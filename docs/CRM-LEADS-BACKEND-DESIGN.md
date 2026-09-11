# Lead CRM + ESP/SMS Integration — Design & Ideation (2026-09-10)

Goal: a proper backend CRM to house popup leads, with **super-secure admin access**,
**manual CSV export**, and **Klaviyo (email) + Attentive (SMS) integration** — built on
what already exists, not greenfield.

> **Owner decisions (2026-09-10):** keep the **in-house mail engine** (Klaviyo dropped as
> sender; optionally wire Hostinger SMTP later) · **SMS later** (capture recorded but gated) ·
> **CSV download-only** · build **Phase 0 + 1 first**.
>
> **STATUS — Phases 0, 1, 2 ✅ SHIPPED (2026-09-10).**
> - **P0/P1** (`2f04bab`): `subscribers` is the lead source of truth (phone-in-`company` hack
>   removed); 54 opt-ins backfilled; `/admin/crm` with search/filter, inline lifecycle + notes,
>   unsubscribe-as-flag (consent audit preserved), filter-aware audit-logged CSV export.
> - **P2 security** (`65fd965`): opt-in TOTP **2FA** (enroll at `/admin/security`, enforced at
>   login only once enabled — so nothing locks you out), **login lockout** (8 fails → 15 min),
>   **same-origin CSRF** check on admin POSTs, session cookie **SameSite=strict**.
> - **Email transport**: `sendEmail()` now prefers **Hostinger SMTP** when `SMTP_HOST/USER/PASS`
>   are set, falling back to Resend (in-house engine kept; see setup note below).
>
> Remaining: Phase 3 (Klaviyo — deferred per owner), Phase 4 (Attentive SMS — after legal),
> Phase 5 (Turnstile/rate-limit abuse controls on the popup), and role-gating CSV export.
>
> **Hostinger SMTP setup (owner):** add to `/var/www/vacationdeals/.env` then rebuild/restart —
> `SMTP_HOST=smtp.hostinger.com`, `SMTP_PORT=465`, `SMTP_SECURE=true`,
> `SMTP_USER=<your hostinger mailbox>`, `SMTP_PASS=<mailbox password>`, and
> `EMAIL_FROM="VacationDeals.to <that-mailbox@vacationdeals.to>"`. Until then it stays on Resend.

---

## 1. Current state (audited 2026-09-10) — more exists than you might think

**Already built:**
- **Popups:** `LeadGenPopup.tsx` + `SitewideLeadGenPopup.tsx` (fire ~6s, every page except /admin).
- **Capture API:** `POST /api/leads` → writes the lead to `data_inquiries` and a TCPA row to `consent_records`, fires a notify email + a Resend welcome email, tracks double-opt-in.
- **Admin panel:** `/admin` (AdminShell) with `/admin/subscribers` + `/admin/roulette`; session-cookie auth (`admin_users` + `admin_sessions`, salted password hash, `admin_actions` audit log). 1 admin user today.
- **Email infra (scaffolded, unused):** `subscribers`, `email_campaigns`, `email_sends` tables; `/api/email/{send,confirm,unsubscribe}` with double-opt-in + `unsubscribe-token.ts`; Resend as the sender.
- **Consent audit:** `consent_records` (71 rows) — IP, UA, exact consent text, TCPA/terms flags, double-opt-in flag. This is the compliance crown jewel; keep it immutable.

**Data today:** `data_inquiries` 71 · `consent_records` 71 · `subscribers` **0 (unused)** · `email_campaigns`/`email_sends` 0.

### The problems to fix
1. **Leads land in the wrong table with a hack.** `/api/leads` writes to `data_inquiries` and **stuffs the phone number into the `company` field** (see route.ts line 48). The purpose-built `subscribers` table (email/phone/status/tags/preferences JSON/unsubscribe token) sits empty. → Leads should be first-class rows in `subscribers`.
2. **No CSV export** anywhere.
3. **No Klaviyo / Attentive** — nothing syncs leads out to an ESP/SMS platform.
4. **Admin security is decent but not "super secure"** — single-factor password, no MFA, no rate-limit/lockout, no IP allowlist, cookie flags need audit.
5. **SMS/TCPA is only half-wired** — `/api/leads` accepts a phone + TCPA flag, but per CLAUDE.md the live popups are **email-only** (SMS/TCPA gated behind a real phone opt-in pending attorney review). Any SMS path must stay behind explicit, logged phone consent.

---

## 2. Target architecture (one diagram)

```
[Popup: email + optional phone + consent checkboxes]
        │  POST /api/leads  (rate-limited, hCaptcha/turnstile)
        ▼
  ┌─────────────────────────────────────────────┐
  │ upsert subscribers  (email unique)           │  ← single source of truth
  │ append consent_records (immutable audit)     │  ← never updated, only inserted
  └───────────────┬───────────────┬─────────────┘
                  │               │  (async, queued, retry-safe)
      Resend welcome      ┌───────┴────────┐
      + owner notify      ▼                ▼
                    Klaviyo upsert    Attentive subscribe
                    (email profile)   (SMS — ONLY if phone
                                       + smsConsent=true)
        ▲
        │ super-secure admin
  ┌─────┴───────────────────────────────────────┐
  │ /admin/crm  (MFA, rate-limited, audit-logged)│
  │  • search/filter/tag leads                   │
  │  • CSV export (streamed, logged)             │
  │  • per-lead consent + sync status            │
  │  • manual "re-sync to Klaviyo/Attentive"     │
  └──────────────────────────────────────────────┘
```

Principle: **the DB (`subscribers` + `consent_records`) is the source of truth.** Klaviyo/
Attentive are downstream mirrors we can rebuild from the DB at any time — never the other
way around. That keeps you portable (swap ESPs later) and keeps the compliance record
first-party.

---

## 3. Data model changes (minimal — reuse the existing tables)

`subscribers` already has the right shape. Add a few columns for CRM + sync state:

| new column | type | purpose |
|---|---|---|
| `sms_consent` | boolean default false | explicit TCPA phone opt-in (separate from email) |
| `sms_consent_at` | timestamp | when SMS consent was given |
| `klaviyo_id` | varchar | Klaviyo profile id after first sync |
| `attentive_status` | varchar | pending / subscribed / failed / n/a |
| `lifecycle` | varchar default 'new' | new → engaged → customer → dormant (pipeline stage) |
| `last_synced_at` | timestamp | last successful ESP/SMS push |
| `notes` | text | admin free-text notes per lead |

Add a `sync_log` table (id, subscriber_id, provider, action, status, error, created_at) so
every outbound push is auditable and retryable. Keep `consent_records` **append-only**.

Migration path for the 71 existing `data_inquiries` "opt-in" rows: one-time backfill script
that maps them into `subscribers` (un-hacking the phone-in-`company` field), matched to their
`consent_records` by email. `data_inquiries` reverts to its real purpose (B2B data-report/API
inquiries).

---

## 4. Lead capture flow (hardened)

`POST /api/leads` becomes:
1. **Abuse controls:** Cloudflare Turnstile or hCaptcha token check + IP rate-limit (e.g. 5/min/IP) + honeypot field. Popups are public and get botted.
2. **Validate + normalize:** email (RFC + MX-lite), phone to E.164 (`libphonenumber`).
3. **Upsert `subscribers`** on email; set `email_opt_in` always, `sms_consent` **only if** phone present AND the SMS checkbox was ticked.
4. **Append `consent_records`** (unchanged — immutable).
5. **Enqueue** async side-effects (so the popup returns instantly and a provider outage never drops a lead): Resend welcome, owner notify, Klaviyo upsert, Attentive subscribe. A tiny DB-backed job runner (or `p-queue` + retry) is enough at this volume; `sync_log` records each attempt.

Double-opt-in stays: SMS is only actually enabled after the phone confirms (Attentive's own
double-opt-in handles this) — matches the CLAUDE.md TCPA posture.

---

## 5. Super-secure admin / CRM

Harden the existing session-cookie auth rather than replace it:

- **MFA (TOTP)** for every admin — `otpauth` + a `mfa_secret` on `admin_users`; require a 6-digit code after password. Biggest single security win.
- **Login rate-limit + lockout** (e.g. 5 fails → 15-min lockout, logged to `admin_actions`).
- **Cookie hardening:** `HttpOnly`, `Secure`, `SameSite=Strict`, short TTL + sliding refresh; rotate token on login.
- **Optional IP allowlist** (your home/office IPs) via env — belt-and-suspenders for a single-operator panel.
- **CSRF tokens** on all admin mutations (currently form-POST based).
- **Full audit trail:** every view-export / sync / edit → `admin_actions` (table already exists). Export especially must be logged (who exported how many rows, when).
- **PII-at-rest option:** phone numbers are the sensitive field; consider app-level encryption for `phone` (decrypt only in the admin view + at sync time).
- **Least-privilege roles** (already modeled: super-admin/admin/editor/moderator) — only super-admin can export or manage integrations.

New CRM view `/admin/crm`: searchable/filterable table (by source, tag, lifecycle, consent
type, date), per-lead detail (consent history + sync status + notes), bulk tag, and the export
button.

---

## 6. Manual CSV export

- `GET /api/admin/crm/export?filter=…` (super-admin only, MFA session required).
- **Streamed** CSV (handles large lists without memory blowups), columns you choose:
  email, phone, name, source, tags, lifecycle, email_opt_in, sms_consent, consent_date,
  double_opt_in, created_at, last_synced_at.
- Respects the current filter (export a segment, not just "everything").
- **Every export writes an `admin_actions` row** (actor, row count, filter, timestamp) — so a data pull is never invisible.
- Optional: exclude unsubscribed/bounced by default (toggle to include).

---

## 7. Klaviyo integration (email)

- **Server-side only** (private API key in `.env`: `KLAVIYO_API_KEY`; never client-side).
- On new/updated subscriber → **upsert a Klaviyo profile** (email, phone, name, custom props:
  source, tags, lifecycle) and **subscribe to a list** ("VacationDeals Leads") using Klaviyo's
  consent-aware subscribe endpoint (records email consent).
- Store the returned `klaviyo_id` on the subscriber.
- **Backfill job** to push the existing list once.
- **Manual re-sync** button in the CRM (re-push a lead or a whole segment).
- Klaviyo becomes your campaign/flow engine (welcome series, deal alerts); the site's own
  `email_campaigns` tables can be retired or kept as a lightweight fallback.

## 8. Attentive integration (SMS)

- **Server-side only** (`ATTENTIVE_API_KEY`).
- Fires **only** when `phone` present AND `sms_consent = true` AND consent text logged —
  never on an email-only lead. This is the TCPA line; keep it bright.
- Call Attentive's **subscribe** endpoint with the phone + consent metadata; let Attentive run
  its own SMS double-opt-in (compliant confirmation).
- Store `attentive_status`; surface it per-lead in the CRM.
- Respect unsubscribes bidirectionally (Attentive STOP → mark `sms_consent=false` via webhook).

**Compliance gate (do first):** turning on SMS collection needs the attorney review CLAUDE.md
already flags (TCPA/GPC). The build can ship the plumbing behind a feature flag and stay
email-only until you green-light SMS.

---

## 9. Phased build plan

| Phase | Scope | Effort |
|---|---|---|
| **0 — Foundation** | Migrate leads into `subscribers` (un-hack phone), backfill the 71 rows, add the new columns + `sync_log`. No behavior change yet. | ~0.5 day |
| **1 — CRM view + CSV export** | `/admin/crm` table (search/filter/tag/notes) + streamed, audit-logged CSV export. Immediate value: you can see + pull leads. | ~1 day |
| **2 — Security hardening** | MFA (TOTP), login rate-limit/lockout, cookie + CSRF hardening, export audit, optional IP allowlist. | ~1 day |
| **3 — Klaviyo sync** | Server-side upsert on capture + backfill + manual re-sync. | ~1 day |
| **4 — Attentive SMS** | Behind a feature flag + the SMS-consent gate; enable after legal sign-off. | ~0.5–1 day |
| **5 — Abuse controls** | Turnstile/hCaptcha + rate-limit + honeypot on `/api/leads`. | ~0.5 day |

Recommended order: **0 → 1 → 2 → 3 → (5) → 4**. Phases 0–1 give you a working CRM with export
this week; 2 makes it "super secure"; 3 adds Klaviyo; 4 adds SMS once legal clears it.

## 10. Cost / dependencies
- New env keys: `KLAVIYO_API_KEY`, `ATTENTIVE_API_KEY`, `TURNSTILE_SECRET` (+ site key).
- New npm deps: `libphonenumber-js`, `otpauth` (MFA), a small queue (`p-queue`) or a DB-backed
  job table. No new infra — runs on the existing KVM8 Next.js app + Postgres.
- Klaviyo/Attentive have their own subscription costs (their pricing, not ours).
- Guardrail: all provider keys server-side only; never ship a key to the client bundle.

---

### Open decisions for the owner
1. **Klaviyo vs keep the in-house `email_campaigns` engine** — recommend Klaviyo as the sender/
   flows engine, DB as source of truth. Confirm.
2. **SMS now or later?** Recommend building the plumbing behind a flag, enabling after the
   TCPA/GPC attorney review CLAUDE.md already requires.
3. **Where should exports go?** Manual download only, or also a scheduled encrypted drop?
4. **Which phase do you want built first?** (Recommended: Phase 0 + 1 together.)

# Overnight QA + Security Pass — 2026-05-05

End-to-end audit of vacationdeals.to: backup, repo security, public-site
security, full-site crawl, visual QA, form-flow tests. Critical findings
fixed and deployed; medium/low items documented for follow-up.

## TL;DR

| Audit | Status | Critical | High | Medium | Low |
|-------|--------|----------|------|--------|-----|
| DB backup | ✅ done | — | — | — | — |
| Repo security | ✅ clean | 0 | 0 | 2 (open) | 4 (info) |
| Public-site security | ✅ fixed live | 0 | 2 (1 fixed) | 4 (2 fixed via nginx) | 2 (open) |
| Site crawl (1232 URLs) | ✅ done | 0 | 0 | 5 broken sitemap entries (fixed) | 233 heavy-HTML pages (info) |
| Visual QA (25 URLs × 2 viewports) | ✅ done | 0 | 3 (open) | 4 (1 fixed) | minor cosmetic |
| Form-flow tests (49 cases, 6 endpoints) | ✅ fixed | **1 (FIXED)** | 1 (FIXED) | 2 (FIXED) | rate limiting added via nginx |

## Highest-impact fixes shipped tonight

### 1. CRITICAL — Reflected XSS in `/api/email/unsubscribe`
Endpoint echoed `?email=` directly into a `text/html` response. A crafted
`?email=<script>...</script>` link executed attacker JS in vacationdeals.to origin.

**Fix:** rewrote the route to (a) strict-regex validate the email, (b) HTML-escape
the echoed value, (c) require an HMAC-signed token (`UNSUBSCRIBE_SECRET` or
`PAYLOAD_SECRET`) before echoing — random strangers can't enumerate-unsubscribe
either. Token signing helper at `apps/web/src/lib/unsubscribe-token.ts`.
Email-sending code needs to include `&t=signEmail(email)` going forward.

### 2. HIGH — Zero security headers
HSTS / X-Frame-Options / X-Content-Type-Options / Referrer-Policy all missing.

**Fix (nginx, applied directly on VPS, backup at `/tmp/vacationdeals.nginx.bak`):**
```
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Frame-Options: SAMEORIGIN
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), microphone=(), camera=()
Server: nginx           ← was: nginx/1.24.0 (Ubuntu)
```

### 3. MEDIUM — Direct-IP access bypassed the domain
`https://72.60.126.82/` was serving the full site, exposing the origin to
direct DDoS / exploit attempts that bypass any future CDN/WAF.

**Fix:** nginx default-server (`server_name _`) returns `444` (connection-closed)
for any non-vacationdeals.to host. Verified empty response.

### 4. MEDIUM — No rate limiting on user-facing POSTs
Pitch-diaries, scout, leads, hold-up, email/* all accepted unlimited bursts.

**Fix:** `limit_req_zone` 10 req/min/IP with `burst=20 nodelay` on
`/api/{pitch-diaries|scout|leads|hold-up|email}/`. Hits before the Next.js
handler so spam never reaches the DB.

### 5. MEDIUM — `/api/leads` returned 500 for malformed bodies
`request.json()` was inside the outer try/catch.

**Fix:** parse body in its own try/catch returning 400 on JSON error. Field
extraction now uses `typeof` guards.

### 6. LOW — Sitemap listed 5 brand reality-index pages that 404
hgv, vegas-timeshare, legendary, discount-vacation, festiva have 0 active
deals → no Reality score → 404. Listing 404s in the sitemap is a Google penalty.

**Fix:** sitemap now imports `getRealityIndex()` and emits
`/reality-index/<slug>` only for brands with a score.

### 7. Mobile horizontal overflow on `/blog`
102px scroll caused by the deal-ticker animation bleeding past parent.

**Fix:** `overflow-x: clip` on `html, body` globally in
`apps/web/src/app/globals.css`.

## Open follow-ups (not fixed tonight)

### Repo security (medium)
- **M1 — query-string secrets.** `apps/web/src/app/api/{seo-health,
  data-report,ping,admin/roulette}/route.ts` accept `?key=`/`?token=` for
  auth. Move to `Authorization: Bearer …` so secrets stop landing in
  nginx logs and Referer headers.
- **M2 — `NEXT_PUBLIC_CUSTOM_HEAD_SCRIPT`.** Bundled to clients and
  injected via `dangerously-set-inner-html` in `app/layout.tsx:85-86`.
  Operator-only today, but if user input ever reaches it, site-wide XSS.

### Public-site security
- **H2 — API responses leak full DB column shape.** `/api/deals`,
  `/api/brands`, `/api/destinations` expose `id`, `brandId`, `sourceId`,
  `isActive`, `scrapedAt`, `createdAt`, `updatedAt`, `isSuppressed`.
  Lets competitors mirror our scrape feed and time refreshes.
  **Fix:** whitelist serializer per route — drop internal IDs and
  timestamps, expose only `slug` for joins.
- **L1 — `/api/this-does-not-exist` returns ~30KB HTML 404.** Add
  `app/api/[...notfound]/route.ts` returning a small JSON 404.
- **L2 — `Cache-Control: private, no-cache, no-store` on home.**
  Defeats CDN caching of ISR HTML.

### Visual QA — open (high-priority)
- **React hydration error on `/brands` (desktop only).** Console:
  Minified React error #418. Repro with non-minified React to read full
  message. Likely a `new Date()` or counter rendered SSR that diverges
  client-side.
- **Placeholder titles leaking through.** `/wyndham` cards say "Resort
  Information"; `/marriott` cards say "special offer" (lowercase).
  Could be added to `scripts/nightly-data-quality.ts` to flag/deactivate
  rows with these titles.
- **Bad city strings.** `/westgate` shows "Unknown,"; `/3-night-packages`
  shows "Various," — trailing-comma cleanup in `sanitizeCity()` in
  `apps/scraper/src/storage/deal-store.ts`.
- **`/hgv` count mismatch.** Header reads "0 deals" but body shows 1.
  Investigate `getBrandStats()` slug join.

### Visual QA — open (cosmetic)
- "PLAY NOW!" sticker shows on some pages but not others (z-index inconsistency).
- Roulette wheel bottom-half labels render mirror-image — counter-rotate
  wedges below 180°.
- `/destinations` legend renders unicode escape literally.
- Blog featured cards all use the same purple/orange gradient.

## Backups

- **DB:** `backups/vacationdeals-2026-05-06.pgdump` (3.3 MB,
  custom-format, gzip-9). Contains user PII — `backups/` is gitignored.
  Restore: `pg_restore -d vacationdeals <file>`.
- **Repo:** in sync with `origin/main`.
- **Backup script:** `scripts/backup-db.sh` for repeatable runs.
- **Nginx config backup:** on VPS at `/tmp/vacationdeals.nginx.bak`.

## File index

```
reports/qa-overnight/
├── SUMMARY.md                          ← this file
├── 02-security-repo/findings.md
├── 03-security-public/findings.md
├── 04-crawl/findings.md                (raw.json gitignored — 272MB)
├── 05-visual-qa/
│   ├── findings.md
│   └── *.png (50 screenshots)
└── 06-form-tests/
    ├── findings.md
    └── raw/*.txt (65 curl outputs)
```

## Final state

- All commits pushed to `main`, deployed to VPS, pm2 restarted.
- Site healthy: `/`, `/forfeit`, `/pitch-diaries`, `/scout`,
  `/will-it-hold-up`, `/reality-index`, `/westgate`, `/orlando` all
  return 200 with new security headers.
- XSS smoke test confirms fix.

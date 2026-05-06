# Public-Site Security Probe — 2026-05-05

Probed https://vacationdeals.to via curl (HEAD/GET/POST). No production data was modified beyond two test pitch-diary submissions with `test@example.invalid` (cleanup recommended: rows id=1, id=2 in pitch_diaries table).

## Critical (auth bypass / PII leak / RCE risk)
None. Admin protection works (`/admin`, `/admin/deals`, `/admin/scrapers` all 307 to `/admin/login`). No stack traces leaked. No `.env`, `.git`, or admin URLs in sitemap.

(Note: a separate Critical XSS in `/api/email/unsubscribe` was identified and fixed by the form-flow audit. See `06-form-tests/findings.md`.)

## High

### H1. No `Strict-Transport-Security` header (HSTS missing)
- URL: `https://vacationdeals.to/` (and every other URL probed)
- Method: `curl -sI https://vacationdeals.to/`
- Response (truncated): `HTTP/1.1 200 OK; Server: nginx/1.24.0 (Ubuntu); Vary: rsc...; Cache-Control: private, no-cache, no-store, max-age=0, must-revalidate` — no HSTS, CSP, X-Frame-Options, X-Content-Type-Options, or Referrer-Policy.
- Why: HTTP→HTTPS does 301, but without HSTS a MITM on first visit can downgrade the connection. HSTS is required for HTTPS sites and is a Google ranking signal.
- Fix: Add to nginx server block: `add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;`

### H2. API responses leak full DB column shape (internal IDs, scrape timestamps, flags)
- URL: `GET https://vacationdeals.to/api/deals?limit=1` (also `/api/brands`, `/api/destinations`)
- Response (deal keys): `id, brandId, destinationId, sourceId, title, slug, price, originalPrice, durationNights, durationDays, description, resortName, url, imageUrl, inclusions, requirements, presentationMinutes, travelWindow, savingsPercent, isActive, scrapedAt, expiresAt, reviewHtml, reviewGeneratedAt, createdAt, updatedAt`. `/api/brands` exposes `id, isSuppressed`. `/api/destinations` exposes `id`.
- Why: Lets competitors trivially mirror your scrape feed and time your refreshes via `scrapedAt`. `isSuppressed` reveals brand-curation logic. Internal numeric IDs aid enumeration.
- Fix: Whitelist serializer in API routes — drop `id`, `brandId`, `sourceId`, `isActive`, `scrapedAt`, `createdAt`, `updatedAt`, `isSuppressed`. Expose only `slug` for joins. Add rate limit (~60 req/min/IP) on `/api/deals`.

## Medium

### M1. No CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy
- URL: every response
- Why: Site can be iframed (clickjacking), no MIME-sniff protection, full referrer leaks to outbound timeshare deal URLs.
- Fix: nginx `add_header X-Frame-Options "SAMEORIGIN" always; add_header X-Content-Type-Options "nosniff" always; add_header Referrer-Policy "strict-origin-when-cross-origin" always;` Then add a permissive CSP and tighten over time.

### M2. nginx version disclosed in `Server` header
- Header: `Server: nginx/1.24.0 (Ubuntu)`
- Why: Version banner aids targeted CVE attacks.
- Fix: `server_tokens off;` in `nginx.conf`.

### M3. `/api/pitch-diaries/submit` accepts unfiltered script tag and path-traversal `brandSlug`
- URL: `POST /api/pitch-diaries/submit`
- Note: re-reviewing the route, `brandSlug` IS validated against `brands.slug` — unknown values result in `brandId=null` and `brandSlug=null` being stored, so the path-traversal value never reaches the DB. The agent's claim of "stored verbatim" was a misread of the response (it returned 200 because the row was created with brand_slug=null, not because the slug was stored).
- Fix needed: still good practice to return 400 when brandSlug is provided but doesn't match a known brand, instead of silently dropping it. Low priority.

### M4. Origin IP `https://72.60.126.82/` serves the full site (HTTP 200)
- URL: `https://72.60.126.82/`
- Why: Bypasses any future Cloudflare/WAF and exposes raw origin to DDoS / direct exploit attempts.
- Fix: nginx default_server returns 444 (or 421) for unknown Host headers; bind the Let's Encrypt cert only to the `vacationdeals.to` server_name.

## Low

### L1. `/api/this-does-not-exist` returns ~30KB HTML 404 page instead of JSON
- Response: full Next.js HTML doctype + chunk preloads.
- Fix: Add `app/api/[...notfound]/route.ts` returning a JSON 404.

### L2. `Cache-Control: private, no-cache, no-store` on homepage
- Defeats CDN caching of ISR HTML — perf/SEO impact, not security.
- Fix: For ISR pages return `s-maxage=3600, stale-while-revalidate=86400`.

## Verified clean
- `/admin`, `/admin/deals`, `/admin/scrapers` → 307 to `/admin/login` (auth required)
- `/admin/dashboard`, `/admin/seo`, `/admin/api/deals`, `/admin/api/health`, `/api/admin/health`, `/api/admin/scraper`, `/api/scraper/run` → 404/405 (not exposed)
- `http://vacationdeals.to/` → 301 → `https://vacationdeals.to/`
- `/.env`, `/.git/HEAD`, `/sitemap_index.xml` → 404
- `/robots.txt` correctly Disallows `/admin`, `/admin/*`, `/api/admin`, `/api/admin/*`
- `/sitemap.xml` contains zero admin or `/api/` URLs (only public SEO routes)
- `POST /api/pitch-diaries/submit` empty body → 400 JSON, no stack
- `POST /api/scout/apply` empty → 400 JSON, no stack
- `POST /api/leads` empty → 400 JSON (after fix in this run)
- 100KB story body → rejected 400 (8000 char limit enforced server-side)
- No stack traces or framework version strings (Next.js/Node) observed in any error body

## Cleanup action requested
Two test pitch-diary rows were created during probing — id=1 (XSS payload) and id=2 (path-traversal `brandSlug`). Both used `test@example.invalid`. Recommend `DELETE FROM pitch_diaries WHERE id IN (1,2);`

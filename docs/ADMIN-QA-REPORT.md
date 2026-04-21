# Admin QA Report — 2026-04-21T03:08:00Z

## Summary
- Pages tested: 10/10
- Passing: 4 (Dashboard, Deals, Brands, Subscribers — all load + display data correctly)
- Failing: 2 (Login flow, Logout — broken localhost redirect in production)
- Partial: 4 (Banners, Roulette, Campaigns, Scrapers — stubs, mismatches, or gated by separate auth)
- Critical bugs: 1 (P0 login-redirect-to-localhost)

All backend pages render, all middleware gating works correctly, session cookie flow works. But the form UX layer has a blocker: after successful login, the user's browser is redirected to `https://localhost:3000/admin` which fails with ERR_CONNECTION_REFUSED. The underlying auth + cookie machinery is sound — users can reach the panel by navigating directly to `/admin` in the same tab once the cookie is set, but the form never does that for them.

## Per-page findings

### 1. Login — FAIL (critical)
**What works:**
- GET `/admin/login` renders the form correctly (200 OK, "Admin Login" title).
- POST to `/api/admin/auth/login` with form-encoded credentials correctly validates and sets the `vd_admin` session cookie (30-day Secure HttpOnly SameSite=lax).
- Middleware gates `/admin/*` — unauthenticated requests return `307 → https://vacationdeals.to/admin/login` (correct, not localhost).

**What's broken (CRITICAL BUG):**
- After POST (success OR failure), the API returns `303 See Other` with `Location: https://localhost:3000/admin` (success) or `https://localhost:3000/admin/login?error=failed` (failure). In production this is unreachable (ERR_CONNECTION_REFUSED), so the browser shows a chrome error page. No logged-in user can reach the admin panel through the login form — the cookie is set, but the redirect target is the localhost dev URL.
- Repro: POST to `https://vacationdeals.to/api/admin/auth/login` with correct creds form-encoded. Response `Location` header is literally `https://localhost:3000/admin`.
- Likely source: hardcoded absolute URL in the login route handler (should be a relative path or use `request.nextUrl.origin`).
- Screenshot: `docs/qa-screenshots/01-dashboard.png` (after manually navigating to `/admin` once cookie was set).

**Secondary finding (non-critical):**
- The form on the page is `enctype="application/x-www-form-urlencoded"`. A client posting JSON to `/api/admin/auth/login` always gets `error=failed`, even with correct creds. Document or support both.

### 2. Dashboard (`/admin`) — PASS
- Sidebar has all 8 expected items: Dashboard, Deals, Brands, Ad Banners, Roulette, Subscribers, Campaigns, Scrapers. Plus user pill showing "Admin / super-admin" + Log out button.
- Stats tiles render correctly: 380 Active Deals, 118 Expired, 40 Brands, 0 Subscribers, 0 TCPA Consents, 545 Blog Posts.
- "Recent Scrape Runs" lists 10 most recent runs (wyndham×4, hyatt, festiva, departure-depot, spinnaker, westin-vc, sheraton-vc — all "success · 0 new" except one wyndham with 5 new).
- "Recent Admin Actions" correctly shows "No actions yet" (matches: no actions have been persisted).
- Zero console errors/warnings.
- Screenshot: `docs/qa-screenshots/01-dashboard.png`

### 3. Deals (`/admin/deals`) — PASS
- Page loads with paginated table of all 498 deals, columns: Title / Brand / Destination / Nights / Price / Status / Scraped / Actions.
- Filter tabs (All / Active / Expired) and Search input (`?q=`) render.
- Search tested via URL (`?q=Westin Los Cabos`) correctly filtered to 1 matching row.
- **Expire action** — tested successfully on deal id 2287 (`westin-vc-maui-5-night-949`). POST `/api/admin/deals` body `{"dealId":2287,"action":"expire"}` → 200 OK, deal status flipped to "Expired" in admin view. Reverted successfully with `action=reactivate` (other names tried — `unexpire`, `restore`, `enable`, `active` — all return `{"error":"Unknown action"}`).
- **Edit $ action** — opens a `window.prompt("Override price (current: $499):", "499")`. Did not actually change a price. Wiring appears correct.
- Minor issue: the frontend deal page `/deals/westin-vc-maui-5-night-949` still returned HTTP 200 while the deal was marked expired in the DB (during the ~30s test window). Likely ISR — the page will update on next revalidation, but admin actions don't call `revalidatePath`. Low severity.
- Screenshot: `docs/qa-screenshots/02-deals.png`

### 4. Brands (`/admin/brands`) — PARTIAL
- Page loads, lists all 40 brands sorted by active deal count (Westgate Reservations 106, MRG 47, StayPromo 46, ..., BestVacationDealz 0).
- Each row has Run Scraper + Suppress buttons.
- **Suppress action** — tested on brand id 197 "Vacation Offer" (0 deals, safe to toggle). POST `/api/admin/brands` body `{"brandId":197,"action":"toggle_suppress"}` → 200 OK.
- **But the API response is suspicious:** `{"ok":true,"message":"Suppression toggled (implement store)"}`. The `(implement store)` suffix suggests this is a stub that returns ok without actually writing to the DB. Cannot confirm on frontend because "Vacation Offer" has 0 deals → it was never on `/brands` anyway. Needs backend inspection.
- Did not test Run Scraper (would consume real resources; noted as untested).
- Screenshot: `docs/qa-screenshots/03-brands.png`

### 5. Banners (`/admin/banners`) — PARTIAL (stub)
- Page loads, h1 "Ad Banners", empty table ("No banners yet. Create the first partner ad.").
- Below the table: literal text "Ad creation form — coming in next iteration. For now, insert directly via SQL."
- No create form, no upload control, no API surface to test. Cannot create the test footer banner requested by the spec.
- Screenshot: `docs/qa-screenshots/04-banners.png`

### 6. Roulette (`/admin/roulette`) — PARTIAL (double auth)
- Page loads under a DIFFERENT layout (no sidebar — breaks the admin shell).
- Gated by a SECOND auth prompt: "Enter admin key to continue: [PAYLOAD_SECRET]" with an Authenticate button. Even though the session cookie says super-admin, this page demands a separate env-var-derived key. Inconsistent with the rest of the admin panel.
- Did not have the PAYLOAD_SECRET value so could not exercise the controls.
- Screenshot: `docs/qa-screenshots/05-roulette.png`

### 7. Subscribers (`/admin/subscribers`) — PASS (read-only)
- Page loads, h1 "Subscribers & Leads".
- Three stat tiles: TCPA Consents (0), B2B Inquiries (0), Total Leads (0).
- Two tables: "TCPA Consent Records" (empty), "B2B Data Inquiries" (empty).
- No buttons at all — no search, no export, no unsubscribe. Read-only by design for current scale.
- Screenshot: `docs/qa-screenshots/06-subscribers.png`

### 8. Campaigns (`/admin/campaigns`) — PARTIAL (stub)
- Page loads, h1 "Email Campaigns", single placeholder card: "Email/SMS campaigns pipeline — infrastructure ready. Configure RESEND_API_KEY and TWILIO_* env vars to enable sending."
- Lists API endpoints `/api/email/send` and `/api/email/unsubscribe` but provides no UI.
- Nothing to test, no send button, zero risk of a blast going out.
- Screenshot: `docs/qa-screenshots/07-campaigns.png`

### 9. Scrapers (`/admin/scrapers`) — FAIL (inconsistency)
- Page loads, h1 "Scraper Operations", table with columns Scraper / Last Run / Status / Deals Found / New Deals / Error.
- Body text: "Most recent run per scraper. To manually trigger, SSH to VPS and run: `npx tsx src/index.ts --source=brand-slug`" — no UI trigger.
- **Inconsistency:** table shows "No scrape runs logged yet." — but the Dashboard shows 10 recent scrape runs for the same data (wyndham, hyatt, festiva, etc.). Two different queries for the same `scrape_runs`/`sources` table disagree. Likely the Dashboard reads from one table and the Scrapers page reads from a different empty one, or the query filter on this page is wrong.
- Screenshot: `docs/qa-screenshots/08-scrapers.png`

### 10. Logout — PARTIAL (same localhost bug)
- Log out button on sidebar POSTs to `/api/admin/auth/logout`.
- Server correctly clears the session cookie (`set-cookie: vd_admin=; Expires=Thu, 01 Jan 1970 00:00:00 GMT`).
- But the same bug: `Location: https://localhost:3000/admin/login`. Browser will again show ERR_CONNECTION_REFUSED.
- After logout, `GET /admin` (no cookie) correctly returns `307 → https://vacationdeals.to/admin/login` (this redirect comes from middleware and uses the correct origin).

## Critical issues (must fix before real admin use)
1. **Login route returns `Location: https://localhost:3000/...` on success AND failure, and Logout route does the same.** Real admins cannot log in through the form. The underlying cookie flow works, but the user-facing form is broken. Fix: replace hardcoded `https://localhost:3000` with a relative URL (`/admin`, `/admin/login?error=failed`) in `apps/web/src/app/api/admin/auth/login/route.ts` and `.../logout/route.ts`. Probable root cause: `SITE_URL`/`NEXT_PUBLIC_SITE_URL` env var is set to `http://localhost:3000` on the production VPS, and the route does `NextResponse.redirect(new URL('/admin', process.env.SITE_URL))`.

## Non-critical issues
1. **Brands `toggle_suppress` action returns `"(implement store)"` in the message** — suggests it's a stub not actually persisting to the DB. Verify against DB; if confirmed, wire it up.
2. **Dashboard shows 10+ recent scrape runs, but `/admin/scrapers` shows "No scrape runs logged yet."** — two views of the same data disagree. Likely different table names or wrong filter on the scrapers page.
3. **`/admin/roulette` requires a second auth (`PAYLOAD_SECRET`)** despite the user already being a super-admin in the main admin session. Also it renders without the admin sidebar layout. Both are UX inconsistencies.
4. **Login API accepts only `application/x-www-form-urlencoded`** — `application/json` payloads always return `error=failed` even with valid creds. Either support both or document the expectation.
5. **Expire/Reactivate does not call `revalidatePath('/deals/[slug]')`** — stale ISR pages stay live until next revalidation cycle (3600s).
6. **`/admin/banners` and `/admin/campaigns` are stubs.** Spec expected create/send forms; none exist.
7. **`/admin/subscribers` has no search/export/unsubscribe controls.** Spec expected these.
8. **`/admin/scrapers` has no UI trigger for a single-source test run.** Must SSH to VPS.
9. **`Edit $` uses `window.prompt()`** — low UX quality, no validation visible in the UI.
10. **"PLAY NOW!" pill bleeds out of its container on the Roulette sidebar nav item** (cosmetic). Visible on `docs/qa-screenshots/08-scrapers.png` upper right.
11. **Admin pages include the public-site top navigation + footer + VacPack Rate Ticker + "Install Free" Chrome extension CTA** — noisy. Admin should probably have a stripped-down chrome.

## Frontend sync verification
- Admin Expire action updates `deals.is_active=false` in DB (confirmed via the admin table flipping to "Expired") — YES
- Admin-initiated change shown on frontend `/deals/[slug]` page: not within test window due to ISR caching (3600s revalidate). The admin action does not call `revalidatePath`. Partial — eventual consistency yes, immediate no.
- Brand suppress → frontend: could not verify (test brand had 0 deals, not listed on `/brands` regardless; and backend may be a stub anyway).
- Screenshots: `docs/qa-screenshots/02-deals.png` (Deals admin), `03-brands.png` (Brands admin).

## Cleanup
- Test data created: none (no banners created because no creation form exists).
- Test data mutated and restored:
  - Deal id 2287 ("Westin Los Cabos Resort Villas & Spa - Cabo San Lucas") → expired then reactivated. Confirmed back to `Active` with price `$499` before finishing.
  - Brand id 197 ("Vacation Offer") → `toggle_suppress` called twice (once by browser click, once by curl). Net state should be unchanged; but given the action may be a stub, there may be no persisted state to restore anyway.
- Session: logged out via API. `vd_admin` cookie confirmed cleared.

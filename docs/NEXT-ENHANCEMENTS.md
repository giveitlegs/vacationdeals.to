# Next Enhancements (prioritized)

_Originally generated 2026-07-08 during the full pricing audit. Updated 2026-07-09 after the scraper reliability overhaul — items 1–4 from the original list SHIPPED (see "Done" below)._

## 1. On-demand ISR revalidation after scrape waves
Landers revalidate on a fixed 1-hour ISR timer, so fresh scrape data can lag on-page by up to an hour. Add a `revalidatePath`/`revalidateTag` API route (secret-protected) that `scrape-wave.ts` calls after each wave completes, plus a nightly assertion comparing each lander's rendered "from $X" price against `MIN(deals.price)` in the DB, logging mismatches to `seo_health`.

## 2. Periodic browser-verified price audit for JS-priced sources
Hyatt's crawler still relies on a hand-verified price catalog (refreshed 2026-07-08 via stealth browser) because hyattvacationclub.com injects prices client-side. Add a monthly Playwright pass on the VPS that renders each Hyatt offer page and updates the catalog automatically — same pattern as the new HGV crawler. Candidates: hyatt, holiday-inn (Akamai-blocked; try Playwright from VPS IP), legendary (JS-heavy, no static prices).

## 3. Unpark watcher
Parked sources (monster-vacations, govip, discount-vacation, timeshare-presentation-deals) are skipped by waves. Add a weekly cron that HEAD-checks each parked source's base URL and emails (Resend) when one comes back alive so it can be re-activated with `UPDATE sources SET status='active'`.

## 4. hiltonhead-island-deals auto-recovery check
Site was in WordPress maintenance mode (503) on 2026-07-09 and its 3 deals were deactivated. The source is still active so waves will retry — confirm deals return once the site recovers, else investigate.

## 5. Sold-out/passed-event body checks beyond westgateevents.com
check-deal-health.ts currently GET-checks event-page bodies only for westgateevents.com. Extend `EVENT_BODY_CHECK_HOSTS` as more event-style sources are added (departure-depot is a candidate — its Josh Groban 404 was caught by the URL check, but future sold-out-but-200 pages wouldn't be).

---

## Done (2026-07-09)
- ✅ **Dead-man freshness alert** — `src/scrape-freshness-check.ts`, daily 08:00 cron, emails via Resend when no deal scraped in 26h.
- ✅ **Shell-agnostic cron wrapper** — `scripts/run-with-env.sh` (POSIX), all app crontab lines rewritten to use it.
- ✅ **Auto-delist dead deals** — health check now catches 404/410, DNS-dead hosts, off-root-domain redirects, and sold-out/passed westgateevents pages; no longer kills on 403 (bot-block false positive).
- ✅ **Crawlee queue isolation** — per-source `CRAWLEE_STORAGE_DIR` purged before each child run (stale queues made runs process 0 requests).
- ✅ **HGV rewritten to Playwright** — DOM-verified offers from the client-rendered start-traveling page.
- ✅ **Dead-URL crawlers fixed** — exploria (new exploriavacations.com product pages), vegas-timeshare (listing-page parsing with unique fragments), iwanttotravelto (/deals/ table parser); divi/margaritaville/timeshare-presentation-deals catalog fallbacks removed (DOM-verified only).
- ✅ **Parked-source skip** in scrape-wave + payvibe registered in wave 4.

# Next Enhancements (prioritized)

_Generated 2026-07-08 during the full pricing audit session. Priorities reflect what that audit exposed: all scraper crons silently dead for 2.5 months (crontab missing `SHELL=/bin/bash`), stale prices live on the site, and several sources unverifiable without a real browser._

## 1. Scraper dead-man monitoring (highest priority)
The cron failure went unnoticed from 2026-04-22 to 2026-07-08 because nothing alerts when scraping stops. Add a nightly heartbeat check: query `MAX(scraped_at)` across active deals; if older than 24h, send an email via Resend (already configured for the site) to giveitlegs@live.com. Optionally expose `/api/health/scrape-freshness` and hook an external uptime monitor to it. This makes a silent runaway impossible — same philosophy as the Cloudflare billing-alert rule.

## 2. Make cron jobs shell-agnostic
The root cause was `source .env` (bash-ism) in crontab lines. Replace every inline `set -a && source .env && set +a` with a single wrapper script (`scripts/run-with-env.sh`) that uses POSIX `. ./.env`, so jobs survive any future crontab rewrite that drops the `SHELL=` line. One line per cron entry: `/var/www/vacationdeals/scripts/run-with-env.sh npx tsx src/scrape-wave.ts --wave=1`.

## 3. Auto-delist expired/sold-out/GONE deals
The audit found live deals pointing at pages that 404 (Departure Depot Josh Groban event), events that already passed (GoVIP April event), and sold-out Westgate Events still listed as active. Extend `check-deal-health.ts` / `verify-prices.ts` to mark deals inactive when the source page 404s, says "Sold Out"/"This event has passed", or the event date is in the past. Trust signal matters more than deal count.

## 4. Playwright/stealth fallback for JS-priced and 403 sources
Hyatt (hyattvacationclub.com) injects prices client-side (`data-cmd-price` empty in static HTML), and TAFER/Sheraton VC/Westin VC 403 normal crawlers. Add a Playwright-based price-verify pass for these sources (Chromium is already installed on the VPS for GetawayDealz/Marriott), so every active deal is verifiable, not just Cheerio-reachable ones.

## 5. On-demand ISR revalidation after scrape waves
Landers revalidate on a fixed 1-hour ISR timer, so fresh scrape data can lag on page for up to an hour (and did lag for months when crons died, with no visibility). Add a `revalidatePath`/`revalidateTag` API route (secret-protected) that `scrape-wave.ts` calls after each wave completes, plus a nightly assertion script comparing each lander's rendered "from $X" price against `MIN(deals.price)` in the DB, logging mismatches to `seo_health`.

# Autopilot — what runs without you

Everything below runs autonomously on the VPS (`72.60.126.82`) via `crontab -l`.
You should not need to intervene from a desktop unless one of the alerts in the
"Manual checkpoints" section below fires.

## Schedule overview

| Time (UTC) | Job | Purpose | Log |
|---|---|---|---|
| `0 */6 * * *` | Wave 1 scrape | Westgate, BookVIP, GetawayDealz | `vacdeals-wave1.log` |
| `15 */6 * * *` | Wave 2 scrape | MRG, StayPromo, Wyndham, HGV | `vacdeals-wave2.log` |
| `30 */12 * * *` | Wave 3 scrape | Marriott, Holiday Inn, Spinnaker, Vacation Village | `vacdeals-wave3.log` |
| `45 6,18 * * *` | Wave 4 scrape | Departure Depot, Vegas Timeshare, Premier Travel, Festiva | `vacdeals-wave4.log` |
| `0 2 * * *` | Wave 5 scrape | Hyatt, Bluegreen, Capital Vacations, all-inclusive, etc. | `vacdeals-wave5.log` |
| `0 */6 * * *` | Verify prices | Sample-check 50 deals' prices against source | `vacdeals-verify.log` |
| `0 3 * * *` | Deal health | Re-evaluate expiration on existing deals | `vacdeals-health.log` |
| `0 4 * * *` | PSI / Core Web Vitals | PageSpeed Insights for 15 key URLs | `vacdeals-psi.log` |
| `0 4 */2 * *` | SEO audit | Internal SEO health checks | `vacdeals-seo-audit.log` |
| `0 5 * * *` | URL health | HEAD-check every active deal URL; deactivate 404/410/DNS-dead | `vacdeals-url-health.log` |
| `0 5 */2 * *` | RSS submit | Submit fresh sitemap entries to RSS aggregators | `vacdeals-rss-submit.log` |
| `0 6 * * *` | **Data-quality sweep** | Auto-deactivate /es/ dupes, category pages, seasonal, http/https dupes, login URLs, null titles | `vacdeals-data-quality.log` |
| `30 6 * * *` | Slug drift fix | Regenerate slugs whose embedded price has drifted from DB price | `vacdeals-slug-fix.log` |
| `30 8,20 * * *` | AI deal reviews | Generate ~50 reviews per run via Claude Haiku (~$0.50/run) | `vacdeals-reviews.log` |

All cron commands use `set -a && source .env && set +a` to safely load env vars
including comments and multi-line entries — the older `export $(cat .env | xargs)`
pattern silently broke on `#` comments and blocked all jobs.

## Defense-in-depth — why the bugs don't come back

Each historical bug is fixed in the scraper code, AND a recurring sweep
verifies it stayed fixed. If a regression slips in, the daily 06:00 sweep
catches and deactivates within 24 hours.

| Bug | Code fix | Daily sweep |
|---|---|---|
| Spanish `/es/` URL duplicates | `westgate.ts` skips `/es/` in DOM-discovery | Detects + deactivates any leak |
| Category-page deals (cheap-, budget-, *-packages) | `isRotatingOrGenericUrl()` patterns | Detects + deactivates |
| Past-season URLs (memorial-day, easter, labor-day) | `isRotatingOrGenericUrl()` patterns | Detects + deactivates |
| http/https duplicates | scrapers use https consistently | Detects + deactivates http sibling |
| Login/auth URLs as deals | scrapers should never enqueue these | Detects + deactivates |
| Null titles | scraper skips no-title cards | Detects + deactivates |
| Slug-price drift | `deal-store.ts` regenerates slug on drift | Daily fix script regenerates lingering drift |
| Dead URLs (404 / DNS-dead) | URL health audit auto-deactivates | Runs nightly at 05:00 |
| Stuck Crawlee state (BookVIP/HGV silent 0-req) | Each crawler runs in its own child process | Wave runs prove it on every cycle |
| Slug collision races | Insert retries with `-v2`, `-v3` suffix | N/A — handled inline |
| Concurrent storeDeal collisions | Insert retries on `deals_url_idx` and `deals_slug_idx` | N/A — handled inline |
| Westgate APP_DATA stale prices | DOM correction pass on every detail-page visit | DOM correction logs are visible in scrape logs |
| Rotating promo URLs (`travel-deal-tuesday`, `cyber-monday`, etc.) | `isRotatingOrGenericUrl()` patterns | Daily sweep catches anything new |

## Manual checkpoints (the only times you need to intervene)

1. **Add `PSI_API_KEY` to `.env`** — without it, the CWV cron exhausts the
   anonymous quota immediately and the `/admin/cwv` dashboard stays empty.
   Get a free key at <https://console.cloud.google.com/apis/credentials> →
   enable "PageSpeed Insights API". Add: `PSI_API_KEY=AIza...`. The cron
   will pick it up at the next 04:00 fire.

2. **Watch for high-flag runs in `/var/log/vacdeals-data-quality.log`.**
   The sweep prints `⚠ N flagged this run — investigate scraper regression`
   if more than 50 items get auto-deactivated in one run. That's a signal
   a scraper started producing bad data.

3. **Watch `/var/log/vacdeals-url-health.log`.** If the dead-URL count
   suddenly jumps (e.g., from ~15 to ~100), a target site likely changed
   its URL structure or went offline.

4. **Anthropic API key for AI reviews.** If `vacdeals-reviews.log` shows
   `ANTHROPIC_API_KEY required`, the key in `.env` rotated/expired. The
   script accepts `ANTHROPIC_API_KEY`, `ANTHROPIC_API`, `anthropic_API`,
   or `anthropic_api_key`.

## How to verify autopilot health

```bash
# On the VPS
crontab -l                                # see all 14 jobs
ls -la /var/log/vacdeals-*.log            # recent log activity (mtime in last 24h?)
tail -50 /var/log/vacdeals-data-quality.log  # last sweep
psql "$DATABASE_URL" -c "SELECT COUNT(*) FILTER (WHERE is_active) AS active FROM deals;"
```

Healthy signs:
- Every log has been written to within its scheduled window.
- `vacdeals-data-quality.log` ends with `Total flagged: <small number>`.
- Active deal count stays roughly steady or grows over time.
- `vacdeals-wave1.log` shows multiple "[westgate] Completed in N s" without the
  `[bookvip] Completed in 0.2s` pattern (which means the child-process isolation
  fix regressed).

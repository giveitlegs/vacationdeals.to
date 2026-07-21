# Next Enhancements (prioritized)

_Updated 2026-07-20 after the content + source-expansion session (52 weird-batch blog posts live, 8 new crawlers incl. the Branson network, SF technical audit clean). Earlier shipped items in "Done" below._

## 1. Playwright crawlers for wyndhamtrips.com + vacationpeople.com
Both confirmed to hold large vacpack inventories (wyndhamtrips: 4d/3n $199 + cruise combos across many destinations; vacationpeople: $479/couple packages across Cancun/PV/Orlando/Branson/Poconos/Gatlinburg with destination subdomains) but 403 plain HTTP — need PlaywrightCrawler from the VPS. vacationpeople's structure mirrors timesharevacationpackages.com, so the parse model already exists. Biggest remaining inventory unlock identified by the 2026-07-20 research sweep.

## 2. On-demand ISR revalidation after scrape waves
Landers revalidate on a fixed 1-hour ISR timer, so fresh scrape data can lag on-page up to an hour (sitemap.xml likewise picked up the 52 new posts only on its next cycle). Add a secret-protected `revalidatePath`/`revalidateTag` route that `scrape-wave.ts` (and the blog inserter) call on completion, plus a nightly assertion comparing each lander's rendered "from $X" against `MIN(deals.price)`, logging mismatches to `seo_health`.

## 3. Weird-batch performance tracking + second wave
52 unconventional posts went live 2026-07-20 (itineraries, rankings, AEO questions, tips — tagged `weird-batch`). In ~3 weeks, pull GSC impressions/clicks per slug and compare against the older guide-style posts; double down on whichever archetypes win (the AEO question posts are the most likely breakouts) with a second 50-post batch. Requires the GSC API access already used by the seo-audit cron.

## 4. Deal-page uniqueness monitor in the SF audit loop
The 2026-07-20 SF crawl found 107 duplicate titles from multi-source resort deals (fixed via "via <brand>" suffix) — but new sources keep arriving, and dupes can regrow. Add a monthly headless SF run (`ScreamingFrogSEOSpiderCli.exe` recipe now proven in `reports/2026-07-20/`) with a diff against the previous crawl's issue counts, emailed via Resend. Also watch `?page=N` pagination canonicals.

## 5. Branson network expansion + monitoring
The "Discover Branson" cluster (Branson Entertainment & Lodging LLC / Bryan Battaglia) and Save On Branson (Branson Internet Ventures LLC) have sister domains not yet crawled: bransonshowtickets.com, dinebranson.com, bransontravel.com, bransontravelservice.com — plus bransonshows.com (quote-flow, needs Playwright). Add the static sisters to the existing crawlers' seed lists where they list lodging packages, and monitor the gated "as low as" prices on save-on-branson for drift (classic phone-qualification pricing that changes seasonally).

---

## Done
**2026-07-20:** 52-post weird blog batch (JSON source-of-record pattern + `insert-blog-batch-json.ts`) · 8 new crawlers (discover-branson, save-on-branson, branson-travel-group, pgr-getaways, sandos-promo, great-resort-vacations, magical-getaway, cheap-vacation-getaways) · SF technical audit (2,082 URLs: 0 4xx, 0 chains, 0 missing titles/H1/alt; dup-title fix shipped) · spinnaker branson-redirect guard · API budget guard on reviews cron · full recrawl all waves green.
**2026-07-09:** Dead-man freshness alert (Resend) · POSIX cron wrapper · auto-delist dead deals (404/DNS/off-domain/sold-out) · Crawlee queue isolation · HGV Playwright rewrite · exploria/vegas-timeshare/iwanttotravelto URL rediscovery · catalog-fallback removal across 10 crawlers · parked-source skip.

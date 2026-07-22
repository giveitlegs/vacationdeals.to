# Next Enhancements (prioritized)

_Updated 2026-07-21 after the batch-2 content session (50 more posts, turbo globalEnv root-cause fix: sitemap 1216→2149 URLs incl. all 627 deal pages). Earlier shipped items in "Done" below._

## 1. Resubmit sitemap + monitor indexation of the 627 newly-exposed deal URLs
The turbo env fix means Google is seeing /deals/* URLs in the sitemap for the first time. Ping GSC (rss-submit/IndexNow cron already exists — confirm it pings sitemap.xml too), then watch GSC Coverage over 2-4 weeks for indexation rate of deal pages and the 102 new posts. If deal pages index poorly, consider a changefreq/priority tune and internal-link boosts from landers.

## 2. Audit other build-time DB consumers for the same silent-fallback pattern
The sitemap failed silently for months because every build-time DB read falls back to static data on error (getDB catch → null, getDealSlugs catch → []). Grep all `catch { return` fallbacks in apps/web/src/lib and add a build-time log line (or a build-failing assertion when DATABASE_URL is set but the query fails) so this class of bug can't hide again. Candidates: generateStaticParams on landers, llms-full.txt route, RSS routes.

## 3. Playwright crawlers for wyndhamtrips.com + vacationpeople.com
Both confirmed to hold large vacpack inventories (wyndhamtrips: 4d/3n $199 + cruise combos; vacationpeople: $479/couple packages across 6+ destinations with subdomains) but 403 plain HTTP — need PlaywrightCrawler from the VPS. vacationpeople's structure mirrors timesharevacationpackages.com. Biggest remaining inventory unlock.

## 4. On-demand ISR revalidation after scrape waves + blog inserts
Landers revalidate on a fixed 1-hour timer. Add a secret-protected `revalidatePath`/`revalidateTag` route that `scrape-wave.ts` and `insert-blog-batch-json.ts` call on completion, plus a nightly assertion comparing lander "from $X" against `MIN(deals.price)`, logged to `seo_health`.

## 5. Writer-agent output linting in insert-blog-batch-json.ts
Batch-2 QA caught 10 posts under the 900-word floor from one writer despite its self-validation claims. Move the guardrails into the inserter: word-count floor, metaDescription length, required BLUF div, balanced tags, humanization-marker check (at least one known misspelling present in body), and reject-with-report instead of trusting agent self-reports.

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

# Next Enhancements (prioritized)

_Updated 2026-07-23 during the 225-niche-page build session (stat-bait, requirements-AEO, legal, fees, calculators, showdowns, audiences, seasonal, watchdog, glossary — authored under `research/page-ideation-2026-07/`, shipped through the blog_posts pipeline at top-level slugs). Earlier shipped items in "Done" below._

## 1. Make the data/stat pages actually live-dynamic (their whole value prop)
The 30 stat-bait pages (price index, per-city histories, price-drop leaderboard, per-night rankings, etc.) currently bake in a point-in-time snapshot of DB numbers (pulled 2026-07-24). Their citability depends on being CURRENT. Build a nightly job that regenerates the numbers/tables in these specific `blog_posts` rows from live SQL (or convert them to real dynamic routes that query `deals`/`deal_price_history` at request time with ISR). Until then, add a cron that refreshes the embedded figures weekly so "updated <date>" stays honest.

## 2. Content-depth guardrail in insert-blog-batch-json.ts + a standing depth pass
Writer agents repeatedly under-deliver on prose length (this batch's first drafts came in ~390–600 words vs the 750+ target; the earlier showdown batch shipped 10 under-length). Move the floor into the inserter (reject <650 words of stripped-text prose with a report), and keep a reusable "depth-expansion" agent step in the pipeline. Shipping thin content at scale is a Helpful-Content/thin-affiliate ranking risk — the opposite of the goal.

## 3. Interactive versions of the 15 calculator pages
Category E shipped as static worked-example/formula pages (the CMS content field is static HTML). Convert the highest-value ones (rescission-deadline checker, presentation hourly-rate, savings, all-inclusive break-even) into real interactive routes with client components — tools earn passive links and rank for "calculator" queries. The static pages can 301 to the interactive versions.

## 4. Programmatic internal-linking + hub pages for the 225
These pages are strongest as hub-and-spoke clusters (glossary terms ↔ requirements ↔ data ↔ showdowns). Build category hub pages (`/vacation-deal-data`, `/timeshare-presentation-guide`, `/vacation-deal-glossary`) and an automated related-links injector so every new page links its siblings and the relevant lander/data hub. Also add them to the main nav/footer where appropriate.

## 5. Refresh DataForSEO creds + attach real volumes, then prune/prioritize
The probe (`scripts/probe-niche-keywords.ts`) 401'd on 2026-07-22 — creds need refreshing at app.dataforseo.com. Once live, run it across all 225 slugs' primary keywords, kill any that turn out to have real competition or zero commercial intent, and prioritize indexation/internal-link budget toward the genuine ultra-low-comp winners. Then monitor GSC indexation of the batch over 4-6 weeks (they land alongside the 627 deal URLs the turbo fix just exposed).

---

## Done
**2026-07-23:** 225 ultra-niche commercial/data pages authored across 10 categories (`research/page-ideation-2026-07/`) with a shared PAGE-BUILD-SPEC (authoritative voice, real-data citation, cite-this-page blocks, mandatory legal disclaimers) — built via 13 parallel writer agents into the blog_posts pipeline. QA-swarm fixes shipped 2026-07-22 (hyatt surcharge flip-flop, pgr 429 backoff, zombie-deal sweep, ticker tiebreak, bundles title dedup).
**2026-07-21:** turbo `globalEnv` root-cause fix (sitemap 1216→2149 URLs incl. 627 deal pages), sitemap revalidate + blog 500-cap lift, batch-2 (50 posts), deploy-procedure correction.
**2026-07-20:** 52-post weird blog batch + 8 new crawlers (Branson network + Tier-1) + SF technical audit.
**2026-07-09:** scraper reliability overhaul (POSIX cron wrapper, dead-man alert, catalog-fallback removal, HGV Playwright, parked-source skip).

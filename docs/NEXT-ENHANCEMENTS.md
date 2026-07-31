# Next Enhancements (prioritized)

_Updated 2026-07-31: 160 of the 225 niche pages inserted + verified live (A/B/C/D/E/G/I); F/H/J (65) building in a small agent wave after a session-limit killed the original 13-agent batch. Fresh priorities below reflect this session's lessons. Earlier shipped items in "Done"._

## NEW (2026-07-31 SF technical audit)
- **96 duplicate page titles** (of 2,466 URLs; otherwise clean — 0 4xx, 0 structured-data errors, 0 redirect chains, 0 missing H1/titles, admin secure). Root cause: many deal rows have empty `resort_name`, so the title template ("`<resort> <city> — <nights> from $<price> via <brand>`") collapses to identical strings for DIFFERENT resorts in the same city/price/brand (e.g. Westgate Lakes vs Town Center both render "…Orlando 4D/3N from $99 via GetawayDealz"). Do NOT mass-dedup by (brand,dest,price,nights) — 126 rows share that key but many are distinct resorts/event-dates; deletion would destroy real inventory. Fix: backfill `resort_name` in the crawlers (or add a date/id differentiator to the title when the resort name is absent) so titles are unique.

## NEW (2026-07-31 rate-accuracy swarm findings)
- **Two sources now return HTTP 202 bot-challenges** — `vegas-timeshare` (las-vegas-timeshare.com) and `branson-travel-group` added bot protection since we built their Cheerio crawlers; they'll silently go stale and get zombie-swept at 21d. Move both to a Playwright/stealth path or park them. (hyatt JS-injected + holiday-inn Akamai + spinnaker form-page-URLs remain expected-unverifiable.)
- **Automate the rate-accuracy swarm as a periodic job.** This session's 5-agent swarm (partner-lander price vs DB, ~65 samples) caught 7 stale/corrupt rows (credit-as-price, repurposed URLs, expired offers) that the URL-health cron misses because the URLs still 200. A monthly sampled price-vs-live check per source, emailing mismatches, would catch price drift the health check can't.
- **Fix the credit/gift-card-as-price parse bug at the source** in vacation-village + vacationvip (they store the $100/$150 credit or a tile/deposit figure instead of the package price). Add a deal-store guard: if `original_price < price`, or price equals a known credit-amount pattern, flag for review.

## 0. Automate the local DB-mirror sync (historical rate data is the crown jewel)
The 3-layer backup is sound but the LOCAL mirror sync is manual and drifted 6 days stale this session (last Jul 24 while server was current to Jul 30). Add a scheduled `scp` (Windows Task Scheduler or a cron on a box that's always on) that pulls the newest `/root/db-backups/*.pgdump` to `backups/db/` weekly, and a freshness assertion that warns when the newest local dump is >8 days old. `deal_price_history` is now ~87K rows (Mar–Jul) and irreplaceable — losing the server without a current offsite copy would erase the site's single biggest moat.

## 1. Cap parallel writer-agent fan-out to survive session limits
This session's 13-agent page batch was killed mid-run by a session limit; 10 files survived (they'd written before dying), 3 were lost and had to be rebuilt in a 3-agent wave. Codify a rule: dispatch content-writer swarms in waves of ≤5, insert/commit each wave before starting the next, and have agents write-once-then-stop (no self-expansion loops — those burned the tokens that tripped the limit). The insert pipeline is idempotent (skips existing slugs) so incremental waves are safe.

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
**2026-07-31:** All 225 niche pages shipped + verified (sitemap 2,447→2,480 URLs); full recrawl (all waves green); rate-accuracy swarm across all 34 sources vs live partner landers (~65 samples, overwhelming MATCH, 7 stale/corrupt rows fixed: credit-as-price, repurposed URLs, expired offers, placeholder original_prices); maintenance (zombie sweep + data-quality 17 fixes + verify-prices 44/50 OK 0 changed); SF technical audit clean (2,466 URLs, 0 4xx/SD-errors/chains, admin secure, 96 dup-titles → resort_name-backfill follow-up); 3-layer backups verified/refreshed; **weird-batch3: 50 new bespoke posts** (object bios, absurdist, hyper-specific moments, persona explainers — 1,244+ on-page words each; blog_posts 971→1,021). Flagged: vegas-timeshare + branson-travel-group now 202 bot-challenged.

**2026-07-23:** 225 ultra-niche commercial/data pages authored across 10 categories (`research/page-ideation-2026-07/`) with a shared PAGE-BUILD-SPEC (authoritative voice, real-data citation, cite-this-page blocks, mandatory legal disclaimers) — built via 13 parallel writer agents into the blog_posts pipeline. QA-swarm fixes shipped 2026-07-22 (hyatt surcharge flip-flop, pgr 429 backoff, zombie-deal sweep, ticker tiebreak, bundles title dedup).
**2026-07-21:** turbo `globalEnv` root-cause fix (sitemap 1216→2149 URLs incl. 627 deal pages), sitemap revalidate + blog 500-cap lift, batch-2 (50 posts), deploy-procedure correction.
**2026-07-20:** 52-post weird blog batch + 8 new crawlers (Branson network + Tier-1) + SF technical audit.
**2026-07-09:** scraper reliability overhaul (POSIX cron wrapper, dead-man alert, catalog-fallback removal, HGV Playwright, parked-source skip).

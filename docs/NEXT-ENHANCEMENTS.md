# Next Enhancements (prioritized)

## NEW (2026-08-11 evergreen ops — rate-accuracy swarm + new-site research)
_Shipped this session: 3-layer backup refreshed; full recrawl (all 5 waves green); 4-agent rate-accuracy swarm (~99 samples across all 34 sources, ~85 MATCH); 12 DB rows fixed in one transaction; 50-post Google-Discover blog batch (`research/blog-batches/discover-batch-2026-08/`); nav consolidation (12→8) + `vacdeals-evergreen` skill created._

**DB fixes already applied this session (done, listed for the record):** villa-group parked + all 9 `/specials/spring-sale` deals deactivated (promo retired, subdomains NXDOMAIN); bestvacationdealz 14534 + vegas-timeshare 23458 deactivated (dead/mis-mapped); prices corrected 612/14533/23424→$99, 23447→$1399, 22144→$49; capital-vacations 23313/23322 `original_price` 50000→NULL; durations 167/237→5, 23459→3.

**Deal-expiry policy (owner directive 2026-08-12): NEVER delete/404 a deal page.** `is_active=false` is our "expired-but-live" flag, NOT a delete: the `/deals/[slug]` lander stays 200 (fetches by slug without an `is_active` filter — intentional), shows a "This Deal Has Expired" banner, swaps the CTA from the dead outbound link to "See Current {Brand} Deals", is `robots:noindex` + dropped from the sitemap/listings, and **auto-revives** when the provider relists (deal-store upsert sets `isActive = !expired` on every re-scrape) — so a returning deal needs zero re-setup. Shipped 2026-08-12: consolidated the duplicated expired banner into one polished block + "it may come back, we keep the page up" copy. Manual expiry = `UPDATE deals SET is_active=false, expires_at=now()`; manual revival = `SET is_active=true, expires_at=NULL` (or just let the scraper re-activate it).

**Scraper CODE fixes still needed (data patched, source still emits the bug):**
1. **Recurring "partial/deposit/credit/gift-card amount stored as package price"** — confirmed AGAIN on `vacation-village` (612: $100 gift card), `vacationvip` (23424: $50 deposit, slug literally `...-99-vgc`), `bestvacationdealz` (14533: $49 vs live $99). Add the deal-store guard from the 2026-07-31 note (flag when `original_price < price` or price matches a known credit-amount pattern) AND fix each crawler's price regex to target the package "from $X" figure.
2. **vegas-timeshare fragment-anchor mapping is scrambled** — the "Las Vegas Getaway" row carried a $99 that belongs to a different package (live = free + $25 admin fee), and durations are off (Planet Hollywood stored 2N, live 3N). The #fragment→title/price/duration mapping needs a rewrite; it's also 202-bot-challenged (2026-07-31 note) → move to Playwright/stealth or park.
3. **villa-group is fully dead** — every URL is the retired `/specials/spring-sale` on subdomains that no longer resolve. Parked this session; **re-source from villagroup.com's current promo structure or leave parked**.
4. **all-inclusive-promotions price selector is ambiguous** — every page carries multiple prices ($479 member headline + resort-specific $1,408/$1,434); scraper currently grabs a valid-but-arbitrary one. Tighten the selector to the intended package figure.
5. **capital-vacations still inserts `original_price=50000`** placeholder — clean at the source (emit NULL) so the nightly-data-quality pass doesn't have to.
6. **getawaydealz Mexico all-inclusives** store 3 nights when the live page says 5 (167/237) — duration parse for the Sandos/Diamond listings.
7. **save-on-branson retail/original drift** (24023/24024: live $354/$381 vs DB $254/$269) — low priority; gated "as low as $129" price is correct.

**New vacpack-site candidates (deep-research swarm — build crawlers as a follow-up, don't auto-build):**
`vacationpeople.com`, `wyndhamtrips.com`, `ownyourvaca.com`, `alwaystravelwithus.com`, `staysharevacations.com` (Cheerio + UA header), `clubwyndhamgetaways.com` (Playwright). Excluded as already-scraped: timesharevacationpackages.com, vacationvip.com.

## ⚠️ REQUIRED FOLLOW-UPS (2026-08-02 legal + linking session)
_Shipped this session: 8 topical hub pages (orphan-tail fix), Guides nav, footer sitewide "not a timeshare marketing site" line, popup (6s every page, "not a marketing company", email-only + Terms/Privacy links), Terms §19 rewrite (fixed live over-claim of SMS/TCPA consent on email-only signups; email CAN-SPAM live, SMS gated behind a future phone opt-in), Terms §2.1 not-a-marketing clause, legal pages now emit WebPage schema. Two legal agents' full drafts are in this session's transcript._
1. **ATTORNEY REVIEW before relying on the TCPA/consent copy** — I cannot certify "bulletproof"/"perfect" compliance. Priorities for counsel: TCPA SMS express-written-consent capture (only when a phone field + dedicated checkbox exist), FL FTSA / OK OTSA / WA state mini-TCPA, one-to-one-consent status (vacated Jan 2025 but confirm), CAN-SPAM physical address in emails, and that the "not a marketing company" positioning matches actual operations.
2. **DO NOT SMS anyone yet** — the popup collects email only; texting email-only signups would itself violate TCPA. SMS requires a new phone field + separate unchecked SMS-consent checkbox with all disclosures, logged with timestamp.
3. **Privacy Policy upgrades (agent 2 draft)** — add a real "Do Not Sell/Share / Your Privacy Choices" opt-out + **actually honor GPC in code** before claiming it (false GPC claim = the Sephora violation); add email/phone to CCPA categories; add GDPR marketing lawful-basis; add a retention table; harmonize the absolute "we do not sell" language. Footer needs the "Your Privacy Choices" link once the opt-out mechanism exists.
4. **Expand pillar + hub prose** — the 2 pillars (~300 words) and hub intros are link-dense but below the 750-word depth bar; add substance so they're strong ranking targets, not just hubs.
5. **Re-crawl to confirm the orphan tail dropped** — hubs now link down to whole clusters + resolver links up; verify the ~460 under-linked / 135 near-orphan counts fell.


## NEW (2026-08-01 — internal-linking fixes shipped; remaining plan work)
_Full plan + shipped items in `docs/INTERNAL-LINKING-RANKING-PLAN.md`. Shipped this session: 2 commercial pillars (`/timeshare-presentation-deals`, `/all-inclusive-vacation-deals`), pillars in nav (depth-1), and the sitewide computed related-links resolver (a formerly 6-inlink page now renders 47 internal links)._ Top 5 next:
1. **Expand the two pillar pages' prose** — currently ~300 body words + tables + 8 FAQs (fine as hubs, below the 750 depth bar). Add 400+ words each so they're strong ranking targets, not just link hubs, for "timeshare presentation deals" / "all-inclusive vacation deals".
2. **Build the 4 topical hub pages** (requirements / glossary / legal / fees) so the ~90 non-geo near-orphans get a pillar — biggest remaining orphan fix.
3. **BreadcrumbList component + JSON-LD sitewide with a geo-pillar trail** — the flat top-level slugs express no hierarchy; breadcrumbs add free depth-reducing up-links (plan S2).
4. **Title + cannibalization tuning** — homepage vs `/deals` for "vacation deals"; force city-scoped niche pages to target only their long-tail modifier and link UP to the lander (plan QW6/QW7).
5. **Wire pillar links into SEOPreFooter + retitle `/deals-under-100` to own "$99 vacation packages"** — cheap on-page wins on the two biggest price/keyword targets.


_Updated 2026-07-31: 160 of the 225 niche pages inserted + verified live (A/B/C/D/E/G/I); F/H/J (65) building in a small agent wave after a session-limit killed the original 13-agent batch. Fresh priorities below reflect this session's lessons. Earlier shipped items in "Done"._

## NEW (2026-07-31 internal-linking / patents ranking plan — see docs/INTERNAL-LINKING-RANKING-PLAN.md)
Live crawl found the top-20 landers strong (depth-1, nav-linked) but the commercial money pages below the nav starved: F-showdowns depth-3/~6 inlinks, `/deals-under-200|500` + `/4|5-night-packages` depth-4/3 inlinks, `/no-presentation-vacation-deals` 5 inlinks; **137 near-orphans, 156 pages depth≥4, 474 under-linked non-deal pages**; and the two highest-ROI pillars (`/timeshare-presentation-deals`, `/all-inclusive-vacation-deals`) don't exist. Strategy: stop chasing OTA-locked "vacation packages", own the timeshare-preview lane. Top actions: build the 2 pillars; put all 20 landers + pillars in nav; raise niche-page links 3→12–20 via a computed resolver in the catch-all router; anchor-rotation table; breadcrumbs+schema; enforce pillar assignment at insert. Full prioritized plan (quick-wins + structural, patent-backed) in the dedicated doc.

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

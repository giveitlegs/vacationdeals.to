# Internal-Linking & Ranking Tweaking Plan — vacationdeals.to
_2026-07-31. Synthesized from: Google ranking-patent + 2024 API-leak research, current internal-linking best practices, a commercial-keyword→page map, and a live Screaming Frog crawl of the actual internal link graph (2,472 HTML URLs)._

## The one strategic decision that governs everything
**Do not chase the OTA-locked head terms** ("vacation packages", "cheap vacation packages", "all inclusive vacation packages"). Expedia/CheapCaribbean/airline-vacations own those and they serve flight+hotel intent we can't satisfy. **Win the timeshare-preview-qualified lane instead** — "timeshare presentation deals", "timeshare promotions", "$99 vacation package", "<city> timeshare deals", "no presentation vacation deals" — where the SERP is beatable aggregators (mypointslife, iwanttotravelto, timesharevacationpackages) and our independent multi-seller price-tracking angle is genuinely differentiated. Every tweak below serves that lane.

## What the live crawl proves (our actual graph — the problem is NOT the top landers)
- **The 20 destination + 14 brand landers are strong**: depth 1, ~2,442 inlinks each (they're in the global nav/footer). Leave them; they're already near the seed.
- **The money pages BELOW the nav are buried and starved:**
  - F-showdowns — our *most commercial* niche pages — sit at **depth 3 with only ~6 inlinks each** (`/westgate-vs-wyndham-orlando`, `/cheapest-presentation-deal-orlando-ranked`, `/cheapest-presentation-deal-las-vegas-ranked`).
  - `/no-presentation-vacation-deals` (a differentiated, winnable term): **depth 3, 5 inlinks**.
  - Price/duration money pages `/deals-under-200`, `/deals-under-500`, `/4-night-packages`, `/5-night-packages`: **depth 4, 3 inlinks each**.
  - `/orlando-resort-fee-database` d3/8, `/vacation-deals-travel-nurses` d3/5 — the niche tail is under-linked as designed (3 outbound links each, few inbound).
- **Scale of the problem:** **137 near-orphan pages** (≤1 unique inlink), **156 pages at depth ≥4**, and **474 non-deal pages with ≤3 inlinks at depth ≥3**.
- **Two highest-ROI pillars don't exist**: `/timeshare-presentation-deals` and `/all-inclusive-vacation-deals` both 404.

Bottom line: authority is pooled correctly on the top nav landers but **doesn't flow down to the commercial niche/price pages that target the winnable head terms**. Fix the flow, don't rebuild the site.

---

## SHIPPED 2026-08-01 (this session)
- **QW1 DONE** — built both pillars: `/timeshare-presentation-deals` + `/all-inclusive-vacation-deals` (live, 200, FAQPage schema, in sitemap, hub-linked down to their clusters).
- **QW2 DONE** — both pillars added to desktop + mobile nav → now depth-1.
- **QW3 DONE** — computed related-links resolver shipped (`lib/internal-links.ts` + `getSlugTitlesByCategory` + BlogPost.tsx merge). Every content page now gets a geo-pillar up-link + keyword-pillar up-links + same-category siblings with rotated (non-exact-match) anchors. Verified: `/westgate-vs-wyndham-orlando` went from 6 inlinks → 47 on-page internal links; the sibling links mean formerly-orphaned pages now receive many inbound links. Build green, deployed. _Follow-up: expand the two pillar pages' prose (currently ~300 body words + tables + 8 FAQs — fine as hubs but below the 750 depth bar); wire pillar links into SEOPreFooter; add breadcrumb geo-pillar trail (S2)._

## QUICK WINS (days — do these first)

### QW1. Build the two missing pillars — highest ROI on the site
- **`/timeshare-presentation-deals`** (targets "timeshare presentation deals / promotions / timeshare deals 2026"). A live hub aggregating current preview deals + every brand lander + the B (requirements) and F (showdown) clusters. This is the #1 gap.
- **`/all-inclusive-vacation-deals`** (targets the preview-qualified "all-inclusive" cluster) hubbing `/cancun` `/cabo` `/punta-cana` + the all-inclusive niche pages.
Link both from the homepage and the main nav so they land at depth 1. _Patent basis: link-distance seed proximity (US9165040) + titlematchScore (leak)._

### QW2. Put all 20 destination landers + the 2 new pillars in the header nav / homepage grid
Several cities and the price/duration pages currently reach depth 3–4. A persistent "Destinations" menu (all 20, not a rotating few) + "Deals by price/nights" menu makes them **depth 1–2** in one change. This is the single biggest equity-flow lever. _Patent basis: link distance (US9165040); leak siteAuthority flows by proximity._

### QW3. Raise niche-page internal links from 3 → 12–20 via a computed resolver (one template change, applies to all 225)
In the catch-all `(frontend)/[slug]/page.tsx`, compute at render time for every content page:
1. **1 up-link to its pillar** — derive the geo pillar from the slug's city token (`orlando-*`→`/orlando`) or the topical hub from category.
2. **5–10 siblings** — same category and/or same city token, ranked by shared entity (city/brand/price-band).
3. **2–3 cross-category bridges** (e.g. `/orlando-resort-fee-database` → `/orlando` + `/cheapest-presentation-deal-orlando-ranked`).
This directly fixes the 474 under-linked pages and most of the 137 orphans. _Patent basis: reasonable-surfer in-content links (US8686156), topicalityWeight, PageRank division across fewer, relevant links._

### QW4. Ban generic anchors + install an anchor-rotation table
Never "click here"/"read more"/"view deal". Rotate ≥4 descriptive variants per target so no single exact-match anchor exceeds ~50% of a URL's inbound anchors (avoids leak-confirmed `anchorMismatchDemotion`). Seed table:
- `/orlando`: "Orlando vacation deals" · "Orlando timeshare preview packages" · "cheap Orlando getaways" · "Orlando deals under $200"
- `/westgate`: "Westgate deals" · "Westgate $99 packages" · "Westgate preview offers"
- showdowns/data pages: use the full descriptive title as the anchor.
_Patent basis: anchor mismatch demotion + topicalityWeight (leak)._

### QW5. Concentrate contextual (in-body) links on the 18 priority targets
Move money links out of the SEOPreFooter and into the first-screen prose (footer links pass the least equity under reasonable-surfer). Priority receiving pages (ranked): `/timeshare-presentation-deals`(new) · `/orlando` · `/las-vegas` · `/deals-under-100` · `/branson` · `/gatlinburg` · `/myrtle-beach` · `/cancun` · `/westgate` · `/no-presentation-vacation-deals` · `/all-inclusive-vacation-deals`(new) · `/wyndham` · `/3-night-packages` · `/hilton-grand-vacations` · `/cabo` · `/punta-cana` · `/marriott` · `/deals-under-200`.

### QW6. Fix cannibalization — assign one canonical target per head term
- "vacation deals" → `/` (homepage) owns it; `/deals` = navigational "browse all", differentiate titles.
- "$99 / cheap vacation packages" → `/deals-under-100` (retitle H1/title to own "$99"); the other price bands target their own band only.
- "<city> vacation deals" → the **destination lander** is canonical; every city-scoped niche page must target only its long-tail modifier and link UP to the lander (never use "Orlando vacation deals" as its own H1).
- "branson vacation deals" → `/branson` (destination); `/discover-branson` targets the brand name only.

### QW7. Retitle for `titlematchScore` + lead the primary content chunk with the head term
Each commercial page's `<title>` leads with the exact target term ("Orlando Vacation Deals & Timeshare Packages 2026"). Lead landers with substantive prose (not the filter bar) so the head-term copy sits in the `primaryChunk`. generateMetadata already pulls live data — front-load the keyword.

---

## STRUCTURAL (weeks — foundational, durable)

### S1. Build the 4 missing topical hubs so non-geo clusters stop being orphan islands
`/timeshare-presentation-requirements` (hub for the 30 B pages), a glossary index (`/vacation-deal-glossary` → 20 J pages), a legal hub (`/timeshare-cancellation-laws` → 22 C pages), a fees hub (→ 18 D pages). A cluster with no pillar is just N orphans. Each hub links down to all children; children link up. _This alone re-homes ~90 of the near-orphans._

### S2. BreadcrumbList component + JSON-LD sitewide
The site renders everything at flat top-level slugs, so there's no URL hierarchy — breadcrumbs are the only way to express structure AND they add free depth-reducing up-links from every deep page to its pillar. Logical trails: `Home › Orlando vacation deals › Westgate vs Wyndham Orlando`. Absolute URLs, `position` from 1, visible trail matching schema (desktop rich-result eligible; still a ranking/structure signal on mobile).

### S3. Deterministic internal-link graph service in the router (makes QW3 durable + adds prose entity-linking)
Formalize QW3 as a shared lib, plus a build-time **entity auto-linker**: scan each page's body prose for known entities (20 cities, 14 brands, glossary terms) and auto-link the first mention of each to its canonical page (first-mention-only, capped, skip self-links). This converts the existing 750+ words on every page into contextual links with zero writer effort. _Highest-value automation; patent basis: reasonable-surfer context scoring + topicality._

### S4. Enforce pillar assignment at insert time
Add to `scripts/insert-blog-batch-json.ts`: every new content page must declare its geo pillar / topical hub, and the inserter verifies reciprocal up/down links exist. Bakes the architecture in so future batches can't regress into orphans.

### S5. Kill thin-content dilution (protect the whole domain's quality average)
The single largest structural risk at 2,472 URLs: site-quality is averaged (Panda US9767157 + leak siteAuthority), so thin pages drag the strong landers down. Enforce the 750+ words + real-data-table bar (already in CLAUDE.md); `noindex` or consolidate any page that can't clear it. Prefer fewer excellent pages. Route internal links toward proven-quality pages so equity pools where quality is high.

### S6. Weaponize the proprietary price data for information-gain
Our ~87K price-history rows are data no competitor has — exactly what the Information-Gain patents (US12013887) reward. Make the A/data pages live-dynamic (see NEXT-ENHANCEMENTS #1), surface unique computed numbers/tables prominently, and link every destination lander in-prose to its data page ("see our live per-night price rankings for Orlando" → `/orlando-vacation-package-price-history`). Use the constantly-changing prices to earn genuine `lastSignificantUpdate` freshness (≥~30% content change, not date bumps).

---

## The 10 patent-backed rules driving the above (ranked by impact)
1. Kill thin-content dilution — site quality is averaged (US9767157 + leak siteAuthority). → S5
2. Every commercial page ≤3 clicks from home via strong hubs (US9165040). → QW2, S1, S2
3. Money links in first-screen body prose, not footer (US8686156 reasonable surfer + leak chunk scoring). → QW5, S3
4. Turn proprietary price data into information-gain pages; link landers to them (US12013887). → S6
5. Diversify anchors; never one exact-match sitewide (leak anchorMismatchDemotion). → QW4
6. Keep links intra-topic for topicalityWeight (topic-sensitive PageRank + leak). → QW3, S3
7. Build tight entity clusters city↔brand↔fee↔seasonal↔showdown (leak siteFocusScore/siteRadius). → QW3, S1
8. Only rely on indexed, non-thin pages as link sources (leak indexedLink/sourceType). → S5
9. Lead title + primary chunk with the exact head term (leak titlematchScore/primaryChunk). → QW7
10. Earn genuine freshness from live prices; surround anchors with relevant context (leak freshness + reasonable surfer). → S6, S3

## Suggested execution order
QW1 → QW2 → QW6/QW7 (title & cannibalization, cheap) → QW3 (the resolver — biggest tail fix) → QW4/QW5 → S1 → S2/S3 → S4 → S5/S6. Re-crawl after QW3+S1 to confirm orphans↓ and depth-≥4↓, and that the F-showdowns and price pages climb from ~6 inlinks/depth-3 into the top decile of internal link score.

_Backing data & sources: `reports/2026-07-31/linkgraph/` (crawl), agent briefings in this session's transcript. Key numbers: 2,472 HTML URLs; depth dist {1:51, 2:854, 3:1410, 4:80, 5:54, 6:22}; 137 near-orphans; 474 under-linked non-deal pages._

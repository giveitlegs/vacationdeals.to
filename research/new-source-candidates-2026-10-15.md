# New vacpack source candidates — 2026-10-15 research swarm

Two research agents (US + Mexico/Caribbean) searched for timeshare-preview promo sites
NOT already scraped and NOT already flagged (Aug/Sept 2026 + 2026-09-21). DOM-verified
prices only. **Not auto-built.** The niche is now heavily saturated — the exclusion list
covers nearly every accessible US/MX broker with on-page prices; net-new is thin.

## Actionable (meets the bar: DOM price + presentation + scrapeable)

| url | example packages + prices | presentation? | Cheerio vs browser | bot-blocking | notes |
|---|---|---|---|---|---|
| **javorov.com** | 5 Days/4 Nights all-inclusive certificate — **$249 one-time** (or $29/mo ×10); 2 adults + 2 kids | **Yes** — one ~60–90 min tour/ownership presentation, "no obligation" | **Cheerio** (price in static HTML) | none | Only clean net-new find. Cancun/Cabo/Riviera Maya/PV. BookVIP-style single-SKU lander with an income/marital qualifier quiz. Low volume (one SKU) but on-niche. |

## Investigate with a browser scrape (right niche, prices JS-hidden)
- **amazing-mexico.com** — real operator (Villa del Palmar Los Cabos, actively reviewed 2026), explicit presentation; React shell, no DOM prices to Cheerio → needs PlaywrightCrawler. Mixed reviews (some "scam" 1-stars) — vet.
- **clubsolaris.com/deals** (GR/Club Solaris) — brand-direct MX all-inclusive, "attend a brief vacation-club presentation"; deal cards lazy-load prices via JS ("From $USD" with no amount in initial DOM). Needs browser.
- **getaway.tahitivillage.com** — on-model US (Somerpointe Resorts, Las Vegas), mandatory 120-min preview, $99 refundable deposit — but price lives only in FAQ prose, not a listing/table → needs a text/FAQ parser, not a price-table scraper. Low value.
- **orlandovacation.com** — firewall-blocks datacenter IPs entirely (ECONNREFUSED); likely lists villa+ticket packages with a timeshare-tour option but needs a residential/stealth fetch to assess.

## Off-model / skip
- **vacationstrategy.com** — clean DOM-priced Wyndham inventory in our exact destinations ($800–$1,406), BUT it's a timeshare **rental-resale** marketplace (owner weeks), NO 90-min presentation requirement. Usable only as a *rental* source if we ever add that model; not a vacpack-preview source.
- **certificates.villalavalencia.com** — DOM prices ($994–$1,264, Cabo) but it's a **Villa Group** brand (overlaps excluded villa-group/vallarta-sales) and shows no presentation framing. Marginal.
- Dead ends (verified, don't re-chase): orlandoescape.com (prices gated to inner pages), staysky.com (membership club, 404s), grandviewlasvegas.com (domain parked), vacationdeal.com (TLS cert mismatch), go-koala.com (rental marketplace). Every "$399 Cabo/$X 5-star" directory link → BookVIP (already scraped).

## Recommendation
- **Add now:** `javorov.com` (static, priced, presentation, Cheerio). Single $249 SKU.
- **Browser-scrape candidates** worth a Playwright spike: amazing-mexico.com, clubsolaris.com.
- Mexico/Caribbean preview-package supply is largely exhausted vs current coverage; future net-new will likely need in-country/non-English operator sites with browser rendering.

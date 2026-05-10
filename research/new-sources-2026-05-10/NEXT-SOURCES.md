# New Sources To Add — Consolidated 2026-05-10

Deep research combining (A) open-web SERP scouring, (B) DataForSEO competitor + backlinks, and (C) niche/affinity/regional discovery. All 39 currently-tracked sources excluded from this list.

## Headline numbers
- **3 discovery agents**, ~$1.40 DataForSEO spend, ~99/84/62 tool uses each.
- **~22 genuinely new Tier-1 candidates** after dedupe across the three reports.
- **2 affirmative corporate parents** discovered (`monsterrg.com` is parent of Monster Vacations + MRG).
- **5 sites confirmed to share a single Florida operator** (`Timeshare Orlando Marketing Group LLC, FL ST35208`): timeshareorlando.com, timesharevacationpackages.com, allinclusivepromotions.com, vacationpeople.com, vacationsourcetimeshare.com.
- **1 architectural insight**: the Marriott scraper's placeholder-title bug almost certainly stems from us scraping `marriottvacationclubs.com` instead of `packages.marriottvacationclubs.com` (the actual purchase funnel).
- **1 architectural insight**: the affinity/membership segment (military, AAA, Costco, AARP, USAA, etc.) is *mostly dead* for vacpacks — those programs are discount aggregators that explicitly do **not** require a timeshare-preview tour. Don't burn time there.

---

## Tier 1 — Top 12 to build scrapers for (priority order)

| # | Domain | Type | Why now | Scraper notes |
|---|---|---|---|---|
| 1 | **capitalvacationspackages.com** | Direct (Capital Vacations packages microsite) | We already have `capital-vacations.ts` and the `Capital Vacations` brand; just seeded the sources row today. Microsite has 10+ packages from $199. | CheerioCrawler. Static HTML. Crawl each `/{destination}/` page + the `/packages/` index. |
| 2 | **timesharevacationpackages.com** | Broker (Timeshare Orlando Marketing Group, FL ST35208) | Same operator as our existing AIP source — broader destination set. Cancun, Cabo, Punta Cana, Orlando, Vegas, Branson, Williamsburg, Gatlinburg, Hilton Head. | Cheerio. Per-destination landing pages have public prices in static HTML. |
| 3 | **packages.marriottvacationclubs.com** | Direct (Marriott — promo subdomain) | **Probable fix for Marriott placeholder-title bug.** The actual purchasable preview offers live here, not on the brand domain. | Playwright (Marriott uses anti-bot on the brand domain). |
| 4 | **worldmark.wyndhamdestinations.com** | Direct (Wyndham WorldMark sub-brand) | We scrape `clubwyndham.wyndhamdestinations.com` but not the WorldMark by Wyndham sister product (West-Coast targeted, distinct inventory). | Same Playwright config as the Wyndham hub scraper. Feed into a new `Worldmark by Wyndham` brand. |
| 5 | **timeshareorlando.com** | Broker (Orlando-only, same Florida operator as #2) | 8 priced packages, $121-$399 across Westgate + non-Westgate properties. Static HTML. | Cheerio. `/packages` index page is the single source. |
| 6 | **vacationpeople.com** | Broker (sister site of timesharevacationpackages.com) | Cloudflare-gated but same inventory shape. Worth scraping for cross-broker price validation. | Playwright with stealth-browser-mcp. |
| 7 | **getaway.tahitivillage.com** + **tahitivillage.com/special-offers** | Direct (Soleil Management, Vegas) | Independent Vegas property, no overlap with Westgate / MRG / Wyndham. $99-$249 packages. | Cheerio. Two URLs to seed. |
| 8 | **cheaptravelvip.com** | Broker (BookVIP-style vacation-certificate seller) | Closest direct competitor to BookVIP we've found. Florida Keys, Cancun, Punta Cana, Bahamas, Cozumel certificates. | Cheerio. Static HTML. |
| 9 | **getaways.hyattvacationclub.com** | Direct (Hyatt — destination-cert subdomain) | Adds Lake Tahoe Hyatt VC inventory that the main `hyattvacationclub.com` does not surface. | Cheerio. Static `/fb-cert/*` landing pages. |
| 10 | **branson.spinnakervacations.com** + **hiltonhead.spinnakervacations.com** | Direct (Spinnaker subdomains) | Distinct inventory & pricing from main spinnakerresorts.com (which is in catalog-fallback mode anyway). | Cheerio. WordPress. |
| 11 | **vacationplay.com** + **hiltonheadislanddeals.com** | Direct (Palmera Vacation Club — HHI) | Two domains, one brand. $249 3D/2N + tour. Customer-facing for Palmera's preview funnel. | Cheerio. |
| 12 | **vacationmyrtlebeach.com** | Direct (Enjoi Resorts Crown Reef MB) | Independent Myrtle Beach VC operator we don't have. | Cheerio. |

## Tier 1.5 — Mexican direct developers (Cluster: add together)

| # | Domain | Notes |
|---|---|---|
| 13 | **palaceresorts.com/offers** + Palace Elite | Major Mexico AI/VC operator. Cancun, Cozumel, Riviera Maya, Jamaica. May need Playwright. |
| 14 | **karismahotels.com/offers** | Karisma "Gourmet Inclusive" + Prestige Travelers VC. Server-rendered offers page. |
| 15 | **royal-holiday.com** | Royal Holiday Club VC (70k members, 180 destinations) — Spanish CMS, static-ish. |

## Tier 1.6 — Single-page quick wins

| # | Domain | Notes |
|---|---|---|
| 16 | **orlando99.com** | Single-page $99 Westgate Town Center lander. Trivial scrape. |
| 17 | **destinationcoupons.com** | 4 priced Vegas Westgate bundles ($59-$129), static HTML. |
| 18 | **genesisgrouplv.com** | Vegas concierge with Branson + Vegas + a unique Planet 13 package. |
| 19 | **hiltonheadforless.com** | Resort Source independent HHI broker (3rd HHI source). |
| 20 | **discount.spinnakerresorts.com** | Spinnaker discount subdomain — `/featured-packages.php`. |
| 21 | **spinnakervacations.com** | Spinnaker promo domain — distinct from spinnakerresorts.com. |

## Tier 1.7 — Aggregator subdomains worth crawling

| # | Domain | Notes |
|---|---|---|
| 22 | **getaways.vacationvip.com** + per-destination subdomains | Our VacationVIP source only hits the homepage; per-promo subdomains hold more inventory. |
| 23 | **vacationvillageresorts.com** + **affinityrewards.com** | Vacation Village's resort-parent + owner-referral preview sites — separate from vacationvillagedeals.com which we scrape. |

---

## Tier 2 — Defer or skip

- **Membership-gated affinity** (American Forces Travel, GovX, govvacationrewards, Costco Travel, Sam's Club, AAA, AARP, USAA, WeSalute, PerkSpot, BenefitHub): **all confirmed to NOT use the timeshare-preview model.** They are pure discount aggregators. Do not pursue.
- **monsterrg.com**: corporate parent of Monster Vacations + MRG. Useful for the brands relationship graph, not for net-new inventory.
- **allinclusiveoutlet.com**: Cloudflare-protected, BBB-registered vacation-certificate broker with 80k organic keywords. Worth a Playwright follow-up.
- **innseason.com**: New England regional gap (no current NE coverage).
- **vacationexpress.com**: Hybrid all-inclusive — verify it sells preview packages, not standard AI hotel inventory.
- **tradewindsresort.com**: Expired SSL — verify operating.

## Tier 3 — Explicitly skip

Cruise lines (Carnival/RC/NCL — appear only as bonus certs in other operators' packages), Disney Vacation Club (on-property only model), Outrigger Hawaii (hotel deals, no preview), Diamond Resorts (absorbed into HGV), Welk (absorbed into Marriott), vacationinternationale.com (telemarketing only), vacationsmadeeasy.com (show-ticket bundles, not preview), kingstonresorts.com (standard hotel deals).

---

## Estimated impact

If we build scrapers for Tier-1 #1-#12 (the top 12), conservative estimate:
- **Direct net-new deals: 80-150** (above today's 498 active)
- **New destinations unlocked**: Lake Tahoe (Hyatt), Carmel (Hyatt), Minnesota Breezy Point (Capital), Sedona expanded (Capital), Crown Reef Myrtle Beach (Enjoi), Palmera HHI properties.
- **Architectural fix**: Marriott scraper should produce real titles instead of placeholders after switching to `packages.marriottvacationclubs.com`.
- **Operator deduplication needed**: timeshareorlando + timesharevacationpackages + allinclusivepromotions share the same FL ST35208 operator. May produce duplicate deals at slug level — keep all 3 as separate sources but flag for dedupe.

## Build order recommendation

**Phase A (this week)** — Tier 1 quick wins:
1. capitalvacationspackages — crawler exists, just fix scraper to match site
2. timesharevacationpackages — Cheerio, big multi-destination boost
3. packages.marriottvacationclubs — likely fixes existing Marriott bug
4. timeshareorlando — Cheerio, 8 deals immediately

**Phase B (next 2 weeks)** — Direct developer subdomains:
5. worldmark.wyndhamdestinations + getaways.hyattvacationclub
6. branson./hiltonhead. spinnakervacations subdomains
7. getaway.tahitivillage

**Phase C** — Regional + niche:
8. vacationplay + hiltonheadislanddeals (Palmera HHI cluster)
9. hiltonheadforless (independent HHI)
10. vacationmyrtlebeach (Enjoi Resorts)
11. cheaptravelvip (BookVIP-style)
12. vacationpeople (Cloudflare-protected sister site)

**Phase D** — Mexico direct (cluster together for AI dest expansion):
13-15. palaceresorts, karismahotels, royal-holiday

**Phase E** — Single-page quick wins (1 hour each):
16-23. orlando99, destinationcoupons, genesisgrouplv, discount.spinnakerresorts, spinnakervacations root, getaways.vacationvip, vacationvillageresorts, affinityrewards

---

## Source files for this report

- `discovery-A-open-web.md` — open-web SERP scouring (8 Tier 1 finds)
- `discovery-B-dataforseo.md` — DataForSEO competitor + backlinks (5 Tier 1 + 4 Tier 2)
- `discovery-C-niche.md` — niche/affinity/regional (22 Tier 1 + 13 Tier 2 intel-only)

Plus SF crawl outputs in `../sf-crawls/2026-05-10-new-sources/<site>/`.

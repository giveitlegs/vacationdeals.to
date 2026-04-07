# VacationDeals.to — Comprehensive Scraping Reference

**Last Updated:** 2026-04-06
**Total Crawlers:** 33
**Active Sources:** 31
**Crawler Framework:** Crawlee (CheerioCrawler + PlaywrightCrawler)

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Data Flow](#data-flow)
3. [Crawler Inventory (All 33)](#crawler-inventory)
4. [Crawler Categories](#crawler-categories)
5. [Orchestration & Scheduling](#orchestration--scheduling)
6. [Deal Storage & Upsert Logic](#deal-storage--upsert-logic)
7. [Expiration Detection](#expiration-detection)
8. [Error Handling Patterns](#error-handling-patterns)
9. [Anti-Bot Workarounds](#anti-bot-workarounds)
10. [Database Schema (Deal-Related)](#database-schema)
11. [Running Scrapers](#running-scrapers)
12. [Monitoring & Health Checks](#monitoring--health-checks)

---

## Architecture Overview

```
apps/scraper/
  src/
    index.ts              — Main entry point, orchestrates all crawlers
    crawlers/             — 33 crawler files (one per source)
    storage/
      deal-store.ts       — Central storeDeal() function, upsert + price history
    scrape-wave.ts        — Wave-based scraping (batch groups)
    seo-audit.ts          — SEO health checker
    check-deal-health.ts  — URL health verification
    rss-submit.ts         — RSS directory submission
    syndicate-blog.ts     — Blog syndication (Dev.to, Hashnode, X, IndexNow)
```

**Two Crawler Types:**
- **CheerioCrawler (26 crawlers):** Static HTML parsing, fast, lightweight. Used for server-rendered sites.
- **PlaywrightCrawler (7 crawlers):** Full browser rendering. Used for SPAs, JS-heavy sites, and sites with anti-bot protection.

---

## Data Flow

```
1. index.ts runs deactivateExpiredDeals() — marks past-expiry deals as inactive
2. For each crawler (sequential, with try-catch):
   a. Crawler hits target URL(s)
   b. Extracts deal data (CSS selectors, JSON parsing, regex)
   c. Calls storeDeal(scrapedDeal, sourceKey) for each deal found
3. storeDeal() pipeline:
   a. Sanitize title (remove addresses, zip codes, whitespace)
   b. Sanitize city (map variations: "kissimmee" -> "Orlando")
   c. Detect expiration (keyword + date + JSON field analysis)
   d. Upsert by URL:
      - New URL: INSERT deal + record initial price in dealPriceHistory
      - Existing URL: UPDATE fields + record price change if different
   e. Set isActive based on expiration detection
4. process.exit(0) when all crawlers complete
```

---

## Crawler Inventory

### Status Legend
- **Working** — Actively producing deals from live scraping
- **Fallback** — Site blocks bots; uses hardcoded catalog of known deals
- **Graceful 403** — Handles 403 responses, falls back to catalog
- **JS-Heavy** — Requires PlaywrightCrawler for rendering
- **Parked** — Domain inactive/for-sale, monitored for revival

### Full Inventory Table

| # | Name | File | Type | Brand Slug | Target URL | Status | Deals |
|---|------|------|------|------------|-----------|--------|-------|
| 1 | Westgate | westgate.ts | Cheerio | westgate | westgatereservations.com | Working | ~33 |
| 2 | Westgate Events | westgate-events.ts | Cheerio | westgate-events | westgatereservations.com/... | Working | varies |
| 3 | BookVIP | bookvip.ts | Cheerio | bookvip | bookvip.com | Working | ~19 |
| 4 | GetAwayDealz | getawaydealz.ts | Playwright | getawaydealz | getawaydealz.com | JS-Heavy | ~23 |
| 5 | MRG | mrg.ts | Cheerio | mrg | monsterresgroup.com | Working | ~47 |
| 6 | HGV | hgv.ts | Cheerio | hgv | hgvacations.com | Working | ~4 |
| 7 | Wyndham | wyndham.ts | Cheerio | wyndham | clubwyndham.wyndhamdestinations.com | Working | ~19 |
| 8 | Holiday Inn | holiday-inn.ts | Playwright | holiday-inn | holidayinn.com | Fallback | ~1 |
| 9 | Marriott | marriott.ts | Playwright | marriott | packages.marriottvacationclubs.com | JS-Heavy | ~9 |
| 10 | GoVIP | govip.ts | Cheerio | govip | govip.com | Parked | 0 |
| 11 | StayPromo | staypromo.ts | Cheerio | staypromo | staypromo.com | Working | varies |
| 12 | Vacation Village | vacation-village.ts | Cheerio | vacation-village | vacationvillage.com | Working | ~30 |
| 13 | Spinnaker | spinnaker.ts | Cheerio | spinnaker | spinnaker.com | Working | varies |
| 14 | Departure Depot | departure-depot.ts | Cheerio | departure-depot | departuredepo.com | Working | varies |
| 15 | Vegas Timeshare | vegas-timeshare.ts | Cheerio | vegas-timeshare | vegastimesharedeals.com | Working | varies |
| 16 | Premier Travel | premier-travel.ts | Cheerio | premier-travel | premiertravelresorts.com | Working | varies |
| 17 | Discount Vacation | discount-vacation.ts | Playwright | discount-vacation | discountvacationstore.com | Working | varies |
| 18 | Legendary | legendary.ts | Playwright | legendary | legendary.com | Working | varies |
| 19 | Festiva | festiva.ts | Cheerio | festiva | festiva.com | Working | ~10 |
| 20 | Hyatt | hyatt.ts | Cheerio | hyatt | hyattresidencesfacilities.com | Working | varies |
| 21 | Capital Vacations | capital-vacations.ts | Cheerio | capital-vacations | capitalvacations.com | Fallback | ~25 |
| 22 | Bluegreen | bluegreen.ts | Playwright | bluegreen | bluegreenvacations.com | Working | varies |
| 23 | El Cid | el-cid.ts | Cheerio | el-cid | elcidresorts.com | Working | varies |
| 24 | Pueblo Bonito | pueblo-bonito.ts | Cheerio | pueblo-bonito | pueblobonito.com | Working | varies |
| 25 | DIVI | divi.ts | Cheerio | divi | diviresorts.com | Working | ~6 |
| 26 | Bahia Principe | bahia-principe.ts | Cheerio | bahia-principe | bahiaprincipe.com | Working | varies |
| 27 | TAFER | tafer.ts | Cheerio | tafer | taferhoteles.com | Graceful 403 | varies |
| 28 | Villa Group | villa-group.ts | Cheerio | villa-group | villagroupresorts.com | Working | varies |
| 29 | Sheraton VC | sheraton-vc.ts | Cheerio | sheraton-vc | westinvacationclub.marriott.com | Graceful 403 | ~25 |
| 30 | Westin VC | westin-vc.ts | Cheerio | westin-vc | westinvacationclub.marriott.com | Graceful 403 | ~10 |
| 31 | VacationVIP | vacationvip.ts | Cheerio | vacationvip | vacationvip.com | Working | varies |
| 32 | BestVacationDealz | bestvacationdealz.ts | Cheerio | bestvacationdealz | bestvacationdealz.com | Working | varies |
| 33 | Monster Vacations | monster-vacations.ts | Cheerio | monster-vacations | monstervacations.com | Parked | 0 |

---

## Crawler Categories

### By Crawler Type
| Type | Count | Crawlers |
|------|-------|----------|
| CheerioCrawler | 26 | Westgate, Westgate Events, BookVIP, MRG, HGV, Wyndham, GoVIP, StayPromo, Vacation Village, Spinnaker, Departure Depot, Vegas Timeshare, Premier Travel, Festiva, Hyatt, Capital Vacations, El Cid, Pueblo Bonito, DIVI, Bahia Principe, TAFER, Villa Group, Sheraton VC, Westin VC, VacationVIP, BestVacationDealz, Monster Vacations |
| PlaywrightCrawler | 7 | GetAwayDealz, Holiday Inn, Marriott, Discount Vacation, Legendary, Bluegreen |

### By Status
| Status | Count | Crawlers |
|--------|-------|----------|
| Working | 22 | Westgate, Westgate Events, BookVIP, MRG, HGV, Wyndham, StayPromo, Vacation Village, Spinnaker, Departure Depot, Vegas Timeshare, Premier Travel, Festiva, Hyatt, El Cid, Pueblo Bonito, DIVI, Bahia Principe, Villa Group, VacationVIP, BestVacationDealz, Bluegreen |
| JS-Heavy (needs Playwright) | 3 | GetAwayDealz, Marriott, Discount Vacation, Legendary |
| Fallback (catalog seed) | 2 | Holiday Inn, Capital Vacations |
| Graceful 403 (catalog on block) | 3 | TAFER, Sheraton VC, Westin VC |
| Parked (monitored) | 2 | GoVIP, Monster Vacations |

### By Brand Type
| Type | Description | Crawlers |
|------|-------------|----------|
| **Direct** | Brand's own website | Westgate, Westgate Events, HGV, Bluegreen, Wyndham, Holiday Inn, Hyatt, Marriott, Capital Vacations, Vacation Village, Spinnaker, Legendary, Festiva, El Cid, Pueblo Bonito, Divi, Bahia Principe, TAFER, Villa Group, Sheraton VC, Westin VC |
| **Broker** | Third-party deal aggregator | BookVIP, GetawayDealz, VacationVIP, BestVacationDealz, MRG, Monster Vacations, GoVIP, StayPromo, Departure Depot, Vegas Timeshare, Premier Travel, Discount Vacation |

### By Geography
| Region | Crawlers |
|--------|----------|
| US (multi-state) | Westgate, BookVIP, MRG, HGV, Wyndham, Holiday Inn, Marriott, StayPromo, Vacation Village, Spinnaker, Capital Vacations, Hyatt, Festiva, VacationVIP, BestVacationDealz |
| Las Vegas focused | Vegas Timeshare, Westgate Events |
| Mexico focused | El Cid, Pueblo Bonito, TAFER, Villa Group, Discount Vacation |
| Caribbean focused | DIVI, Bahia Principe |
| Mexico + Caribbean | Legendary (Hard Rock/Palace) |
| Premium/Luxury | Westin VC, Sheraton VC, Marriott |

---

## Orchestration & Scheduling

### Entry Point: `apps/scraper/src/index.ts`

```
1. Parse CLI args: --source=<key> for single crawler
2. Call deactivateExpiredDeals() — pre-scrape cleanup
3. If --source provided: run single crawler
   Else: run ALL 33 crawlers sequentially
4. Each crawler wrapped in try-catch (one failure doesn't stop others)
5. process.exit(0)
```

### Cron Schedule (VPS)
```
0 */6 * * *    — Runs all scrapers every 6 hours (4x daily)
```

### Wave Scraping: `apps/scraper/src/scrape-wave.ts`
Alternative batch-based execution (groups crawlers into waves for resource management).

### Individual Scraper Commands
```bash
cd apps/scraper
npx tsx src/index.ts --source=westgate
npx tsx src/index.ts --source=bookvip
npx tsx src/index.ts --source=getawaydealz
# ... etc for all 33 source keys
```

Or via pnpm scripts:
```bash
pnpm scrape              # all sources
pnpm scrape:westgate     # single source
pnpm scrape:wave         # wave-based batching
```

---

## Deal Storage & Upsert Logic

### File: `apps/scraper/src/storage/deal-store.ts`

### storeDeal(scrapedDeal, sourceKey, pageText?)

**Input:** ScrapedDeal object from any crawler + source identifier

**Processing Pipeline:**
1. **Title Sanitization** — Removes addresses, zip codes, excessive whitespace
2. **City Sanitization** — Maps variations to canonical names:
   - "kissimmee", "celebration" -> "Orlando"
   - Strips addresses from city fields
3. **Expiration Detection** — Multi-strategy analysis (see below)
4. **Brand/Destination/Source Resolution** — Looks up or creates FK references
5. **Upsert by URL:**
   - If URL exists: UPDATE all fields, check price change
   - If URL is new: INSERT deal record
6. **Price History:** If price changed, insert new dealPriceHistory record
7. **isActive Management:** Based on expiration + URL health

### ScrapedDeal Interface (input from crawlers)
```typescript
{
  title: string
  price: number
  originalPrice?: number
  durationNights: number
  durationDays: number
  destination: string        // city name
  resortName?: string
  url: string               // unique key for upsert
  imageUrl?: string
  inclusions?: string[]
  requirements?: string[]
  presentationMinutes?: number
  travelWindow?: string
  savingsPercent?: number
  description?: string
}
```

---

## Expiration Detection

### Strategy: Conservative (only marks expired with strong evidence)

**Detection Methods (in priority order):**

1. **Keyword Matching** in deal title/description:
   - "expired", "sold out", "no longer available", "unavailable"
   - "past offer", "discontinued", "ended"

2. **Holiday Patterns** (seasonal promotions):
   - "cyber monday", "black friday" + evidence of past year
   - Only triggers if year context confirms it's past

3. **Season Patterns:**
   - "Spring 2025" when current year is 2026 -> expired
   - Season + year must be in the past

4. **JSON Date Fields** (in structured data):
   - `offer_ends`, `end_date`, `expiration_date`, `expires`, `valid_until`, `sale_ends`
   - Parses and compares to current date

5. **Explicit Date Text:**
   - Regex: "Ends: January 15, 2026" patterns
   - Parses date and compares to now

**Important:** Only checks deal's OWN text (title + description + URL), NOT full page HTML. This prevents false positives from other deals' expiration text on the same page.

---

## Error Handling Patterns

### Crawler-Level
| Pattern | Usage | Description |
|---------|-------|-------------|
| try-catch per crawler | All 33 | One crawler failure doesn't stop the run |
| maxRequestRetries | All | 1-3 retries per failed HTTP request |
| maxRequestsPerCrawl | All | Limits 15-150 requests to prevent runaway crawls |
| requestHandlerTimeoutSecs | All | 10-60 second timeout per page |
| failedRequestHandler | 5+ crawlers | Custom logging on request failure |

### Storage-Level
| Pattern | Description |
|---------|-------------|
| Fire-and-forget | storeDeal() calls are NOT awaited; failures are logged only |
| Graceful null returns | storeDeal() returns null on failure without throwing |
| Price history on change only | Only records price history when price actually changes |

### Fallback Strategies
| Strategy | Count | Crawlers Using It |
|----------|-------|-------------------|
| Known resort catalog | 12 | Vacation Village (~30 deals), Capital Vacations (~25), Sheraton VC (~25), Westin VC (10), Festiva (~10), DIVI (~6), Holiday Inn, TAFER, and others |
| Seed URLs | 3 | BookVIP, HGV, GetAwayDealz |
| Parked domain detection | 2 | GoVIP (GoDaddy parking page), Monster Vacations |
| 403 graceful handling | 3 | TAFER, Sheraton VC, Westin VC |

---

## Anti-Bot Workarounds

| Crawler | Challenge | Workaround |
|---------|-----------|------------|
| Marriott | SSL certificate validation | `rejectUnauthorized: false` in Playwright |
| Holiday Inn | Okta auth wall | Falls back to known resort catalog |
| GetAwayDealz | Next.js SPA rendering | PlaywrightCrawler + `networkidle` wait |
| Legendary | Dynamic JS pricing | PlaywrightCrawler + `networkidle` + 2-3s extra wait |
| Capital Vacations | Greenshift JS builder | Falls back to ~25 known deals |
| Discount Vacation | SSL + bot detection | PlaywrightCrawler + `rejectUnauthorized: false` |
| Bluegreen | Dynamic DOM rendering | PlaywrightCrawler + DOM element wait |
| GoVIP | Parked at GoDaddy | Detects `forsale.godaddy.com` HTML, returns gracefully |
| TAFER | 403 Forbidden | Catches 403, seeds from luxury catalog |
| Sheraton VC | Marriott 403 protection | Falls back to ~25 resort catalog |
| Westin VC | Marriott 403 protection | Falls back to 10-resort catalog |

---

## Extraction Methods by Crawler

| Method | Count | Crawlers |
|--------|-------|----------|
| **CSS selectors** (.deal-card, .resort-card, etc.) | 26 | Most Cheerio crawlers |
| **Regex on text** ($price, duration, %OFF patterns) | 20 | Cross-cutting |
| **Embedded JSON/JS parsing** (APP_DATA, productObj, GA4 arrays) | 8 | Westgate, BookVIP, HGV, and others |
| **Data attributes** ([data-price], [data-duration]) | 4 | Hyatt, Vacation Village |
| **Known catalog fallback** (hardcoded resort lists) | 12 | See Fallback Strategies above |
| **Per-night to package conversion** (multiply rate x nights) | 4 | Villa Group, Departure Depot |
| **WooCommerce product parsing** | 1 | Departure Depot |
| **WordPress blog post parsing** | 1 | Vegas Timeshare |
| **Elementor section parsing** | 2 | Spinnaker, El Cid |
| **ASP.NET page parsing** | 1 | Vacation Village |

---

## Database Schema (Deal-Related Tables)

### deals
| Column | Type | Notes |
|--------|------|-------|
| id | serial PK | |
| brandId | FK -> brands.id | |
| destinationId | FK -> destinations.id | |
| sourceId | FK -> sources.id | |
| title | varchar(500) NOT NULL | |
| slug | varchar(500) NOT NULL UNIQUE | |
| price | decimal(10,2) NOT NULL | |
| originalPrice | decimal(10,2) | |
| durationNights | integer NOT NULL | |
| durationDays | integer NOT NULL | |
| description | text | |
| resortName | varchar(500) | |
| url | text NOT NULL | UNIQUE INDEX — upsert key |
| imageUrl | text | |
| inclusions | text (JSON) | |
| requirements | text (JSON) | |
| presentationMinutes | integer | |
| travelWindow | varchar(255) | |
| savingsPercent | integer | |
| isActive | boolean (default true) | |
| scrapedAt | timestamp | |
| expiresAt | timestamp | |
| createdAt | timestamp | |
| updatedAt | timestamp | |

### dealPriceHistory
| Column | Type | Notes |
|--------|------|-------|
| id | serial PK | |
| dealId | FK -> deals.id (CASCADE) | |
| price | decimal(10,2) NOT NULL | |
| scrapedAt | timestamp | |

### brands (33 seeded)
| Column | Type | Notes |
|--------|------|-------|
| id | serial PK | |
| name | varchar(255) NOT NULL | |
| slug | varchar(255) UNIQUE | |
| type | varchar(50) | "direct" or "broker" |
| website | text | |
| description | text | |

### destinations (64 seeded)
| Column | Type | Notes |
|--------|------|-------|
| id | serial PK | |
| city | varchar(255) NOT NULL | |
| state | varchar(100) | |
| region | varchar(100) | |
| country | varchar(100) default "US" | |
| slug | varchar(255) UNIQUE | |
| latitude | decimal(10,7) | |
| longitude | decimal(10,7) | |

### sources (31 seeded)
| Column | Type | Notes |
|--------|------|-------|
| id | serial PK | |
| name | varchar(255) NOT NULL | |
| baseUrl | text NOT NULL | |
| scraperKey | varchar(100) UNIQUE | Matches crawler source slug |
| lastScrapedAt | timestamp | |
| status | varchar(50) default "active" | |
| dealCount | integer default 0 | |

---

## Running Scrapers

### Run All (Production)
```bash
cd /var/www/vacationdeals
export $(cat .env | xargs)
pnpm scrape
```

### Run Single Source (Development/Debug)
```bash
cd apps/scraper
npx tsx src/index.ts --source=westgate
npx tsx src/index.ts --source=bookvip
npx tsx src/index.ts --source=marriott
# ... any of the 33 source keys
```

### Run via pnpm Scripts
```bash
pnpm scrape:westgate
pnpm scrape:bookvip
pnpm scrape:getawaydealz
pnpm scrape:mrg
pnpm scrape:hgv
pnpm scrape:wyndham
pnpm scrape:holiday-inn
pnpm scrape:marriott
pnpm scrape:govip
pnpm scrape:westgate-events
pnpm scrape:staypromo
pnpm scrape:vacation-village
pnpm scrape:spinnaker
pnpm scrape:departure-depot
pnpm scrape:vegas-timeshare
pnpm scrape:premier-travel
pnpm scrape:discount-vacation
pnpm scrape:legendary
pnpm scrape:festiva
pnpm scrape:hyatt
pnpm scrape:capital-vacations
pnpm scrape:bluegreen
pnpm scrape:el-cid
pnpm scrape:pueblo-bonito
pnpm scrape:divi
pnpm scrape:bahia-principe
pnpm scrape:tafer
pnpm scrape:villa-group
pnpm scrape:sheraton-vc
pnpm scrape:westin-vc
pnpm scrape:vacationvip
pnpm scrape:bestvacationdealz
pnpm scrape:monster-vacations
```

### Wave Scraping
```bash
pnpm scrape:wave
```

---

## Monitoring & Health Checks

### Deal URL Health
```bash
cd apps/scraper
npx tsx src/check-deal-health.ts
```
Performs HEAD requests on deal URLs to verify they're still reachable (200-299). Returns false for 404/410/5xx. Returns true on network errors (optimistic — assumes deal is alive if unreachable).

### SEO Health Audit
```bash
pnpm seo:audit
```
Checks all site pages for SEO issues, stores results in `seoHealth` table. Accessible via `/api/seo-health?key=PAYLOAD_SECRET`.

### What's NOT Monitored (Gaps)
- No alerting when a crawler produces 0 deals
- No centralized rate limiting across all 33 crawlers
- No retry queue for failed storeDeal() calls
- storeDeal() failures are logged but not tracked
- No dashboard for scraper health over time

---

## Crawler Detail: Extraction Strategies

### Westgate (westgate.ts)
**Strategy:** Extracts Angular `APP_DATA` constant embedded in HTML. Uses regex + bracket matching to parse nested JSON containing 50+ specials and resort data. Processes both `show:true` and `show:false` deals. Enqueues `/specials/{destination}` and individual deal pages.

### Westgate Events (westgate-events.ts)
**Strategy:** 785+ lines. Complex venue classification (Amway Center, Exploria Stadium, etc.). Event-specific pricing. Parses concert/sports/show packages with date detection.

### BookVIP (bookvip.ts)
**Strategy:** 4 extraction strategies. Parses `productObj` JS arrays from destination pages at `/book-vacation/{city}`. Falls back to card text matching and multi-source price extraction.

### GetAwayDealz (getawaydealz.ts)
**Strategy:** Next.js SPA. Uses Playwright with `networkidle` wait. Location-based URL structure. Extracts hotel and room-type pricing matrices from rendered DOM.

### MRG (mrg.ts)
**Strategy:** WordPress/Elementor site. Parses destination pages + bundle pages. 29 destinations + 20 bundles. Resort mapping from page content.

### HGV (hgv.ts)
**Strategy:** Parses GA4 item lists and `fullwidthctapromos` arrays from script tags via regex. Carousel deal extraction. Resort name from embedded data layer.

### Wyndham (wyndham.ts)
**Strategy:** 18+ known destination pages at `/vacationpreview/vacation-getaways`. Base price $199. Detects Wyndham Rewards Points bonuses and "Your Choice" flexible offers.

### Holiday Inn (holiday-inn.ts)
**Strategy:** Okta auth required. Attempted auth handling but IHG blocks most bot traffic. Falls back to known resort catalog seed data.

### Marriott (marriott.ts)
**Strategy:** SSL cert ignore (`rejectUnauthorized: false`). Fetches `/offers` and `/offers/{id}`. Handles bot protection. $399-$1299 price range.

### StayPromo (staypromo.ts)
**Strategy:** `.resort-card` + `.page-title` CSS selector parsing. 16+ known destination pages.

### Vacation Village (vacation-village.ts)
**Strategy:** ASP.NET site with `.aspx` deal pages. Dynamic pricing from data attributes. Fallback catalog of 30+ known deals.

### VacationVIP (vacationvip.ts)
**Strategy:** `#popularGrid` card extraction. Bonus item detection (gift cards, show tickets, casino chips). Destination auto-detection from deal text.

---

## Environment Variables Required

```
DATABASE_URL=postgresql://...      # PostgreSQL connection string
PAYLOAD_SECRET=...                 # Bearer token for protected APIs

# Optional (for blog syndication):
DEV_TO_API_KEY=...
HASHNODE_TOKEN=...
HASHNODE_PUBLICATION_ID=...
X_API_KEY=...
X_API_SECRET=...
X_ACCESS_TOKEN=...
X_ACCESS_SECRET=...
```

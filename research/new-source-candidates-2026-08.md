# New vacpack source candidates — 2026-08-12 research swarm (5 agents)

Net-new timeshare-preview ("vacpack") broker sites NOT already scraped, verified via page fetch
(real package price + presentation requirement confirmed unless noted). Building crawlers is a
follow-up — owner decides which to build. Dropped as already-scraped: `las-vegas-timeshare.com`
(= our `vegas-timeshare`), `staypromo.com` (= our `staypromo`).

## Ranked by incremental inventory value

| # | Site | Destinations | Example package + price | Presentation | Scrape approach | Notes / value |
|---|------|-------------|------------------------|-------------|-----------------|---------------|
| 1 | **goodtimeentertainment.com/vacation** | Vegas, Tahoe, Palm Springs, Orlando, Daytona, Williamsburg, Gatlinburg, Branson, Scottsdale, Sedona, Hawaii, Cabo | 4D/3N $199 + $100 Visa (Diamond Resorts fulfillment) | Y, 90–120 min | Cheerio-static | HIGH — broad multi-destination inventory |
| 2 | **booksi.com** (access.booksi.com landers) | Cancun, Cabo, Riviera Maya | Grand Cancun AI 5nt $299/couple; Cabo $199–399 | Y, 120 min | JS-rendered (React funnel) — browser/Playwright | HIGH — Mexico AI; carries SOT disclosure |
| 3 | **bransonreservationscenter.com** | Branson + Orlando, Williamsburg, Vegas | 4D/3N + 2 show tickets, $99 (rack $419) | Y, 120 min | Cheerio-static | HIGH — multi-dest, distinct inventory |
| 4 | **provacationgroup.com** | Cancun, Cabo, Vallarta, Riviera Maya, Cozumel, Loreto, Punta Cana, Curacao, Panama | PV all-inclusive 6D/5N $1,199 (2A+2K, transfers) | Y, 90 min "Ownership Seminar" | Wix SSR — test Cheerio, else browser | HIGH — Mexico + Caribbean AI |
| 5 | **travelbargains.org** | Atlantic City (Flagship), Orlando, San Diego, Lake Havasu, SF | AC 3D/2N from $89 (booked $169–199) + casino dinner | Y, 90–120 min | Cheerio-static (Magna Timeshare Software, client "tb") | MED-HIGH — Northeast + West |
| 6 | **vallartasales.com** | Nuevo Vallarta (Paradise Village) | AI 6D/5N $799; EP 5D/4N $349; Golf/Spa 8D/7N $989 | Y, ~120 min | Cheerio-static (WordPress) | MED — single resort family, clear pricing |
| 7 | **offers.vacationbranson.com** (+ vip.vacationbranson.com) | Branson (Thousand Hills, Stone Castle) | 4D/3N Thousand Hills $69/couple | Y, 90–120 min | Cheerio-static (FB promo funnel) | MED — Branson |
| 8 | **genesisgrouplv.com** | Branson (Oak Ridge/Great Rock), Las Vegas | 4D/3N Branson $179 (from $399); Vegas 4D/3N $199 + $50 GC | Y, 90–120 min | Cheerio-static (WordPress /activities/) | MED — Branson + Vegas |
| 9 | **poconomo.com** | Poconos PA (Pocono Mountain Villas / Exploria) | 3D/2N 1BR condo $149 | Y (length not stated; Exploria std 90–120) | Cheerio-static | MED — only net-new Poconos front-end |
| 10 | **time4avacation.com** | Williamsburg (Kings Creek), Ormond Beach, Hilton Head, Branson | Williamsburg 4D/3N $199 (73% off) | Y, 90–120 min | Cheerio-static (Momentum Ventures LLC) | MED |
| 11 | **williamsburgtickets.com** | Williamsburg (King's Creek) | 3N $199 + Busch Gardens/Colonial tix or $100 Visa | Y, 90–120 min | Cheerio-static | MED — overlaps King's Creek (Spinnaker) inventory |

### Caveated (verify before building)
- **hiltonheadforless.com** — Hilton Head, mandatory 60-min preview, age 23+/$50k income, BUT **price is quoted at booking, not printed on page** → under our DOM-verified policy it may emit 0. Skip unless a priced page is found.
- **thegotspot.com** — Sedona/Cancun/multi, $79–299, carries membership-solicitation disclosure, BUT resells the **same Global Solutions LLC "FamPak" inventory as our existing `payvibe`** → LOW incremental value (new skin over deals we already have). De-prioritize.
- **todaygetaway.com** — genuine Mexico preview agent (~$899) but no on-page presentation language (phone-qualified) — unverifiable per policy.

## New search footprints learned (reusable for future source hunts)
1. **Eligibility-boilerplate dork (highest yield):** `"must be" "25 years" income "$50,000" "4 days 3 nights"` (rotate income $50k/$60k/$75k, age 23/25/28/30). Age/income/marital qualifying language is near-identical across real vacpacks, absent on OTAs.
2. **Statutory disclosure dork:** `"this advertising material is being used for the purpose of soliciting..."` / `"soliciting sales of timeshare interests or vacation club plans"` — legally-required boilerplate every legit operator carries; clean sibling-finder.
3. **Mandatory-attendance + destination:** `"resort preview is required"` / `"vacation ownership presentation"` / `"vacation ownership seminar"` + a specific city (Hilton Head, Sedona, Puerto Vallarta, Punta Cana) cuts OTA noise.
4. **"FamPak" / "Familiarization Rate Package"** = broker jargon for preview packages (mostly Global Solutions network → dedupe against payvibe).
5. **"Magna Timeshare Software"** footprint — many independent broker landers run on Magna; the client directory at `timeshare.magna.net/clients/<id>/` enumerates operators (found travelbargains as client "tb"). Mine it.
6. **Resort-specific promo-lander pattern:** individual resorts run `{brand}sales.com` / `{brand}promo.com` landers distinct from their booking site (Paradise Village → vallartasales.com).
7. **"OFFER AVAILABLE ONLINE ONLY. CANNOT BE PURCHASED DIRECTLY WITH HOTEL"** reliably flags a broker vs. the resort's own engine.
8. **Require a literal presentation-duration phrase** (`"90 minute"`, `"120 minute"`, `"must agree to a vacation travel presentation"`) to filter OTA/rental noise.
- **FAILED footprints (don't reuse):** Shopify `/products.json` + "vacation getaway" (noise); "vacation certificate/promotional getaway reseller" (B2B gift-cert vendors, no presentation); heavy `-exclusion` operator chains (search API largely ignores them — add positive geo/eligibility terms instead).

## Recurring bug watch for these crawlers
booksi/thegotspot/genesis advertise "% off", "resort credit", and "$X Visa/gift card" alongside the
package price — target the whole-stay "from $X (/couple)" figure, NOT the credit/gift-card/discount amount
(the recurring credit-as-price parse bug).

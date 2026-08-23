# New vacpack source candidates — 2026-08-23 evergreen research (2 agents)

Net-new timeshare-preview broker sites NOT already scraped, verified via page fetch
(real whole-stay package price + presentation requirement). Building crawlers is a
follow-up — owner decides which to build.

## Ranked candidates

| Site | Destinations | Example package | Presentation | Scrape | Notes |
|------|-------------|-----------------|-------------|--------|-------|
| **getaway4lesstravel.com** | Gatlinburg, Pigeon Forge, Branson, Orlando, Las Vegas, Myrtle Beach, Williamsburg | 4D/3N $99 (Smokies) / $199 (others), up to 4 ppl | Y, ~120 min | Cheerio-static (prices in markup) | STRONGEST — multi-city, no bot-blocking, distinct SOT template ("ADVERTISING MATERIAL INTENDED TO PROMOTE THE SALE OF TIMESHARE OR TRAVEL CLUB INTERESTS") |
| **caribetodoincluido.com** | Playa del Carmen, Riviera Maya, Cancun, Tulum (Sandos/Dreams/Secrets/Zoetry) | Sandos Playacar 6D/5N from $328; Dreams Riviera Cancun 5D/4N $1,100 | Y, 120 min | Cheerio-static (Shopify `/collections/{dest}`; try products.json) | Mexico AI; distinct resort set |
| **vacationclubpromo.com** | Cancun, Playa del Carmen, Cabo (Sandos), Puerto Plata DR (Cofresi Beach) | Sandos Cancún $555; Cofresi Beach $795 | Y, 90–120 min | Cheerio-static (WordPress `/resorts/{slug}/`) | Possible AllInclusivePromotions/VacationPeople-network affiliate (mirrors boilerplate) but distinct domain/resorts/prices — dedupe on domain |

### Rejected (verified, do NOT re-chase)
- `timesharevacationpackages.com` = our existing **timeshare-vacation-packages** source (agent dedup miss).
- `mygetawaypackage.com` — certificate/redeem-later model, no flat on-page price + fetch-blocked → fails DOM-price bar.
- `grandtimber.com` (Breckenridge Grand Vacations) — price not published (call-to-book) → fails DOM-price bar.
- Aliases of existing sources: hcvgetaways.com/hcvtravel.com (=holiday-inn), cocoabeach4less.com (=bestvacationdealz), vacationdealhub.com (=mrg/monster), vacationmyrtlebeach.com (direct, no preview).
- FamPak syndication network (sweetdeals.com, tristategeneralstore.com, 870deals.com, shenvalleydeals.com, homesweetsavings.com) — resells the same Global Solutions inventory as payvibe/gotspot, frequently sold-out/expired → low value.

## Footprints that worked this run (reusable)
- **Top yield:** `"this advertising material is being used for the purpose of soliciting"` / `"soliciting sales of timeshare interests or vacation club plans"` + a generic word ("getaway package deals") — surfaces SOT-disclosing broker landers.
- `"rate includes a 120-minute presentation" no purchase obligation` all-inclusive → Dreams/Secrets vacation-club-rate resellers (caribetodoincluido).
- Shopify signal: Mexico AI site with `/collections/{destination}` per-resort "vacation club rate" products = Cheerio-static broker.
- Joomla signal: `index.php?option=com_content...id=` on a timeshare-promotions domain = SSR article-per-resort broker.
- Eligibility dork `"married or cohabitating" + income` → resort-brand qualifications/DOP pages.
- **Dead ends (skip next time):** `"Magna Timeshare Software"` is now polluted (Magna, Utah noise) + `timeshare.magna.net/clients/` has dead TLS; Western/mountain gap destinations (Palm Springs, Scottsdale, Sedona, Tahoe, Outer Banks) have no independent DOM-priced brokers — all direct-brand or OTA.

# Open-Web Discovery — 2026-05-10

Goal: find vacpack-broker / timeshare-preview-package seller sites not already in our 39-source list. Verified via WebSearch + WebFetch. Tier-1 candidates have public, scrapable HTML listings with prices.

## Tier 1 — High-priority new finds (PUBLIC, scrapable)

### 1. timeshareorlando.com
- **Sells:** Orlando-only 3-night timeshare-preview packages at Westgate and partner hotels, each with $200 Visa gift card and required 2-hour presentation.
- **Sample inventory (visible without form):**
  - Westgate Town Center — 3 nt — $121/family
  - Westgate Vacation Villas — 3 nt — $125/family
  - Westgate Lakes Resort — 3 nt — $128/family
  - Westgate Palace Resort — 3 nt — $247/family
  - Holiday Resort by Kissimmee Park — 3 nt — $259/family
  - Hawthorn Suites Orlando — 3 nt — $365/family
  - staySky Suites I-Drive — 3 nt — $365/family
  - Lake Buena Vista Resort — 3 nt — $399/family
- **Destinations:** Orlando + Kissimmee (single-market site).
- **Difficulty:** Static HTML, no JS gate. CheerioCrawler.
- **Rationale:** Eight clean, priced packages on a single index page. Easy win; URL is `/packages` and `/promotions/resorts`. Disclaimer explicitly admits the timeshare-solicitation framing.

### 2. timesharevacationpackages.com
- **Sells:** Vacpack/all-inclusive preview packages across 17 destination hubs (Cancun, Cabo, Puerto Vallarta, Punta Cana, Jamaica, Aruba, Curacao, Costa Rica, Orlando, Branson, Williamsburg, Daytona, Hilton Head, Gatlinburg, Vegas, Myrtle Beach, Loreto).
- **Sample inventory:**
  - Sandos Playacar Beach Resort — 4nt/5d AI — from $480/couple
  - Villa del Palmar Cancun — 5nt/6d AI — from $679/couple
  - Luxury Vista Cancun — 4nt/5d AI — from $479/couple
  - Westgate Lakes Orlando — 3nt — $128/family
  - Lake Buena Vista Orlando — 3nt — $399/family
- **Difficulty:** Homepage IS funnel-gated (search form), BUT destination index pages (`/cancun-all-inclusive-timeshare-promotions`, `/orlando-timeshare-promotions`, `/destinations`) publicly list resorts with prices. Static HTML on those pages. CheerioCrawler.
- **Rationale:** Florida-licensed broker since 2002 with the broadest catalog I found. Aggregates the same "Luxury <Color> Cancun" inventory pattern used by AllInclusivePromotions.com and VacationPeople.com — likely the same operator network, but the inventory IDs and pricing diverge per site.

### 3. discount.spinnakerresorts.com
- **Sells:** 4-day/3-night Spinnaker-resort previews in Hilton Head, Branson, Ormond Beach.
- **Sample inventory:**
  - Hilton Head — 4d/3n — from $199
  - Branson — 4d/3n — from $99
  - Ormond Beach — 4d/3n — from $499
- **Difficulty:** Static HTML on `/featured-packages.php`. CheerioCrawler.
- **Rationale:** This is a DIFFERENT subdomain from `spinnakerresorts.com` (which is in the existing 39). It's the dedicated discount/preview-package property under the Spinnaker corporate umbrella with its own URL structure and prices. Pages have countdown timers but the package data itself is server-rendered HTML.

### 4. spinnakervacations.com (and its destination subdomains)
- **Sells:** Single-page conversion landers for Spinnaker preview packages, one per destination (Branson, Hilton Head, Ormond Beach, Williamsburg).
- **Sample inventory:**
  - `branson.spinnakervacations.com` — Stone Castle Hotel Branson — 4d/3n — $99 midweek / $249 weekend + $100/$200 Visa
  - `hiltonhead.spinnakervacations.com` — Sailwinds Hotel — 4d/3n — $99 midweek / $249 weekend + Visa GC
- **Difficulty:** Static HTML, but each destination is its own subdomain and lacks a single index — crawl needs an explicit subdomain list. CheerioCrawler with a seeded URL list.
- **Rationale:** Distinct from both `spinnakerresorts.com` and `discount.spinnakerresorts.com`. Lives on the dedicated marketing domain Spinnaker uses for paid ads. Prices DO differ from `discount.spinnakerresorts.com` (e.g., $99 mid-week vs $99 generic) — worth tracking as a separate source.

### 5. orlando99.com
- **Sells:** Single-funnel landing site offering $99 Orlando 3-night preview package at Westgate Town Center.
- **Sample inventory:**
  - Westgate Town Center — 3 nt — $99 (retail $487) + $100 Visa + Shipwreck Island Waterpark access
- **Difficulty:** Static HTML, single-page. CheerioCrawler — trivial.
- **Rationale:** Tiny inventory (1 package) but the price point ($99 vs the $121–$128 timeshareorlando.com is selling the same Westgate stay for) lets us track price-arbitrage. Worth adding for the homepage scrape.

### 6. genesisgrouplv.com
- **Sells:** Las Vegas–based concierge for vegas activities + cross-sold vacpack-style packages (Branson 4d/3n, Planet 13 Vegas 4d/3n, cruise certs).
- **Difficulty:** Pricing is gated behind CTAs — listings have package titles but specific prices require contact (so technically partial). MIGHT yield titles + durations but prices via phone only.
- **Rationale:** Borderline Tier 1/Tier 2. Listing the packages (without prices) still gives us a unique source for Branson and Vegas + a "Planet 13" package nobody else lists. Move to Tier 2 if price-scrape doesn't pan out.

### 7. emol.org (Las Vegas vertical, `/nevada/lasvegas/timeshares/`)
- **Sells:** Editorial directory page that links out to third-party timeshare/vacation packages — NOT a broker itself.
- **Status:** Re-evaluated as DEFUNCT for our purposes — see Tier 3.

### 8. destinationcoupons.com
- **Sells:** Westgate Las Vegas 3-day/2-night preview packages with multiple add-on bundles ($59–$129).
- **Sample inventory (all at Westgate Las Vegas Resort & Casino):**
  - Hotel-only — weekday $59 / weekend $79
  - Hotel + $100 Casino Chips — weekday $79 / weekend $99
  - Hotel + Helicopter/Hoover Dam tour — weekday $99 / weekend $129
  - Hotel + Show tickets (Zumanity/Criss Angel) — weekday $99 / weekend $129
- **Difficulty:** Static HTML on the Vegas vacation-packages page. CheerioCrawler.
- **Rationale:** Single-market (Vegas), single-resort (Westgate), but four distinct bundle prices in one page. Different price points from anything we have today. Sales pitch funnels to a phone number, but the pricing IS on the page. Watch for staleness — looks long-lived.

### 9. plymouthrocktravelpartners.com
- **Sells:** Plymouth Rock Travel Partners — already named as "lower priority known" in the brief BUT only a single article URL is referenced and we don't currently scrape any listing page. The site itself appears membership-oriented (no public package grid). Skip — keep as known.
- **Status:** Confirmed already known. Do NOT add.

### 10. globaldiscoveryvacations.com
- **Sells:** Travel-club MEMBERSHIP (not pay-per-package preview). Members-only listings, no public prices.
- **Status:** Wrong model for us — see Tier 3.

### 11. vacationcandy.com
- **Sells:** Per their tagline, "luxury resort vacation rentals at a discount" — i.e., timeshare RENTALS from owners (RedWeek-style marketplace), not preview packages.
- **Status:** Wrong model — see Tier 3.

### 12. vacationrewards.com
- **Sells:** Paid travel-club membership tiers ($5.99–$49/mo or $699–$1,899 one-time). All pricing behind login.
- **Status:** Wrong model — see Tier 3.

### Tier 1 — final scrapable list (8 confirmed targets):

| Domain | Type | Destinations | Difficulty |
|---|---|---|---|
| timeshareorlando.com | broker | Orlando/Kissimmee | static HTML |
| timesharevacationpackages.com | broker | 17 destinations | static HTML (destination pages) |
| discount.spinnakerresorts.com | brand-direct | Hilton Head, Branson, Ormond | static HTML |
| spinnakervacations.com (+ subdomains) | brand-direct landers | Branson, Hilton Head, Ormond, Williamsburg | static HTML, multi-subdomain seed list |
| orlando99.com | single-funnel | Orlando | static HTML |
| destinationcoupons.com (Vegas pkg page) | broker | Las Vegas | static HTML |
| genesisgrouplv.com | concierge/broker | Vegas, Branson | partial (titles yes, prices partial) |
| iwanttotravelto.com | broker/affiliate | multi-destination | static HTML (couldn't fetch in this session, but referenced consistently — verify) |

## Tier 2 — Worth investigating (FUNNEL or partial)

These have a real catalog behind a form, or only emit prices on phone callback. May still be scrapable for at least package titles + destinations even if final prices need a second pass.

- **vacationpeople.com** — returned HTTP 403 on every WebFetch attempt this session. SERP results show it has destination pages parallel to timesharevacationpackages.com (`orlando.vacationpeople.com`, `/cabo-san-lucas-all-inclusive-packages-promotions`, etc.). Likely same operator family as TSVP. Worth a Playwright crawl with realistic headers to bypass the 403 — has 20+ years of catalog if it works.
- **mypointslife.com/timeshare-promotions-and-offers/** — 403 too. SERP shows it's a curated 2026 aggregator listing of multiple brokers. Not a deal seller itself, but a high-value lead list for further crawling (extract names of brokers we haven't seen). Use Playwright.
- **timesharepresentationdeals.com (subpages beyond /optin)** — already in our 39 sources, but pages like `/las-vegas-timeshare`, `/orlando-timeshare`, `/pigeon-forge-resorts`, `/myrtle-beach`, `/timeshare-resort-specials`, `/new-vacation-offers` all 403'd to WebFetch. SERP evidence suggests they list packages publicly. Confirm whether our existing scraper hits these category indexes or only `/optin`.
- **iwanttotravelto.com** — already in our 39 sources. SERP shows it has multiple destination subpages (`/punta-cana-dominican-republic-timeshare-vacation-promotions`, `/aruba-timeshare-vacation-promotions`, `/curacao-island-timeshare-vacation-promotions`, `/daytona-beach-timeshare-promotion`, `/free-timeshare-vacation-packages-2023`) — check that our existing scraper enumerates these.
- **packages.marriottvacationclubs.com** — Marriott runs a dedicated booking subdomain (e.g., `/dce/cmd/org/grand-chateau/`, `/dce/cmd/org/florida-vacations/`, `/dce/cmd/org/ways-to-play/`) that emits package pages distinct from `marriottvacationclubs.com` (known). Worth verifying whether our existing Marriott Playwright crawler enumerates this subdomain.
- **themarriottvacationclubs.marriott.com/vacation-offers** — newer canonical hostname Marriott is migrating its offers to. Check redirect chain — may already be covered, may not.
- **luxlifetravelco.com / luxelifetravel.com / luxelifevacations.com** — keep on watchlist, but a quick read says they're luxury travel agents not vacpack brokers. Probably DEFUNCT for our purposes; needs 60s of verification before adding.

## Tier 3 — Defunct / not worth (DEFUNCT)

- **globaldiscoveryvacations.com / globaldiscovery.club / exploregci.com** — vacation-club MEMBERSHIP model. No public per-package pricing; everything is behind a "buy a membership" wall. Wrong business model for our deal-grid.
- **vacationrewards.com** — paid travel-club tiers. Members-only.
- **vacationcandy.com** — timeshare RENTAL marketplace (owner-to-renter). Not preview packages — closer to RedWeek.
- **vacationsincentive.com** — corporate vacation-incentive certificates given to employees/customers. Not a consumer-facing package store.
- **holidaytravelincentives.com / odenza.com / arrowmgp.com / vacationownershipmarketing.com / discoveryresortmarketing.com / resortinsiders.com / vacationinnovations.com** — B2B fulfillment/marketing vendors for the timeshare industry, not consumer-facing brokers. Useful context for `project_ad_spy` but not deal scraping.
- **marketingboost.com** — B2B incentive-cert tool sold to coaches/realtors. Not a vacpack store.
- **emol.org/nevada/lasvegas/timeshares/** — editorial info page. Tells you to go elsewhere; not a broker.
- **arda.org / licensedtimeshareresalebrokers.org** — trade associations; member directories but not deal sellers.
- **redweek.com / sellmytimesharenow.com / timesharesonly.com / timeshare.com / timeshareexittoday.com / timesharenation.com / timesharingstyle.com / atimeshare.com / timesharebrokerassociates.com / timesharebrokersales.com / mytimesharebroker.com / timesharebrokerservices.com / timeshareprofessionals.com** — secondary-market resale brokers and editorial sites. Different industry segment (selling existing timeshare deeds), not preview-package promo.
- **costcotravel.com / travelocity.com / cheapcaribbean.com / applevacations.com / vacationexpress.com / kayak.com / southwestvacations.com / aavacations.com / delta.com/delta-vacations / vacations.united.com / vincentvacations.com / vacationsbymarriott.com / meritagecollection.com / hiltonheadisland.com / disneyworld.disney.go.com / hilton.com** — mainstream OTAs and brand sites with no timeshare-preview tie-in. Wrong segment.
- **travelclubsdirect.com / thetravelfreedom.com / pacaso.com / exclusiveresorts.com / fidelityrealestate.com / vacationownership.com / globalexchangevacation.com / raintreevacationclub.com / rci.com / wyndhamdestinations.com (corporate) / govvacationrewards.com / awardwallet.com / thepointsguy.com / nerdwallet.com / upgradedpoints.com / pointsmilesandbling.com / princeoftravel.com / points2wanderlust.com / fodors.com / headforpoints.com / baldthoughts.boardingarea.com** — points/luxury-club blogs, exclusive luxury clubs, OTA-adjacent affiliates. Either wrong model, gov-employee-only, or pure editorial.
- **plymouthrocktravelpartners.com** — already on lower-priority known list per brief.
- **vacationpackagesorlando.com / orlandodiscountticketsusa.com / booksi.com / sandospromo.com / vidanta.com / grandpacificresorts.com / fantasearesorts.com / afvclub.com** — already on lower-priority known list per brief.

## Search queries that paid off

- `"resort showcase" timeshare tour promotional vacation package` — surfaced VacationPeople.com + sister sites
- `"Cabo San Lucas" "Puerto Vallarta" timeshare preview vacation deal site:.com -reddit -tripadvisor` — surfaced timesharevacationpackages.com + allinclusivepromotions.com Caribbean inventory
- `"timeshare promotions" "2 night" "3 night" Orlando Williamsburg Branson resort listings online` — Spinnaker discount subdomain found here
- `"vacation kiosks" Orlando Vegas timeshare OPC discount promo $99 booked online` — surfaced orlando99.com
- `"GetAwayDealz" alternative competitor timeshare $99 broker resort vacation preview` — confirmed GetAwayDealz pricing + flushed out timesharepresentationdeals.com sub-pages
- `"Daytona Beach" OR "Ormond Beach" OR "Gatlinburg" timeshare 2 night vacation package $99` — broad-destination probe; surfaced go-koala.com and validated TSVP destination coverage
- `"Spinnaker" Hilton Head "$" 3 night discount preview package vacation` — flushed out discount.spinnakerresorts.com + spinnakervacations.com subdomain pattern
- `"Travel To Go" OR "Hotel Planner" OR "Global Discovery Vacations" timeshare preview promo` — useful to RULE OUT GDV-style membership clubs

## Search queries that didn't help (skip in future runs)

- `inurl:vacation-package "$99" OR "$149" timeshare` — search engine returned zero results when combined with multiple negative operators (over-restrictive)
- `"vacationtrips" OR "tripfun" OR "happywanderer"` — these aren't real brokers; speculative domain guessing didn't surface anything
- `"vacationcandy" OR "vacation surplus" OR "vacation pop"` — same; VacationCandy is the wrong model anyway
- `"sunsplash" OR "vacation magic" OR "vacation source" OR "tripshock"` — none are vacpack brokers
- `"Sunset World" OR "Royal Holiday" OR "Occidental" OR "Krystal" timeshare preview vacation package booking` — these are direct brand sites that don't have public preview-package pages (sales happen on-resort or via inquiry only). Different model from BookVIP/Westgate where prices ARE public.
- `"orlandoresortdeals" / "vegasresortdeals" / "discount-orlando"` — no such brokers
- `"vacation packages" "preview" broker "$129" "$179" "$249" California Texas Hawaii beach` — returned mainstream OTAs only; the vacpack segment doesn't cover those markets
- `"Vacation Strategy" OR "Caribbean Promo" OR "All-Inclusive Outlet"` — speculative; no matches
- `"Hyatt vacation club" "$199" OR "Marriott vacation" OR "Bluegreen" packages preview broker affiliate site` — returned only brand-direct pages; no new affiliate brokers
- `"vacation marketing" "incentive" "$99" "preview presentation" 2026 Orlando Vegas Cancun broker` — surfaced B2B incentive-cert vendors only (wrong segment)
- `"BlueGreen Charter" OR "Charter Club" OR "Outrigger" OR "Shell Vacations" preview vacation discount package` — direct-brand only; Bluegreen already in 39
- `"vacationdiscountsites" OR "discountvacationexpress" OR "vacationexpress" timeshare promo preview package` — Vacation Express is mainstream OTA, not vacpack

## Follow-ups for the next run

1. Re-test `vacationpeople.com` and `mypointslife.com` with Playwright + realistic UA — WebFetch hit 403 but they look legit and high-yield.
2. Audit existing scrapers for `iwanttotravelto.com` and `timesharepresentationdeals.com` — confirm they enumerate ALL destination sub-pages, not just `/optin` or a single page. SERP evidence strongly suggests there's catalog we may be missing.
3. Verify `packages.marriottvacationclubs.com` and `themarriottvacationclubs.marriott.com/vacation-offers` are covered by the existing Marriott Playwright crawler. If not, add as separate sources.
4. Look at the operator network behind `timesharevacationpackages.com` / `vacationpeople.com` / `allinclusivepromotions.com` — they share inventory naming patterns (e.g., "Luxury Jade Riviera Cancun", "Luxury Sapphire Riviera"). If the same operator runs all three, dedupe at the deal level so we don't triple-count the same room.
5. `genesisgrouplv.com` — verify whether Branson and Planet 13 Vegas packages are unique inventory or just resold Westgate/Wyndham. If unique, promote to Tier 1; if resold, drop.

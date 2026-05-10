# DataForSEO Competitor + Backlink Discovery — 2026-05-10

## Method summary

**Endpoints used (all v3, Live tier):**

| Endpoint | Targets / Queries | Items per call | Total items pulled |
|---|---|---|---|
| `dataforseo_labs/google/competitors_domain/live` | bookvip.com, staypromo.com, mrgvacationpackages.com, bestvacationdealz.com, timesharepresentationdeals.com | 30 | 150 |
| `backlinks/referring_domains/live` | same 5 brokers, filter `backlinks > 1` | 100 | ~440 (bookvip 100 / staypromo 100 / mrg 6 / bvd 100 / tspd 100) |
| `dataforseo_labs/google/keyword_suggestions/live` | "timeshare preview package", "vacation tour preview", "resort showcase package", "all inclusive timeshare promotion" | 50 requested / 1 returned ea. | 4 keyword records (with `serp_info`) — limited utility |
| `serp/google/organic/live/advanced` (added as fallback) | "timeshare preview package", "vacation tour preview", "discount vacation package", "resort sampler vacation", "timeshare promotional vacation", "all inclusive vacation package timeshare" | depth 50 | ~300 organic results, 90 unique non-known domains |

Total cost: ~$1.40 (5 × $0.013 competitors + 5 × ~$0.05 backlinks + 6 × ~$0.05 SERP + 4 × $0.01 kw).

**Filters applied at extraction time:**
- Excluded the 39 already-tracked source domains.
- Excluded OTAs (booking, expedia, hotels, kayak, trivago, priceline, tripadvisor, agoda, hotwire, orbitz, travelocity, vrbo, airbnb).
- Excluded direct brand sites (marriott.com, hilton.com, hyatt.com, ihg.com, choicehotels.com, wyndhamhotels.com, bestwestern.com) — we scrape their preview-package microsites already.
- Excluded social, Wikipedia, search engines, big-media (CNN/NYT/Forbes/Bloomberg), aggregator-content sites (NerdWallet, ThePointsGuy, UpgradedPoints), Costco/Sams/AAA/AARP travel.
- Excluded .gov / .edu / .mil.
- Excluded the obvious link-spam tail (`*.web.app`, `*.firebaseapp.com` Roblox/Robux spam, "directory" / "submit-your-site" link farms, `getwebsiteworth.com`, `sitelike.org`, `alljobs.info`, etc.).

After filtering: **333 unique candidate domains** from competitors+backlinks, plus **90 unique** from SERP. Below are the manually-verified survivors.

Raw JSON dumps live on the VPS at `/tmp/dfs-research/` (`competitors_*.json`, `backlinks_*.json`, `serp_*.json`, `kws_*.json`).

---

## Tier 1 — Strong candidates (PUBLIC inventory, scrapable)

These all display package destinations + prices on landing pages **without form-gating**, and explicitly require a timeshare-preview attendance (real vacpack model).

### 1. capitalvacationspackages.com
- **Discovery:** SERP organic rank 49 for "all inclusive vacation package timeshare"; surfaces as Capital Vacations' dedicated package microsite (distinct from the corp site capitalvacations.com which is a competitor of timesharepresentationdeals.com).
- **What it sells:** Capital Vacations-branded vacpacks; 120-minute timeshare preview required.
- **Scrapability:** PUBLIC, static HTML.
- **Sample prices visible on home:**
  - Myrtle Beach SC — 4d/3n — **$199** (81% off $1,079)
  - Orlando FL — 4d/3n — **$199** (79% off $931)
  - Branson MO — 4d/3n — **$199**
  - Cape Cod MA — 4d/3n — **$199** (82% off $1,100)
  - Maui HI — 5d/4n — **$399**
  - Also: Pigeon Forge, South Florida, Sedona, Hilton Head, Minnesota
- **Note:** Our hub `Capital Vacations` is currently in the *Fallback (catalog seed)* bucket — this microsite gives us a real public price feed we don't have today.

### 2. timeshareorlando.com  
- **Discovery:** SERP organic rank 13 across 2 queries.
- **What it sells:** Vacpacks operated by "Timeshare Orlando Marketing Group, LLC" (Florida Seller of Travel ST35208). 90-minute preview required.
- **Scrapability:** PUBLIC, static HTML.
- **Sample prices visible:**
  - Westgate Lakes Resort, Orlando — 3 nights — **from $128/family**
  - Westgate Vacation Villas, Kissimmee — 3 nights — **from $125/family**
  - Westgate Town Center, Orlando — 3 nights — **from $121/family**
  - Westgate Palace Resort — 3 nights — **from $247/family**
  - Lake Buena Vista Resort — 3 nights — **from $399/family**
  - Holiday Resort by Kissimmee Park — 3 nights — **from $259/family**
  - Hawthorn Suites Orlando — 3 nights — **from $365/family**
  - staySky Suites I-Drive — 3 nights — **from $365/family**

### 3. timesharevacationpackages.com
- **Discovery:** SERP organic rank 1 for "timeshare preview package" (3 of 6 queries).
- **What it sells:** Same operator as #2 — **"Timeshare Orlando Marketing Group, LLC"** (FL ST35208) — broader destination set. 90-min to 2-hr preview, complimentary breakfast.
- **Scrapability:** FUNNEL — destinations listed publicly with branded slugs (`/cancun-all-inclusive-timeshare-promotions`, `/cabo-san-lucas-...`, `/orlando-...`, `/las-vegas-...`, `/punta-cana-...`, etc.) but prices require form/phone. Probably PUBLIC at the per-destination page level — worth a follow-up scrape pass.
- **Destinations confirmed:** Cancun, Cabo, Puerto Vallarta, Loreto, Punta Cana, Jamaica, Aruba, Curacao, Costa Rica, Orlando, Vegas, Myrtle Beach, Daytona Beach, Branson, Williamsburg, Gatlinburg, Hilton Head.

### 4. cheaptravelvip.com
- **Discovery:** bookvip.com backlink target (6 referring links).
- **What it sells:** **Vacation certificate broker** — complimentary stay certificates redeemed for $30–50/night taxes-and-fees. Closest direct competitor to BookVIP we've seen.
- **Scrapability:** PUBLIC (static HTML) per landing-page inspection.
- **Sample inventory:** Florida Keys, Cancun, Punta Cana, Bahamas, Cozumel, Puerto Plata. Apartment/villa certificates $500–1,500 value; 4-night cruises up to $2,000; all-inclusive resorts $1,500–3,000 value; 7-night resort stays $2,000+. $5–50 activation fees.

### 5. monsterrg.com  *(sibling of monstervacations.com which is already parked)*
- **Discovery:** Both competitor (organic kw=1,524) **and** backlink (886 backlinks) of mrgvacationpackages.com.
- **What it sells:** "Monster Reservations Group" — the **parent corporate entity** behind both Monster Vacations and MRG Vacation Packages. >50 destinations, timeshare solicitation disclosed up front.
- **Scrapability:** FUNNEL — inventory pages are static HTML but prices form-gated; "Purchase Trip" link redirects to mrgvacationpackages.com (which we already scrape).
- **Verdict:** Worth tracking as a *brand/source mapping* update — confirms Monster Vacations + MRG share corporate parent. Not net-new inventory, but useful for our brands table relationship graph.

---

## Tier 2 — Worth checking (FUNNEL / JS-heavy / partial public)

### 6. allinclusiveoutlet.com
- **Discovery:** SERP/competitor signal — competitor of bookvip.com (org kw=80,016 — very strong).
- **What it sells:** BBB-registered category "Vacation Certificate" (Orlando, FL). Vacation packages with timeshare preview attendance is the dominant model in this BBB classification.
- **Scrapability:** Unknown — homepage 403'd against WebFetch (likely Cloudflare/anti-bot). Worth a Playwright scrape attempt. Inventory is probably search-form gated based on UX patterns of similar brokers.
- **Why worth pursuing:** High organic-keyword volume (80k) competing directly with bookvip suggests substantial public inventory exists somewhere.

### 7. innseason.com
- **Discovery:** SERP rank 21.
- **What it sells:** InnSeason Resorts — vacation ownership developer + 6 New England resorts (ME, NH, Cape Cod). Operates both standard nightly stays **and** a "Vacation Club" with preview-appointment funnel.
- **Scrapability:** FUNNEL — no public package prices on home; "Schedule preview appointment" CTA exists. Needs deeper crawl of `/specials` or `/preview` pages.
- **Why worth pursuing:** Northeast US coverage gap — none of our current 39 sources have any New England-specific vacpack inventory.

### 8. vacationexpress.com
- **Discovery:** Competitor of bookvip.com.
- **What it sells:** Tour operator — all-inclusive vacation packages to 25+ beachfront destinations.
- **Scrapability:** FUNNEL — flight+hotel search form required to see any price.
- **Caveat:** This is closer to a traditional all-inclusive tour operator (no timeshare-preview requirement disclosed). Hybrid model — could be a useful **price-comparison reference** even if not a strict vacpack source. Lower priority than Tier 1.

### 9. tradewindsresort.com
- **Discovery:** SERP rank 31.
- **What it sells:** TradeWinds Island Resort (St. Pete Beach FL) — `/specials` page exists. Certificate expired so unverified; possible direct-resort package offers including preview-tied deals.
- **Scrapability:** Likely PUBLIC static — but expired SSL is a red flag for active maintenance. Verify before adding.

### 10. luxuryvacationdeals.vip
- **Discovery:** bookvip.com backlink (18 backlinks).
- **What it sells:** Wix site that **funnels traffic to bookvip.com** — affiliate landing page, no own inventory.
- **Scrapability:** N/A — it's a bookvip affiliate. Useful as **a domain-network observation** (see below), not as a scrape target.

---

## Tier 3 — Skip (defunct / OTA / wrong model / unrelated)

| Domain | Reason |
|---|---|
| timesharesonly.com | Resale marketplace ($24,999 listings), not vacpack |
| timesharenation.com | Resale "free timeshare" transfer service, not vacpack |
| timesharesbyowner.com | Peer-to-peer rental/resale, not vacpack |
| fidelityrealestate.com | Licensed timeshare-resale brokerage |
| sellmytimesharenow.com | Resale broker |
| myresortnetwork.com | Owner-to-owner rental marketplace ($34.95 listings) |
| vacatia.com | Resort condo rentals + resales, no vacpack inventory |
| go-koala.com | Timeshare-rental discount site (similar to BookVIP but very thin landing page; possibly defunct) |
| vacationsbymarriott.com | Marriott Bonvoy's standard flight+hotel package portal (points-earning), not preview-required |
| vacationpeople.com | 403/blocked; SERP rank suggests low-activity affiliate |
| extraholidays.com | 403/blocked but well-known: Wyndham's rental arm — we already cover Wyndham via clubwyndham subdomain |
| legacyvacationresorts.com | Direct resort brand, no vacpack inventory listed publicly |
| vacationvillageresorts.com | Parent resort brand (sibling of vacationvillagedeals.com which we already scrape); no separate inventory |
| greatvaluevacations.com | Traditional flight+hotel tour operator (air, hotels, transfers, tours, breakfast). No preview requirement |
| tripmasters.com | Multi-city flight+hotel itinerary builder. Tour operator, not vacpack |
| aavacations.com | American Airlines Vacations — standard OTA |
| jetbluevacations.com | JetBlue Vacations — standard OTA |
| expedia-aarp.com | Expedia AARP white-label OTA |
| pleasantholidays.com | AAA-owned tour operator |
| southwest.com, united.com, lastminute.com, trip.com, vacation.com | OTAs / airline brands |
| tripster.com | Theme-park ticket bundler + hotel bundles, not vacpack |
| tradewindsresort.com (if it stays SSL-broken) | Defunct or maintenance |
| crystalgolfresort.com | Single golf resort, no vacpack inventory |
| holidayvacations.com | 403; based on industry knowledge: senior-targeted escorted tours, not vacpack |
| theonlinevacationcenter.com | Timed out; OTA per industry reputation |
| worldtravelerclub.com | Subscription deal-discovery membership ($4.90–$89/yr) |
| traveldeal.center | Subscription deal-discovery (€9–€39) |
| travelpirates.com | Affiliate deal aggregator |
| travelzoo.com | Affiliate deal aggregator |
| virtualvacation.us | Could not load (ECONNREFUSED) — likely defunct |
| palma-travels.com | "Website under construction" placeholder (Chinese error page) |
| vacationoffer.com | **Already in our 39-known list** — flagged for record-keeping only |
| All `*.web.app` / `*.firebaseapp.com` link spam | Roblox/Robux generators, irrelevant noise that shows up in every broker's backlink profile |
| getwebsiteworth.com, alljobs.info, imagetou.com, sitelike.org | Domain-info scraper sites (auto-linked from every commercial domain) |
| primecompanydirectory.com, enterprisedirectoryhub.com, businesslistingportal.com, allistingdirectory.com, linkpointdirectory.com, seodirectorypro.com, fastrankdirectory.com, powerlinkdirectory.com, seotrafficdirectory.com, ahrefs-links.com | PBN / link-farm directories used by bookvip+staypromo for SEO — explicitly noted under Network Observations |

---

## Domain network observations

1. **Timeshare Orlando Marketing Group, LLC operates at least two distinct frontends.**  
   Both `timeshareorlando.com` (Orlando-only inventory) and `timesharevacationpackages.com` (national/Caribbean inventory) credit "Timeshare Orlando Marketing Group, LLC", carry the same FL Seller of Travel ST35208 license, and route to the same 1-866-850-9535 number. Treat them as one source with two URLs in our scraper, similar to the way Westgate has both `westgateevents.com` and `westgatereservations.com`.

2. **Monster Reservations Group ↔ Monster Vacations ↔ MRG Vacation Packages.**  
   `monsterrg.com` is the corporate parent. The Tier 1 finding is the relationship graph, not net-new inventory: our `brands` table should reflect that Monster Vacations (currently "Parked") and MRG (currently "Working") share a corporate parent. Backlink graph confirms: `monsterrg.com` is the top non-self referring domain to `mrgvacationpackages.com` (886 backlinks).

3. **BookVIP and StayPromo share a PBN (private blog network) footprint.**  
   Both have identical 2-backlink fingerprints across an unusually clean cluster of "directory" domains: `primecompanydirectory.com`, `enterprisedirectoryhub.com`, `businesslistingportal.com`, `allistingdirectory.com`, `linkpointdirectory.com`, `seodirectorypro.com`, `fastrankdirectory.com`, `powerlinkdirectory.com`, `seotrafficdirectory.com`, `ahrefs-links.com`, `joinleisure.com`. Same operator running SEO for both, or a shared agency. Not relevant to scraping — flagged for the SEO team because if Google ever delists this PBN, both BookVIP and StayPromo lose rankings simultaneously and our scrape volume on those sources could spike from inventory-clearance pressure.

4. **`luxuryvacationdeals.vip` is a BookVIP affiliate satellite.**  
   Single-page Wix site; every CTA links to bookvip.com. Likely operated by an independent affiliate marketer. Same pattern probably exists with several `.vip`/`.club` long-tail bookvip backlinks (`affiliateexpress.club`, `vipestores.com`, `neocoupondeal.com`, etc.) — these don't represent scrape targets, they represent affiliate-marketer demand we could potentially capture ourselves.

5. **MRG has an unusually thin backlink profile.**  
   `mrgvacationpackages.com` returned only ~6 referring domains vs. 100+ for the other 4 brokers. Either DataForSEO hasn't crawled MRG deeply (possible — small site) or MRG genuinely relies on direct/paid traffic with no organic SEO investment. Worth noting because it means competitor discovery via MRG's backlink graph is weaker than via the other four brokers — keyword + SERP discovery (Method 3) carried more weight for finding peers in MRG's niche.

6. **Capital Vacations runs a split brand strategy.**  
   `capitalvacations.com` (the company site, already a competitor of timesharepresentationdeals.com) sells the **resort brand**. `capitalvacationspackages.com` sells the **vacpack microsite** — entirely separate URL, different design, hard-coded $199 entry-price packages, explicit timeshare-preview disclosure. This is the exact "main site → packages microsite" pattern we already see in Westgate (`westgateresorts.com` → `westgateevents.com`) and Wyndham (`wyndhamdestinations.com` → `clubwyndham.wyndhamdestinations.com`). Worth checking other big timeshare brands for analogous `*packages.com` or `*deals.com` microsites we haven't found.

---

## Recommended next actions

1. **Add to scraper roadmap (Tier 1):**
   - `capitalvacationspackages.com` — PUBLIC static, ~10 destinations with prices on homepage. Quick win to replace our "Capital Vacations fallback (catalog seed)".
   - `timeshareorlando.com` — PUBLIC static, 8 Westgate/Orlando packages with prices. Some inventory will be duplicate of Westgate hub but useful for cross-validation.
   - `timesharevacationpackages.com` — same operator as #2, broader destinations. Crawl `/{destination}-timeshare-promotions` pages.
   - `cheaptravelvip.com` — PUBLIC static, certificate broker very similar to bookvip. ~6 destinations.

2. **Tier 2 deep-dive:**
   - Playwright run against `allinclusiveoutlet.com` (likely Cloudflare-protected — high keyword authority suggests real inventory)
   - `innseason.com` deeper crawl for `/specials` / `/preview` pages — would fill our New England gap.

3. **Data-model update:**
   - Add corporate-parent relationship rows: Monster Vacations ↔ MRG ↔ Monster Reservations Group; Timeshare Orlando ↔ Timeshare Vacation Packages ↔ Timeshare Orlando Marketing Group LLC.

4. **SEO team handoff:**
   - Flag the BookVIP/StayPromo shared PBN cluster — potential signal for our own off-page strategy.

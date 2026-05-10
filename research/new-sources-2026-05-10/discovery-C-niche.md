# Niche / Affinity / Regional Discovery — 2026-05-10

Research target: vacpack programs we don't already track, with focus on **affinity networks** (military, member-clubs, employee perks) and **regional / independent operators** that fall outside the major brokers.

Already excluded: all 39 currently-tracked sources + the 9 explicitly skipped lower-priority sites (afvclub.com, sandospromo.com, vidanta.com, etc.).

---

## Tier 1 — Scrapable affinity / regional finds

| Domain | Segment | What they sell | Scrapability | Rationale |
|---|---|---|---|---|
| **timesharevacationpackages.com** | Regional aggregator | Multi-destination broker reselling preview packages across Branson, Gatlinburg, Daytona, Myrtle Beach, Williamsburg, Hilton Head, Cancun, Cabo, PV, Orlando, Vegas, Loreto, Punta Cana, Montego Bay, Aruba, Curacao, Costa Rica. Resort tiers: Westgate, Sandos, Krystal, Holiday Inn, Best Western, Wyndham. | CMS-rendered HTML (Yootheme/Joomla); dynamic but server-rendered — Cheerio should work | One of the largest non-tracked aggregators in the niche. Covers many destinations and brands. Public pricing, listing pages per destination + per resort. Closest analog to bestvacationdealz/iwanttotravelto in scope. |
| **vacationpeople.com** | Regional aggregator | Same model as above — preview packages across Branson, Gatlinburg, Daytona, Williamsburg, Hilton Head, Cancun, Cabo. Multiple resort listings per destination. | Cloudflare 403 on direct fetch — requires Playwright + browser fingerprint. Sister project to vacationsourcetimeshare.com | Active competitor with curated by-destination directory pages. Worth scraping for cross-broker price comparison. |
| **vacationplay.com** | Regional (Hilton Head) | Direct broker for Palmera Vacation Club preview packages on HHI. $249 for 3D/2N + tour. Has /packages, /vacation-timeshare, /vacation-checkin paths. | Server-rendered classic ASP/PHP site — Cheerio | The customer-facing landing site for Palmera Vacation Club's preview tour funnel. Not tracked. ~400k families serviced. |
| **hiltonheadforless.com** | Regional (Hilton Head) | Resort Source Timeshare Resales offering 2N/3D and 3N/4D preview packages with 60-min sales presentation. .aspx pages. | ASP.NET, static HTML output — Cheerio | A second independent HHI preview broker, distinct from Palmera. Established 1983, ~$50k income threshold. |
| **hiltonheadislanddeals.com** | Regional (Hilton Head) | Palmera Vacation Club preview package terms + booking. Standard $99-$479/night packages tied to 90-min tour. | Static HTML — Cheerio | A third HHI-focused subdomain in the Palmera ecosystem. Worth crawling /terms.php and any /packages pages for live pricing. |
| **hiltonhead.spinnakervacations.com** | Direct developer (Spinnaker — separate subdomain) | $99 (midweek) / $249 (weekend) for 4D/3N + Visa gift card, 90-min tour, age 28-75/$60k income. | WordPress on subdomain — Cheerio | We track spinnakerresorts.com but **not** the Hilton Head sub-domain landing page. Different inventory & pricing from main. |
| **branson.spinnakervacations.com** | Direct developer (Spinnaker — separate subdomain) | $99-$249 4D/3N packages, 90-min sales presentation required. /?add-to-cart=98 cart paths. | WordPress on subdomain — Cheerio | Same situation — separate Branson-specific Spinnaker funnel not covered by current spinnakerresorts.com crawler. |
| **worldmark.wyndhamdestinations.com/us/en/deals-and-offers** | Direct developer (Wyndham — separate brand) | WorldMark by Wyndham preview offers, distinct from Club Wyndham. 4D/3N for $199, 30k Wyndham points, $100 rebate. | Same Wyndham CMS as clubwyndham. Likely Playwright (consistent with how we scrape Wyndham hub). | We currently scrape clubwyndham.wyndhamdestinations.com but not the **worldmark.** sub-brand. Different inventory targeted at West Coast travelers (WorldMark is the western Wyndham product). Should add as a separate source feeding the same Wyndham brand record (or split as a sister brand). |
| **packages.marriottvacationclubs.com** | Direct developer (Marriott — promotional subdomain) | "Ways to Play" Marriott Vacation Club preview packages, Vegas-Grand-Chateau-tagged URLs (`/dce/cmd/org/grand-chateau/?loc=CO15*...`). 90-min tour, $100k income gate. | Promo-engine generated URLs; CMS-rendered HTML. Likely Playwright. | We track marriottvacationclubs.com but **not** the **packages.** subdomain which is where the actual purchasable preview offers live. The current scraper has been hitting placeholders — this is the canonical source. |
| **marriottvacationclub.marriott.com/offers** | Direct developer (Marriott — different path) | "Special Offers for You" landing — actual offer cards with prices for Marriott Vacation Club previews. | Server-rendered, but Marriott uses anti-bot — likely Playwright. | A second Marriott offers location not currently being crawled. Worth comparing to packages. domain output. |
| **getaways.hyattvacationclub.com** | Direct developer (Hyatt — separate subdomain) | Hyatt Vacation Club facebook-cert landing pages, e.g. `/fb-cert/3-2-lake-tahoe` $199 Tahoe 3D/2N + $200 entertainment credit. | Static landing pages on subdomain. Cheerio. | We track hyatt under our existing "Hyatt" brand; the **getaways.** subdomain hosts targeted destination-specific certs (Lake Tahoe, Carmel, etc.) that aren't surfaced via hyattvacationclub.com/vacation-offers. New Lake Tahoe destination unlock. |
| **getaway.tahitivillage.com** | Direct developer (Soleil Management — Vegas) | Tahiti Village 4D/3N "Complimentary Las Vegas Getaway" in Moorea Suite. $125 deposit / refundable $49-$99 deposit. 120-min tour. | Static landing page subdomain, server-rendered. Cheerio. | Independent Vegas timeshare resort (Soleil Management) we don't have. Distinct from Westgate/MRG/Wyndham Vegas inventory. |
| **tahitivillage.com/special-offers** | Direct developer (Soleil Management — Vegas) | Resort hotel deals plus preview-tour funnels. | Static — Cheerio. | Same brand, second URL for hotel-side specials. Worth a second crawler. |
| **massresort.com/stay/specials-and-packages** | Direct developer (Massanutten VA) | Massanutten Resort Shenandoah Valley preview packages — $104 4D/3N + $100 gift card, 120-min tour, $40k income. | Static HTML — Cheerio. | **We already track massresort.com as a source per CLAUDE.md** — but the specials-and-packages path may not be the URL being scraped. Worth verifying current crawler hits this exact path. (Treat as "verify, not new" if already covered.) |
| **getaways.vacationvip.com** | Aggregator (VacationVIP — getaways subdomain) | E.g. `/fb-promotions/massanutten-shenandoah-4-3-104/`, dedicated FB-ad-tagged Massanutten promo at $104. Plus per-destination subdomains like `massanutten-shenandoah-104.vacationvip.com`. | WordPress subdomain — Cheerio. | We track vacationvip.com root but each promo lives on a **subdomain or a /fb-promotions/ path**. Inventory is wider than the homepage exposes. Could double our VacationVIP coverage. |
| **vacationvillageresorts.com** | Direct developer (Vacation Village — beyond what we have) | Owner-invite + preview-package funnels (e.g. `/massanutten/aop_winter_owner_invite/tc.html`). | Static. Cheerio. | We track vacationvillagedeals.com (the preview deals site), but this is the **resorts**-branded parent site with its own promo inventory. |
| **affinityrewards.com** | Affinity (Vacation Village owner-referrals) | Owner-referral preview invites for Vacation Village + Massanutten. $99 deposit refunded as Visa gift card after tour. | Public-facing terms pages + `/VIP/Florida/index.aspx` and similar /VIP/<destination>/ paths. Static .aspx — Cheerio. | Owner-referral incentive site; **invite-only** in concept, but landing pages are public and scrapable for offer terms/prices. Useful for understanding the unadvertised B2B side of Vacation Village preview pricing. Could be Tier 2 if it requires a code. |
| **palaceresorts.com/offers** | Direct developer (Palace Resorts MX) | All-inclusive offers (BOFA400 promo, $400 resort credit on 3+ nights at Palace properties Cancun/Cozumel/Riviera Maya/Jamaica). Palace Elite is their VC tier. | Static + JS — likely needs Playwright but offer pages can be Cheerio. | Palace is a major Mexican AI/VC operator we don't track. They run preview-style discount stays (Palace Elite). Need to verify they sell true preview packages vs only owner-rate AI deals; even AI offers with mandatory tour qualify. |
| **karismahotels.com/offers** | Direct developer (Karisma / Prestige Travelers MX-Caribbean) | Karisma "Gourmet Inclusive" offers; Prestige Travelers (their VC tier) preview-stay invitations. | Static + JS, but offers page renders server-side. Cheerio likely OK. | Karisma resorts (Azul, El Dorado, etc.) operate Prestige Travelers VC with preview stays. Not currently tracked. |
| **royal-holiday.com** | Direct developer (Royal Holiday MX) | Royal Holiday Club VC preview stays at Park Royal Beach Cancun, Royal Holiday properties across MX/Caribbean. 90-120 min tour. | Spanish-language WordPress, static-ish. Cheerio. | Mexico's third-largest VC operator (70k+ members, 180 destinations). Distinct from Pueblo Bonito/Vidanta/Sandos. Some reputational issues but still actively running preview-stay funnels. |
| **palmeravacationclub.com** | Direct developer (Palmera VC — HHI) | Membership marketing for Palmera VC (Coral Reef, Coral Sands, Port O Call, Island Links). | Static HTML; /about.html, /resorts.html public. Cheerio. | The brand homepage behind palmeravacationclub. Light on direct pricing, but useful for brand metadata / resort list for cross-reference to vacationplay.com & hiltonheadislanddeals.com offers. |
| **vacationmyrtlebeach.com** | Direct developer (Enjoi Resorts WorldWide — Myrtle Beach) | Enjoi Resorts Crown Reef Resort & Waterpark MB preview package. 2-hr tour. Up to $749 retail value if forfeit. $50k income gate. | Static-ish marketing site + terms.php. Cheerio. | Enjoi Resorts is a Myrtle Beach VC operator not in our list. Active funnel for Crown Reef Resort. |
| **kingstonresorts.com/offers** | Direct developer (Kingston / Embassy Suites MB) | Note: this is mostly **standard hotel offers** ("Buy 5 Nights Get 2 Free"), not preview packages, on the deals page. However the property does host HGV (Embassy at Kingston Plantation) so true preview stays sit on hiltongrandvacations.com URLs. | Static — Cheerio. | **Borderline.** Include only if we want to capture broader MB hotel-deal inventory; otherwise skip — not a preview-tour funnel. Recommend SKIP unless we expand scope. |

**Tier 1 net new candidates (excluding borderline kingstonresorts and massresort which is already on list): ~22 candidates.** Of these, the highest priority adds are:

1. timesharevacationpackages.com
2. vacationpeople.com
3. worldmark.wyndhamdestinations.com
4. packages.marriottvacationclubs.com
5. branson.spinnakervacations.com + hiltonhead.spinnakervacations.com
6. getaways.hyattvacationclub.com (for Tahoe coverage)
7. getaway.tahitivillage.com
8. vacationplay.com + hiltonheadislanddeals.com (Palmera dual-source)
9. hiltonheadforless.com (Resort Source — independent HHI)
10. vacationmyrtlebeach.com (Enjoi Resorts MB)

---

## Tier 2 — Worth tracking (membership-gated / closed affinity)

Programs that exist but inventory is behind a login or eligibility wall. We can't scrape them, but we should know they exist:

| Domain | Why gated | What's on offer |
|---|---|---|
| **americanforcestravel.com** | Requires DoD/MWR eligibility; Priceline backend; not timeshare-preview model | Joint-service military leisure travel portal. **Confirmed: no preview/tour requirement.** Pure hotel+flight discounting. Not a vacpack source. |
| **govvacationrewards.com** | Free account but military/gov verification | DRM-style points-based VC; 250k resort options, but inventory not exposed without login. Reputation poor (1.5★ TrustPilot). |
| **vacationrewards.com** (Govt Vacation Rewards parent / sister product) | Login-gated | Same family, civilian-facing. |
| **govx.com/travel** | Requires ID.me / military verification | Resort/hotel discounts, no timeshare-preview funnel. Not a vacpack source. |
| **disneyvacationclub.disney.go.com/preview-center** | Requires existing Disney resort reservation for $100 gift card; non-resort guests can still tour but no incentive package | DVC preview tours — they don't pre-sell discounted accommodations to non-members. Standard timeshare-preview model **does not apply** to DVC. Not a vacpack source. |
| **disneyvacationclub.disney.go.com/savings** | Requires member status to see actual point discounts | Internal member savings only. |
| **expedia-aarp.com** | AARP membership required | Per research, no preview-tour packages — pure flight/hotel/cruise discounts. Not vacpack. |
| **costcotravel.com** | Costco membership required | Per research, **no timeshare-preview packages** — Costco Travel is pure hotel/flight bundling. Confirmed not a vacpack source. |
| **samsclub.com/content/travel** | Sam's Club membership required | Same — discounted hotels/parks, no preview tours. Confirmed not a vacpack source. |
| **usaa.com/perks/travel-deals** | USAA membership | Pure discount portal, no preview-tour requirement. Not vacpack. |
| **wesalute.com** (Veterans Advantage) | Membership | Travel discounts, no preview-tour. Not vacpack. |
| **perkspot.com / benefithub.com** | Employer-keyed login | Employee discount portals — no timeshare-preview component. Not vacpack. |
| **affinityrewards.com** (Vacation Village owner-referral) | Officially invite-only, but landing pages public | Listed in Tier 1 as scrapable for the public terms. Treat as Tier 1 (public-side) AND Tier 2 (most inventory is invite-gated). |
| **palmeravacationclub.com** | Member portal sits behind login | Public marketing pages scrapable; member booking is gated. Listed in Tier 1 for the public side. |

**Intel value of Tier 2:** Most of the "affinity / membership" segment turns out **not** to use the timeshare-preview-package model. They simply resell hotel/flight/cruise inventory at member rates. So we shouldn't expect to grow our vacpack inventory through these channels — they're useful only as competitive-positioning awareness ("here's where military/AAA/Costco members shop instead of us").

---

## Tier 3 — Dead ends / not relevant

| Domain | Why dead end |
|---|---|
| **outrigger.com** | Hawaii hotel/resort brand. Offers seasonal hotel discounts, **no timeshare-preview tour packages**. Not a vacpack source. |
| **carnival.com / royalcaribbean.com / ncl.com** | Cruise lines themselves don't sell timeshare-preview-style packages. They appear as **bonus certificates** inside other operators' packages (HGV cruise cert, Wyndham cruise cert) but the cruise lines do not run preview funnels. Skip. |
| **vacationsforveterans.org** | Charity — donates free vacations to veterans. Not a commercial vacpack source. |
| **diamondresortsandhotels.com** | Diamond Resorts is now part of Hilton Grand Vacations Club; preview-package offers all live on hiltongrandvacations.com which we already track. No separate diamond-branded vacpack inventory. Skip. |
| **welkresorts.com** | Welk was acquired by Marriott Vacations Worldwide in 2021. Welk-branded preview packages have been folded into Marriott's funnels. No standalone Welk site offering previews. Skip. |
| **vacationinternationale.com** | Marketing site only — no public preview-package inventory. They route prospects through telemarketing call list. Not scrapable. |
| **kingstonresorts.com** | Pure hotel-deal site (B5G2, dining packages). Embassy/Hilton inventory at the property is sold through hiltongrandvacations.com which we track. Skip. |
| **vacationsmadeeasy.com** | Sells **bundled show-ticket + hotel** vacation packages (Branson/Gatlinburg). **Not preview-tour funnels.** Skip — different product category. |
| **costcotravel.com / samsclub.com travel / aarp.com / usaa.com / wesalute / perkspot / benefithub** | All confirmed: discount-aggregator model, **no preview-tour requirement.** Not vacpack sources. |
| **americanforcestravel.com / govx.com** | Same — military discount aggregators, no preview-tour product. |
| **disneyvacationclub.disney.go.com** | DVC's preview model is on-property only ($100 gift card to existing Disney resort guests); they don't sell pre-purchased discounted accommodations to non-members. Different model — skip. |

---

## Segment notes

### Military / veteran
**Finding: this segment is mostly dead for vacpack inventory.** American Forces Travel (Priceline-powered), GovX, AFVC (already on skip list), Military.com discounts, USAA Travel Deals all explicitly **do not** require timeshare-preview tours. They are pure hotel/flight/cruise discount aggregators. The closest fit was **govvacationrewards.com** but inventory is login-gated and reputational risk is high.

The military-eligible audience does buy preview packages — but they buy them through the same operators we already track (Westgate, HGV, Wyndham, Marriott Vacation Club), often promoted via the operator's own "military discount" landing pages. We are not missing inventory; we may be missing **military-specific promo landing pages** on operators we already cover.

### Membership-based (AAA / Costco / Sam's / AARP / employer perks)
**Finding: also dead for vacpack.** AAA Travel, Costco Travel, Sam's Club, AARP Travel, PerkSpot, BenefitHub all run on the same model — they resell standard hotel/cruise/flight inventory at member-only rates with **no timeshare-preview tour requirement**. They do not aggregate or resell preview packages.

This makes sense: their core value prop is "you don't have to sit through a sales pitch." They explicitly position themselves against the preview-tour model.

### Regional / state-only operators
**This was the most productive segment.** Found multiple Tier 1 candidates:

- **Hilton Head** has a healthy independent preview ecosystem: Palmera Vacation Club (vacationplay.com, hiltonheadislanddeals.com, palmeravacationclub.com), Resort Source Timeshare Resales (hiltonheadforless.com), plus the Spinnaker HHI subdomain.
- **Myrtle Beach**: Enjoi Resorts Worldwide via vacationmyrtlebeach.com (Crown Reef Resort).
- **Branson**: branson.spinnakervacations.com adds inventory beyond what spinnakerresorts.com surfaces.
- **Lake Tahoe / Reno**: getaways.hyattvacationclub.com hosts $199 Tahoe FB-cert packages we don't currently surface (we track Hyatt at brand level but not subdomain).
- **Las Vegas**: Tahiti Village / Soleil Management (getaway.tahitivillage.com + tahitivillage.com/special-offers) is independent of all major chains. Genesis Group (genesisgrouplv.com) is more of an activities reseller — borderline.
- **Williamsburg, Daytona, Cocoa Beach, Gatlinburg/Pigeon Forge**: all best aggregated through **timesharevacationpackages.com** and **vacationpeople.com** rather than chasing micro-operators individually.

### Direct developer sites we may have missed
- **WorldMark by Wyndham** (worldmark.wyndhamdestinations.com) — separate subdomain from Club Wyndham, distinct inventory targeted at the Western US. **High priority add.**
- **Marriott `packages.marriottvacationclubs.com`** — the actual purchase-funnel URL for Marriott VC previews, separate from the main marriottvacationclubs.com which is more brand/marketing. **High priority add given our current Marriott placeholder issue.**
- **Hyatt `getaways.hyattvacationclub.com`** — subdomain with destination-cert URLs (Lake Tahoe, etc.) not reached by the main Hyatt offers page.
- **Diamond / Welk / Vacation Internationale**: all consolidated into HGV/Marriott/marketing-only respectively. No standalone preview funnels to add.
- **Palace Resorts**, **Karisma (Prestige Travelers)**, **Royal Holiday** — three Mexican direct-developer operators with preview-stay funnels that we don't cover. Less reputable historically but they run real preview programs.

### Cruise + land hybrid programs
**Finding: dead end.** Carnival, Royal Caribbean, NCL do **not** sell timeshare-preview packages themselves. They appear only as **bonus certificates inside other operators' packages** (e.g., Wyndham gives a Carnival cruise cert as a sweetener; HGV bundles a Royal Caribbean Bahamas cruise). The cruise lines do not run preview funnels and there is no "Royal Caribbean preview package" to scrape. Skip this segment.

---

## Recommendation summary

**Highest-priority new sources to add (top 10):**

1. `timesharevacationpackages.com` — major non-tracked aggregator, multi-destination, multi-brand
2. `vacationpeople.com` — second major non-tracked aggregator (needs Playwright)
3. `worldmark.wyndhamdestinations.com` — Wyndham sister brand we're missing
4. `packages.marriottvacationclubs.com` — fixes the current Marriott placeholder gap
5. `getaways.hyattvacationclub.com` — adds Lake Tahoe / Carmel certs to Hyatt coverage
6. `branson.spinnakervacations.com` + `hiltonhead.spinnakervacations.com` — Spinnaker subdomain inventory
7. `vacationplay.com` + `hiltonheadislanddeals.com` — Palmera VC HHI (one new brand)
8. `hiltonheadforless.com` — Resort Source independent HHI broker
9. `getaway.tahitivillage.com` + `tahitivillage.com/special-offers` — Soleil Management Vegas, new brand
10. `vacationmyrtlebeach.com` — Enjoi Resorts Myrtle Beach, new brand

**Medium priority (Mexico direct developers, additional brands):**
- `palaceresorts.com/offers` (Palace Elite VC)
- `karismahotels.com/offers` (Prestige Travelers VC)
- `royal-holiday.com` (Royal Holiday Club)
- `affinityrewards.com` (Vacation Village owner-referral terms pages)
- `vacationvillageresorts.com` (Vacation Village resorts parent site)
- `getaways.vacationvip.com` + per-promo subdomains (VacationVIP wider inventory)

**Do not pursue:** all military/affinity/membership-club portals (AmericanForcesTravel, GovX, Costco, Sam's, AAA, AARP, USAA, WeSalute, PerkSpot, BenefitHub), cruise lines directly, Disney Vacation Club, Outrigger, Diamond/Welk standalone, kingstonresorts.com, vacationsmadeeasy.com.

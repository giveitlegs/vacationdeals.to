# New vacpack source candidates — 2026-09-09 research swarm

Two research agents (US domestic + Mexico/Caribbean) searched for timeshare-preview /
vacation-package promo sites NOT already scraped (excluded the ~66 current sources).
DOM-verified prices only. **Not auto-built** — building crawlers is a follow-up.

## US domestic

| url | example packages + prices | presentation? | Cheerio vs browser | bot-blocking | notes |
|---|---|---|---|---|---|
| **staysharevacations.com** | 5 destinations all **$99** (4D/3N): Lake Havasu, Hilton Head, Branson, Ormond Beach/Daytona, Williamsburg. "Save up to 85%." | Yes (90-min) | **Cheerio** (static HTML) | none | **Best US find BUT operated by Spinnaker Resorts** — we scrape the `spinnaker` brand, so verify this isn't duplicate inventory before ingesting. Given `spinnaker` is 404ing en masse (see NEXT-ENHANCEMENTS 2026-09-09 #1), this may be Spinnaker's *replacement* promo feed. Clean uniform $99 cards = easy parse. |
| **traveloffice.org** (Branson Travel Office) | Incredible Savings Pkg **$79** (3D/2N); show add-ons $49–$149 | Partial (only the $79 pkg) | **Cheerio** (WooCommerce) | none | Price-parse trap: struck "from" $293 vs sale $79 — anchor on sale price. Ingest only the package SKU, skip bare show-ticket SKUs. Low volume. |
| **alwaystravelwithus.com** | Williamsburg Plantation 4D/3N **$499** total (+Busch Gardens tix or $150 Visa GC) | Yes (90–120 min) | **Cheerio** ($499 in text; $149/couple only in a banner image) | none | Single-page promo, thin inventory, higher price point. Property is Vacation Village (excluded brand) but distinct promo domain — dedupe. |
| **vacationpeople.com** | Gatlinburg/Pigeon Forge & Williamsburg previews "as low as $33/night" | Yes (90-min) | needs desktop-UA (403 to bot UA) | **403 to non-browser UA** | Prices unverified (403). Needs the branson-reservations-center desktop-UA `preNavigationHooks` block. Also appears in the intl list — likely same operator as the already-scraped all-inclusive-promotions / timeshare-vacation-packages network (identical $479/$528 language). |

Rejected: vacationsmadeeasy.com (retail show packages, no presentation requirement).

## Mexico / Caribbean

| url | example packages + prices | presentation? | Cheerio vs browser | bot-blocking | notes |
|---|---|---|---|---|---|
| **vacationclubpromo.com** | Sandos Playacar from **$435**/3n; Sandos Cancún/Finisterra from **$555**; Krystal Cancún **$749**; Cofresi Puerto Plata **$799**; Dreams/Breathless Riviera Maya & Punta Cana from **$949** | Yes (explicit 90–120 min) | **Cheerio** (static HTML) | none | **Best intl find.** 91 packages listed; ~13 carry hard DOM prices, ~78 are price-less "partner desk" quotes → filter to priced rows only. Sandos/Dreams/Krystal/Breathless inventory across Mexico + DR. |
| **vacationpeople.com** (intl landers) | Cancun/Riviera Maya previews; network-standard **$479 base / $528 ultra-lux**, 4–7n | Yes (120-min) | Browser/UA-spoof needed | **403 to non-browser UA** | Large resort-lander inventory (Cancun/Riviera Maya/PV/Cabo/DR/Jamaica/Costa Rica). **Likely a re-skin of the already-scraped all-inclusive-promotions + timeshare-vacation-packages network** ($479/$528 + "Luxury X Resort & Spa" slugs) — verify overlap before building; may be largely duplicate. |
| **myvacationtomexico.com** | "Cancun All Inclusive at $399" (SERP) | preview promo framing | unverified | ECONNRESET on fetch | **Low confidence / unverified** — page wouldn't load. Browser re-check before building. |

Rejected: cancun100.com (conventional OTA, no presentation requirement).

## Recommendation
- **vacationclubpromo.com** is the cleanest net-new add (static, priced, Mexico+Caribbean) — apply the "skip price-less partner-desk cards" + package-figure-not-"from" guards.
- **staysharevacations.com** is a strong US add but must be reconciled against `spinnaker` first (possibly its replacement feed).
- Treat **vacationpeople.com** as probable duplicate of an existing network until overlap is disproven.

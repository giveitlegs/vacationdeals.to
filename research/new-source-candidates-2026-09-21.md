# New vacpack source candidates — 2026-09-21 research swarm

Two research agents (US + Mexico/Caribbean) searched for timeshare-preview promo sites
NOT already scraped and NOT already flagged in the 2026-09-09 research. DOM-verified
prices only. **Not auto-built** — building crawlers is a follow-up. The niche is now
heavily saturated by sources already in our exclude list; only net-new below.

| url | example packages + prices | presentation? | Cheerio vs browser | bot-blocking | notes |
|---|---|---|---|---|---|
| **vacationdealhub.com** (+ /cancun, /cabo, /cozumel, per-dest pages) | US: Myrtle Beach $69, Atlantic City $79, Galveston $79, Oceanside CA $79, New Orleans $99 (all 4D/3N). Intl: Cancun Bay $149; Wyndham Grand Cancun / Krystal / Grand Oasis / Villa del Palmar / The Fives / Secrets Aura Cozumel / Dreams Curaçao / Wyndham Grand Rio Mar PR all ~$199 (6D/5N) | Yes — explicit vacation-ownership preview | **Cheerio (static/SSR)** — prices in server HTML, per-dest pages ~9 resorts each | none observed | **Best find — surfaced by BOTH agents independently.** Standardized `$XXX` + "6 days/5 nights" strings (easy regex). Broad US + Mexico + Caribbean + PR + Cozumel. Watch the credit/gift-card-as-price trap + the `$ 199` space gotcha. Some resort overlap with existing brokers but distinct URLs (no dup collision). |
| **2fntravel.com/vacation-specials/** | Orlando 2N $59 / 3N $99 / villa 3N $399; Branson 2N $59 / 3N $99; Gatlinburg 2N $59; Las Vegas 2N $99; Myrtle Beach 2N $129; Daytona 2N $129; Ft Lauderdale 2N $99; Miami 2N $159; Orlando/Daytona combo 5N $299; Cancun/Punta Cana/PV 4N $249pp | Yes — carries the FL timeshare-solicitation disclaimer | **Cheerio (static HTML)** — all ~16 packages + prices in DOM on one page | none observed | Solid ~16-package single-page table. TRAPS: cards list a "$50 Visa rebate" + "$100 dining voucher" alongside the package price — target the package `$` only. Deals share one listing page → needs unique `#fragment` anchors per deal (deal-store upserts on URL). |

## Rejected during verification
- **vrcdestinations.com** — resort-preview promo, 16 US destinations + $100 Visa gift card, but NO concrete package price on page (only the gift-card amount) → fails the DOM-price bar. Re-check if they expose prices later.
- **go-koala.com/timeshare** — editorial deals guide / rental marketplace, not a broker with own bookable DOM prices.
- kingstonresorts.com, resortcollection.com PCB promos, vacationsmadeeasy.com (Gatlinburg), cancun100.com — ordinary hotel/OTA offers, no presentation requirement.

## Recommendation
- **vacationdealhub.com** is the cleanest net-new add (static, priced, huge geo spread, found twice) — apply the credit/gift-card guard + `$\s*` regex.
- **2fntravel.com** is viable single-page inventory but needs the rebate/voucher guard + per-deal `#fragment` anchors.
- The Mexico/Caribbean preview niche is largely exhausted vs current coverage; future net-new will likely need in-country/non-English operator sites with browser-render treatment.

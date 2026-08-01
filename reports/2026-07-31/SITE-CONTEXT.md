# vacationdeals.to — site context for the ranking/internal-linking swarm

Timeshare-preview "vacpack" deal aggregator. ~613 active deals, 1,021 content pages, sitemap ~2,480 URLs. Next.js 15, ISR. All content renders at TOP-LEVEL slugs (no /blog/ or /pages/ prefix).

## Commercial page inventory (the pages we want to rank)
- **Destination landers** (highest commercial intent): /orlando /las-vegas /branson /gatlinburg /myrtle-beach /williamsburg /cancun /cabo /punta-cana /hilton-head /daytona-beach /cocoa-beach /sedona /park-city /key-west /lake-tahoe /san-diego /nashville /miami /san-antonio (each = "<city> vacation deals/packages")
- **Brand landers**: /westgate /wyndham /marriott /hyatt /hilton-grand-vacations /bluegreen /holiday-inn /discover-branson /capital-vacations /bookvip /getawaydealz /mrg /staypromo etc.
- **Price/duration**: /deals-under-100 /deals-under-200 /deals-under-300 /deals-under-500 /2-night-packages /3-night-packages /4-night-packages /5-night-packages
- **225 niche commercial/data pages** (full clickable list at research/page-ideation-2026-07/URL-LIST.md): 10 categories —
  - A data/stat-bait (30): /vacation-package-price-index, per-city price-history pages, /biggest-vacation-deal-price-drops, /cheapest-vacation-deal-every-day, /vacation-package-price-per-night-rankings ...
  - B requirements-AEO (30): /timeshare-presentation-* (income/age/spouse/credit-card/military etc.)
  - C legal (22): /<state>-timeshare-cancellation-rights, /timeshare-rescission-calculator ... (carry "not legal advice" disclaimers)
  - D fees (18): /<city>-resort-fee-database, /timeshare-maintenance-fee-averages ...
  - E calculators (15): /timeshare-presentation-hourly-rate-calculator, /vacation-savings-calculator ...
  - F showdowns (25, MOST commercial): /westgate-vs-wyndham-orlando, /cheapest-presentation-deal-<city>-ranked, /no-presentation-vacation-deals ...
  - G audiences (30): /vacation-deals-<audience> (travel-nurses, military, teachers ...)
  - H seasonal (20): /<city>-<event>-vacation-deals ...
  - I watchdog (15): /vacation-deal-red-flag-database, /parked-domain-vacation-sites-list ...
  - J glossary (20): /glossary-<term>
- **Feature/tool pages**: /rate-recap /reality-index /will-it-hold-up /vacpack-rate-showdown /resort-roulette /vacation-deals-map /deals /destinations /brands

## Existing internal-linking mechanisms
- SEOPreFooter component on SEO pages (category cross-links)
- Ticker (DealTicker) sitewide, cheapest deals
- Search bar routes to top-level SEO slugs
- Each niche page has an internalLinks[] array (3 links) + in-prose links + relatedSlugs (2-3 siblings)
- Blog/niche pages cross-link within their category (hub-and-spoke, loosely)

## The goal
A concrete "tweaking best practices plan" to rank ALL commercial pages for huge commercial keywords (e.g. "vacation packages", "timeshare deals", "cheap vacations", "all inclusive vacation deals", "<city> vacation packages", "orlando vacation deals"), grounded in Google's ranking patents + internal-linking best practices.

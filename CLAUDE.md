# VacationDeals.to

## Project Overview
Vacation deal aggregator for timeshare preview packages ("vacpacks"). Scrapes deals from 10+ timeshare brand sites and third-party brokers, displays them in a searchable/filterable interface optimized for SEO around "vacation deals".

**Live site:** https://vacationdeals.to
**GitHub:** https://github.com/giveitlegs/vacationdeals.to
**VPS:** Hostinger KVM8 at 72.60.126.82 (Ubuntu 24.04, credentials in vpsssl.txt — NEVER commit this)

## Tech Stack
- **Monorepo**: Turborepo + pnpm workspaces
- **Web App**: Next.js 15 (App Router) + Tailwind CSS v4
- **Database**: PostgreSQL 16 + Drizzle ORM
- **Scraper**: Crawlee (CheerioCrawler for static sites, PlaywrightCrawler for SPAs)
- **Hosting**: Hostinger VPS (Nginx reverse proxy + PM2 + Let's Encrypt SSL)
- **CMS**: Payload CMS 3.0 (configured but admin routes temporarily removed due to React 19 compat)

## Structure
```
apps/web/           — Next.js frontend + API routes
  src/app/          — App Router pages (ISR with revalidate=3600)
  src/components/   — React components (DealCard, DealGrid, FilterBar, SearchBar, FAQAccordion, etc.)
  src/lib/          — queries.ts (DB helpers), faqs.ts (FAQ content), images.ts (Unsplash)
  src/collections/  — Payload CMS collection configs
  src/globals/      — Payload CMS global configs (SiteSettings, AdSettings)
apps/scraper/       — Crawlee scraping service (10 crawlers)
  src/crawlers/     — One file per source site
  src/storage/      — deal-store.ts (upsert deals to DB with price history)
packages/db/        — Shared Drizzle ORM schema, client, seed, migrations
packages/shared/    — Shared TypeScript types (ScrapedDeal, DealFilters) and constants
scripts/            — deploy.sh (VPS deployment)
```

## Scrapers (54 crawlers — see docs/SCRAPING-REFERENCE.md for full details)
**45 CheerioCrawler + 9 PlaywrightCrawler** across 50 active + 4 parked sources, 54 brands, 144 destinations.

- **Policy: DOM-verified deals only.** No catalog/fallback seeding — if a price isn't parsed from a page, we don't publish it. Zero deals is the honest answer for blocked/priceless sites (tafer, el-cid, pueblo-bonito, divi, festiva, legendary, margaritaville, vacation-offer, massanutten currently emit 0).
- **Parked sources** (skipped by waves): monster-vacations, govip, discount-vacation, timeshare-presentation-deals. Unpark: `UPDATE sources SET status='active' WHERE scraper_key='...'`.
- **Branson network (added 2026-07-20):** discover-branson ($99/$79 "travel savings preview" packages + 8 retail), save-on-branson (dual retail/gated pricing), branson-travel-group. None use the word "timeshare" — frame as "resort preview required".
- **Other 2026-07-20 additions:** pgr-getaways (Shopify products.json, ~20 deals), sandos-promo (MX all-inclusive Royal Elite), great-resort-vacations, magical-getaway (Westgate-run), cheap-vacation-getaways.
- **Gotchas:** deal-store upserts match on URL — deals sharing a listing page need unique #fragment anchors. Single-store handlers must `await storeDeal(...)` or the process exits before the insert commits. drizzle-orm is NOT a direct dep of apps/scraper — don't import it there.
- **Recurring price-parse bug — "credit/gift-card amount stored as package price".** Multiple crawlers have captured a "$X Visa gift card" or "$X resort credit" figure as the deal price (vacation-village stored $150 LV credit and $100 gift-card as prices; recurs across sources). When adding/auditing a crawler, ensure the price regex targets the package/"from $X" figure, not adjacent credit/gift/fee amounts. The rate-accuracy swarm (partner-lander price checks vs DB) is the periodic catch for this + stale/repurposed URLs (e.g. Westgate offer URLs get reused for new promos, leaving a stale price). Also watch placeholder `original_price` values like 50000 (capital-vacations) — clean to NULL.
- Playwright targets: getawaydealz, marriott, discount-vacation, legendary, hgv + 4 more; HGV parses client-rendered "$X /STAY" offer cards.

## Database Schema (9 tables)
- `brands` — 33 timeshare brands (direct + broker types)
- `destinations` — 64 cities with slugs, regions, lat/lng
- `sources` — 31 scrape target websites with status tracking
- `deals` — Main deal table (title, price, duration, URL, inclusions, requirements, etc.). **Deal-expiry policy (owner directive 2026-08-12): NEVER delete or 404 a deal page.** To retire a deal set `is_active=false` (+ `expires_at=now()`) — the `/deals/[slug]` lander intentionally stays 200 (no `is_active` filter in `getDealBySlug`), shows a single "This Deal Has Expired" banner, swaps the CTA to "See Current {Brand} Deals", is `robots:noindex` + dropped from sitemap/listings. It **auto-revives** with zero re-setup because deal-store's upsert sets `isActive = !expired` on every re-scrape. Manual revival: `SET is_active=true, expires_at=NULL`.
- `deal_price_history` — Price tracking over time per deal
- `site_settings` — Key/value pairs (GTM ID, GA ID, AdSense)
- `ad_banners` — Configurable ad placements (header, sidebar, inline, footer)
- `blog_posts` — CMS-managed content pages (HTML content, FAQs, SEO metadata). Serves BOTH casual blog posts AND commercial/data/niche SEO pages. Batch content is authored as JSON (git = source of record) and inserted via `scripts/insert-blog-batch-json.ts <dir>` (validates required fields, faqs>=5, category enum, skips existing slugs). Sources: `research/blog-batches/<batch>/` (weird posts) and `research/page-ideation-2026-07/pages/` (225 niche commercial/data pages: stat-bait, requirements-AEO, legal, fees, calculators, showdowns, audiences, seasonal, watchdog, glossary — see PAGE-BUILD-SPEC.md there).
- **Internal linking is computed at render time** (2026-08-01 linking plan). `apps/web/src/lib/internal-links.ts` (`computeInternalLinks`) augments every content page's ~3 hand-authored `internalLinks` with a geo-pillar up-link + keyword-pillar up-links (`/timeshare-presentation-deals`, `/all-inclusive-vacation-deals`) + same-category siblings (via slim `getSlugTitlesByCategory`), rendered in BlogPost.tsx's "Explore More" block (failsafe: authored links on error). Anchor variants are rotated (deterministic hash, NOT Math.random — that breaks ISR) to avoid exact-match over-optimization. Don't hardcode per-page related links; extend the resolver. The **two commercial pillar hubs** (`/timeshare-presentation-deals`, `/all-inclusive-vacation-deals`) are `blog_posts` rows + depth-1 nav links; they're the up-link targets — don't delete them.
- **All these render at TOP-LEVEL slugs** via the catch-all `(frontend)/[slug]/page.tsx` — resolution order: listicle → rate-recap-brand → price/duration → **sublander `{city}-{modifier}`** → **blog_posts lookup** → static dest/brand → 404. So a `blog_posts` slug that collides with a `{knownCity}-{knownModifier}` pattern gets intercepted by the sublander branch and won't render — avoid that shape when slugging new pages. `/blog/<slug>` 308s to top-level.
- **Legal/law-adjacent pages MUST carry disclaimers** (owner directive 2026-07-22): amber "not legal advice" box as first content element + repeat above FAQ, official-statute links only, information-not-advice phrasing, plain WebPage schema. We are NOT a legal site. BlogPost.tsx auto-emits WebPage (not BlogPosting) schema for legal-cluster slugs (`*-cancellation-rights`, `rescission`, `timeshare-laws`).
- **Topical hub pages** (`apps/web/src/lib/topic-hubs.ts` HUBS registry): 8 dynamic pillar pages (`/timeshare-presentation-guide`, `/vacation-deal-glossary`, `/timeshare-cancellation-laws`, `/resort-fee-databases`, `/vacation-deal-data`, `/vacation-deal-showdowns`, `/vacation-deals-by-audience`, `/seasonal-vacation-deals`) that query `getClusterPages()` and link DOWN to their whole cluster; the link resolver adds the reciprocal UP-link. Rendered by `components/TopicHub.tsx` via the catch-all (resolved BEFORE sublander/blog). In nav "Guides" + sitemap.ts HUBS. To add a hub: extend HUBS + HUB_BY_CLUSTER + clusterForSlug + nav HUB_LINKS + they auto-appear in sitemap.
- **Legal posture SUPERSEDED 2026-08-12 (compliance officer directive) — the site now operates as a seller of travel under Westgate.** The old "NOT a timeshare marketing site / not a marketing company" language has been REMOVED/reconciled everywhere (footer disclaimer, Terms §2.1, consent popup) — DO NOT reinstate it. Current posture: primarily a data-availability service that never takes payments or transacts, but **"some content may function as advertising material"** for the featured resorts/brands (esp. Westgate); data may be inaccurate with no liability; buyer-beware on timeshare. The footer carries the **Westgate Seller of Travel disclosure** sitewide (Westgate Resorts Ltd address + FL/WA/CA/IA SOT numbers + the standalone "THIS ADVERTISING MATERIAL IS BEING USED FOR THE PURPOSE OF SOLICITING SALES OF TIMESHARE INTERESTS" line — must stand alone, nothing abutting it).
- **`/terms` + `/privacy` are two-part pages:** Part 1 = Westgate's VERBATIM Terms/Privacy (scraped from westgatereservations.com, bs4-sanitized, stored as trusted HTML constants in `apps/web/src/lib/legal/westgate-{terms,privacy}.ts`, re-extractable via `scripts/extract-westgate-legal.py`); Part 2 = VacationDeals.to's own site terms/privacy (preserves the GA/CCPA/GDPR/email disclosures required for the site's own data collection — don't delete Part 2). All sitewide Terms/Privacy links (incl. the footer SOT block) point to local `/terms` + `/privacy`. Local WG copies go stale if Westgate revises theirs — re-run the extract script to refresh.
- **Terms §19 = email CAN-SPAM consent only; SMS/TCPA is gated behind a future phone opt-in (never SMS email-only signups — TCPA violation).** The popup (`LeadGenPopup`/`SitewideLeadGenPopup`) is email-only, fires ~6s on every page except /admin. Any TCPA/SMS/GPC change needs attorney review — see docs/NEXT-ENHANCEMENTS.md required follow-ups.
- **Content-depth bar**: ship substantive pages (750+ words prose + data tables), not thin-content-at-scale — mass thin pages are a Helpful-Content/thin-affiliate ranking risk. Writer agents under-deliver on length; always re-validate word count and run a depth pass before insert.
- `seo_health` — SEO issue tracking (URL, severity, check type, resolution status)

## SEO Architecture
- **Primary keyword**: "vacation deals" (2:1 ratio over "vacation packages")
- **ISR**: All deal pages revalidate every hour (revalidate = 3600)
- **Dynamic metadata**: generateMetadata queries DB for live prices/counts
- **Schema.org**: TouristDestination, Organization, FAQPage, Product/Offer, WebSite, CollectionPage
- **URL structure**: Top-level SEO slugs (`/orlando`, `/westgate`, `/deals-under-100`, `/3-night-packages`)
- **Sitemap**: Auto-generated at /sitemap.xml (48+ URLs)
- **FAQs**: 10+ unique FAQs per SEO page with pure CSS accordion + FAQPage JSON-LD
- **Internal linking**: SEOPreFooter component on every SEO page with category cross-links
- **Search bar**: Routes to SEO pages (`/orlando` not `/deals?destination=Orlando`)

## Recurring operations
- **`vacdeals-evergreen` skill** (`.claude/skills/vacdeals-evergreen/SKILL.md`) is the runbook for the recurring health+growth ops: 3-layer backup → recrawl+maintenance → rate-accuracy spot-check swarm → new-vacpack-site research → 50-post Discover blog batch. Trigger with `/vacdeals-evergreen` or "run evergreen ops". Guardrails baked in: **agent waves ≤5** (a 13-agent batch was session-limit-killed), guarded builds (`pnpm build` before `pm2 restart`), and the $25 all-in cost cap.
- **Nav** (`components/Navbar.tsx`) is consolidated to 8 clean top-level items: Deals ▾ · Destinations ▾ · Brands · Guides ▾ · Tools ▾ · Blog · Fun ▾ (Games+Carnival+Best Of) · Roulette CTA. Add `whitespace-nowrap` to any new top-level item; don't add flat top-level links (fold into a dropdown) — the old 12-item bar wrapped/overlapped.

## Commands
- `pnpm dev` — Start all apps in dev mode
- `pnpm build` — Build all apps
- `pnpm scrape` — Run all scrapers
- `pnpm db:generate` — Generate Drizzle migrations
- `pnpm db:migrate` — Run migrations
- `pnpm db:seed` — Seed brands, destinations, sources
- Individual scrapers: `cd apps/scraper && npx tsx src/index.ts --source=westgate`

## VPS Deployment
```bash
# On VPS (72.60.126.82):
cd /var/www/vacationdeals && git pull origin main
# IMPORTANT: source .env BEFORE build (build-time DB reads: sitemap, ISR pages).
# Use set -a/source, NOT `export $(cat .env | xargs)` — that chokes on comments.
set -a && source .env && set +a
pnpm install && pnpm build
pm2 restart vacationdeals-web --update-env   # or delete+start if not running
pm2 save
```
- **turbo.json `globalEnv` must list DATABASE_URL** (+PAYLOAD_SECRET, RESEND_API_KEY). Turbo strict env mode strips undeclared vars from build tasks — this silently broke every build-time DB read for months (sitemap had 0 deal URLs until 2026-07-21).
- **sitemap.xml**: `revalidate = 3600` in sitemap.ts; blog cap lifted in getAllBlogPosts (was silently dropping posts past 500). Healthy sitemap ≈ 2,149+ URLs incl. /deals/* pages.
- **Never run two `pm2 start` for the same name** — check `pm2 ls` for duplicates (EADDRINUSE crash loop).
- **Crontab MUST start with `SHELL=/bin/bash`** — all scraper lines use `source .env`, which dash (`/bin/sh`, cron's default) rejects with `source: not found`. Missing this line silently killed ALL scraper crons from 2026-04-22 to 2026-07-08 while backup/certbot crons kept working. Backup of fixed crontab: `/root/crontab.backup.20260708`.
- Cron schedule (via `crontab -e` on VPS):
  - `0 */6 * * *` — Wave 1 scrapers + verify-prices
  - `15 */6 * * *` — Wave 2 scrapers
  - `30 */12 * * *` — Wave 3 scrapers
  - `45 6,18 * * *` — Wave 4 scrapers
  - `0 2 * * *` — Wave 5 scrapers (nightly)
  - `0 3 * * *` — Deal health check
  - `30 8,20 * * *` — AI deal review generation (50 deals/run, twice daily after Wave 4)
  - `0 4 */2 * *` — SEO audit
  - `0 5 */2 * *` — RSS submission
- AI review log at `/var/log/vacdeals-reviews.log` rotated weekly (keeps 4 weeks)
- **Backups (3 layers):** server daily pgdump cron `/root/db-backups` (30-day retention, contains full `deal_price_history`); local Dropbox mirror at `backups/db/*.pgdump` (gitignored — synced via `scp` from server, offsite via Dropbox); GitHub private repo `vacationdeals-private-backup` via `scripts/backup-to-private-github.sh`. **The local mirror sync is MANUAL and drifts stale (went 6 days behind, seen 2026-07-31)** — pull the latest server dump when doing backup work. Historical rate data is the crown-jewel asset; keep all three current.
- SSL: Let's Encrypt via Certbot, auto-renewing
- Nginx: Reverse proxy on port 80/443 → localhost:3000

## Conventions
- Use Drizzle ORM for all database operations (not raw SQL)
- Shared types in `packages/shared`, shared DB schema in `packages/db`
- Scrapers: one file per source site in `apps/scraper/src/crawlers/`
- All env vars in root `.env`, accessed via `process.env` (NEVER commit .env)
- SSG/ISR for public pages, Server Components where possible
- API routes serve data for future Chrome extension (Phase 2)
- SEO: Lead with "vacation deals", use "packages" as secondary keyword
- All internal links use top-level SEO URLs (`/orlando` not `/destinations/orlando`)
- CSS hover effects: pure CSS only, no JS animations (Core Web Vitals)
- FAQ content must be unique per page (Google penalizes duplicate FAQ content)
- Dynamic imports for DB modules in API routes (avoid build-time errors)
- Scraper imports: no .js extensions (CommonJS mode with tsx)

## Pages
| Route | Type | Description |
|-------|------|-------------|
| `/` | ISR | Homepage with featured deals, destinations, brands |
| `/deals` | ISR | All deals with FilterBar |
| `/deals/[slug]` | ISR | Individual deal detail page |
| `/destinations` | ISR | All destination cards |
| `/brands` | ISR | All brand cards |
| `/[slug]` | SSG+ISR | SEO catch-all (destinations, brands, prices, durations) |
| `/privacy` | Static | Privacy Policy (CCPA, GDPR, GA/GTM disclosures) |
| `/terms` | Static | Terms & Conditions (11-state timeshare disclosures) |
| `/about` | Static | About page |
| `/sitemap.xml` | Generated | XML sitemap |
| `/api/deals` | Dynamic | REST API for deals (Chrome extension ready) |
| `/api/brands` | Dynamic | REST API for brands |
| `/api/destinations` | Dynamic | REST API for destinations |

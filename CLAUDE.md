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
- Playwright targets: getawaydealz, marriott, discount-vacation, legendary, hgv + 4 more; HGV parses client-rendered "$X /STAY" offer cards.

## Database Schema (9 tables)
- `brands` — 33 timeshare brands (direct + broker types)
- `destinations` — 64 cities with slugs, regions, lat/lng
- `sources` — 31 scrape target websites with status tracking
- `deals` — Main deal table (title, price, duration, URL, inclusions, requirements, etc.)
- `deal_price_history` — Price tracking over time per deal
- `site_settings` — Key/value pairs (GTM ID, GA ID, AdSense)
- `ad_banners` — Configurable ad placements (header, sidebar, inline, footer)
- `blog_posts` — CMS-managed content pages (HTML content, FAQs, SEO metadata). Serves BOTH casual blog posts AND commercial/data/niche SEO pages. Batch content is authored as JSON (git = source of record) and inserted via `scripts/insert-blog-batch-json.ts <dir>` (validates required fields, faqs>=5, category enum, skips existing slugs). Sources: `research/blog-batches/<batch>/` (weird posts) and `research/page-ideation-2026-07/pages/` (225 niche commercial/data pages: stat-bait, requirements-AEO, legal, fees, calculators, showdowns, audiences, seasonal, watchdog, glossary — see PAGE-BUILD-SPEC.md there).
- **All these render at TOP-LEVEL slugs** via the catch-all `(frontend)/[slug]/page.tsx` — resolution order: listicle → rate-recap-brand → price/duration → **sublander `{city}-{modifier}`** → **blog_posts lookup** → static dest/brand → 404. So a `blog_posts` slug that collides with a `{knownCity}-{knownModifier}` pattern gets intercepted by the sublander branch and won't render — avoid that shape when slugging new pages. `/blog/<slug>` 308s to top-level.
- **Legal/law-adjacent pages MUST carry disclaimers** (owner directive 2026-07-22): amber "not legal advice" box as first content element + repeat above FAQ, official-statute links only, information-not-advice phrasing, plain WebPage schema. We are NOT a legal site.
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

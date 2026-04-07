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

## Scrapers (33 crawlers — see docs/SCRAPING-REFERENCE.md for full details)
**26 CheerioCrawler + 7 PlaywrightCrawler** across 31 sources, 33 brands, 64 destinations.

| Status | Count | Examples |
|--------|-------|---------|
| Working | 22 | Westgate, BookVIP, MRG, HGV, Wyndham, StayPromo, Vacation Village, VacationVIP, BestVacationDealz, El Cid, Pueblo Bonito, DIVI, Bahia Principe, Villa Group, Spinnaker, Departure Depot, Vegas Timeshare, Premier Travel, Festiva, Hyatt, Bluegreen |
| JS-Heavy (Playwright) | 4 | GetAwayDealz, Marriott, Discount Vacation, Legendary |
| Fallback (catalog seed) | 2 | Holiday Inn, Capital Vacations |
| Graceful 403 | 3 | TAFER, Sheraton VC, Westin VC |
| Parked (monitored) | 2 | GoVIP, Monster Vacations |

## Database Schema (9 tables)
- `brands` — 33 timeshare brands (direct + broker types)
- `destinations` — 64 cities with slugs, regions, lat/lng
- `sources` — 31 scrape target websites with status tracking
- `deals` — Main deal table (title, price, duration, URL, inclusions, requirements, etc.)
- `deal_price_history` — Price tracking over time per deal
- `site_settings` — Key/value pairs (GTM ID, GA ID, AdSense)
- `ad_banners` — Configurable ad placements (header, sidebar, inline, footer)
- `blog_posts` — 274+ CMS-managed blog posts (HTML content, FAQs, SEO metadata)
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
pnpm install && pnpm build
# IMPORTANT: Must source .env before PM2 start for DATABASE_URL
export $(cat .env | xargs)
pm2 delete vacationdeals-web; pm2 start "pnpm start" --name vacationdeals-web --cwd /var/www/vacationdeals/apps/web
pm2 save
```
- Cron: `0 */6 * * *` runs all scrapers every 6 hours
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

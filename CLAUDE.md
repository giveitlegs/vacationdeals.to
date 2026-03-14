# VacationDeals.to

## Project Overview
Vacation package (vacpack) aggregator for timeshare deals. Scrapes deals from timeshare brand sites and third-party resellers, displays them in a searchable/filterable interface.

## Tech Stack
- **Monorepo**: Turborepo + pnpm workspaces
- **Web App**: Next.js 15 (App Router) + Payload CMS 3.0 + Tailwind CSS
- **Database**: PostgreSQL + Drizzle ORM (SQLite for local dev)
- **Scraper**: Crawlee (Cheerio + Playwright modes)
- **Hosting**: Hostinger VPS (Nginx + PM2 + Let's Encrypt)

## Structure
- `apps/web` — Next.js frontend + Payload CMS admin panel + API routes
- `apps/scraper` — Crawlee-based scraping service (runs via cron)
- `packages/db` — Shared Drizzle ORM schema and database utilities
- `packages/shared` — Shared TypeScript types and constants

## Commands
- `pnpm dev` — Start all apps in dev mode
- `pnpm build` — Build all apps
- `pnpm scrape` — Run the scraper
- `pnpm db:generate` — Generate Drizzle migrations
- `pnpm db:migrate` — Run migrations
- `pnpm db:seed` — Seed the database

## Conventions
- Use Drizzle ORM for all database operations (not raw SQL)
- Shared types go in `packages/shared`, shared DB schema in `packages/db`
- Scrapers: one file per source site in `apps/scraper/src/crawlers/`
- All env vars in root `.env`, accessed via `process.env`
- SSG/ISR for public pages, Server Components where possible
- API routes serve data for future Chrome extension (Phase 2)

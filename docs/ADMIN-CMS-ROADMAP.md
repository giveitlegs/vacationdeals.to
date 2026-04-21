# Admin CMS Roadmap

Comprehensive list of features the admin backend should support.
Built in tiers: **P0 (must-have)** → **P1 (important)** → **P2 (nice-to-have)**.

---

## Authentication & Access Control

### P0
- Admin login (email + password hash via bcrypt)
- HTTP-only session cookies, 30-day expiry
- Logout
- Rate limit on login attempts

### P1
- 2FA/TOTP (authenticator app)
- Password reset via email magic link
- Session list + force logout other devices

### P2
- Role-based access control (super-admin, editor, moderator)
- Audit log of admin actions
- IP allowlist for admin routes

---

## Dashboard (Home)

### P0
- Active deals count, expired count, brands, destinations
- Last scrape times per brand (green/yellow/red)
- Last 10 admin actions
- Recent leads/signups

### P1
- Traffic overview (top pages, top destinations, bounce rate)
- Revenue dashboard (affiliate clicks, B2B inquiries, ad impressions)
- Scrape health heatmap (last 30 days × brand)

### P2
- Custom widgets (drag-reorder)
- Export dashboards to PDF
- Shareable dashboard URLs

---

## Deal Management

### P0
- Paginated deal list with filters (brand, destination, price, status, last-scraped)
- Edit deal fields (title, price, description, resort name, inclusions, URL, image)
- Flag as expired (manual override, updates `isActive=false`)
- Reactivate expired deal
- Feature/pin deal (appears on homepage, rate recap highlights)
- Suppress deal (hide from listings but keep URL live)
- Override scraped price (locked until admin unlocks — scraper won't overwrite)
- Delete deal (soft delete with undo)

### P1
- Bulk actions (expire all by brand, bulk feature, bulk suppress)
- Deal approval queue (new auto-scraped deals require approval before going live)
- Duplicate detection + merge
- Import deals from CSV
- Export deal list to CSV

### P2
- Deal versioning (see all price history inline)
- A/B test different deal descriptions
- Schedule deal activation/deactivation
- Smart suggestions ("This deal looks like a duplicate of X")

---

## Brand Management

### P0
- List all brands with deal counts
- Enable/disable scraper per brand (pauses cron wave)
- Edit brand info (name, description, website, type, logo)
- Suppress brand from rate recap (extends current MRG-style exclusion to UI toggle)
- Set brand color (overrides rate recap chart)
- Pin brand as featured

### P1
- Manually trigger single-brand scrape from UI
- View scraper source code inline
- Set scrape frequency override (hourly, 6h, 12h, daily)
- Brand performance metrics (deal count trend, click-through rate)

### P2
- Add new brand (spawns scraper template)
- Brand health score (last successful scrape, deals produced, conversions)
- Brand-level affiliate link rewriting

---

## Destination Management

### P0
- List destinations with deal counts
- Edit destination (city, state, country, region, slug, lat/lng)
- Upload destination hero image
- Enable/disable destination
- Feature destination on homepage

### P1
- Map-based destination editor (click to place pin)
- Bulk geocoding (paste city list, auto-populate lat/lng)
- Merge destinations (Kissimmee → Orlando)
- Destination SEO editor (meta title, description, H1)

### P2
- Seasonal content per destination (winter vs summer copy)
- Auto-generated destination descriptions via Claude API

---

## Blog/Content Management

### P0
- List all 545+ blog posts with filters (category, featured, date)
- Create/edit blog post (rich editor or markdown)
- Preview before publish
- Schedule posts
- Feature post on blog homepage
- Delete post (soft delete)
- Category management

### P1
- Syndication controls (toggle per post: Dev.to, Hashnode, X, IndexNow)
- Bulk SEO rewrite via Claude API (regenerate meta titles/descriptions)
- Internal link suggestions
- Duplicate content detector
- Generate FAQ from post content via AI

### P2
- Multi-author support
- Editorial workflow (draft → review → publish)
- Translation management (hreflang)
- Content calendar view
- Post performance dashboard (views, avg time, conversions)

---

## Ads & Banners (Partner Management)

### P0
- Create partner ad (static image or HTML)
- Place in: header, sidebar, inline, footer, homepage-hero
- Link URL with UTM tracking
- Schedule (start/end dates)
- Enable/disable
- View impression + click counts

### P1
- Rotating ad groups (A/B rotation, equal weighting)
- Targeting (show Orlando ads only on Orlando pages)
- Weighted rotation (advertiser X gets 60% of impressions)
- Click-through rate reporting
- Revenue per ad

### P2
- Full A/B testing with statistical significance
- Partner self-serve portal (advertisers upload creative themselves)
- Auction-based ad placement
- Automated pause when budget exhausted
- Invoice generation per advertiser

---

## Rate Recap Admin Controls

### P0
- Exclude/include brands (toggle per brand)
- Set duration filter options (which night counts appear)
- Adjust rarity tiers ($ thresholds for common/rare/legendary)
- Override which deals appear "featured" on rate recap

### P1
- Hide specific data points from charts
- Annotation layer (add event markers like "Memorial Day Sale")
- Custom date range presets
- Lock rate recap data (snapshot mode)

### P2
- Compare rate recap performance week-over-week
- Public vs gated views (certain brands visible only to subscribers)

---

## Resort Roulette Admin

### P0
- Deal weighting (1-10 scale, already built)
- Feature/exclude flags (already built)
- Rarity override (already built)
- View spin analytics (total spins, click-through, conversion per deal)

### P1
- Custom wheel skins (seasonal themes: Halloween, holiday, summer)
- Spin limit overrides per session
- Guaranteed-win mode for email-captured users
- Custom confetti colors per destination

### P2
- Multiple wheels (deal roulette, destination roulette, brand roulette)
- Admin-force-spin (test specific outcomes)
- Roulette tournaments (weekly high-score leaderboard)

---

## Email Marketing

### P0
- Subscriber list (from TCPA opt-ins, data_inquiries, consent_records)
- Import/export subscribers (CSV)
- Unsubscribe management (CAN-SPAM compliant)
- Compose + send email campaign (HTML + plain text)
- Basic templates (welcome, weekly digest, new deal alert)
- View send stats (sent, delivered, opened, clicked, bounced)

### P1
- Segmentation (by destination interest, price range, signup source)
- Automation workflows (welcome series, abandoned-spin follow-up, re-engagement)
- A/B subject line testing
- Scheduled campaigns
- Template library with version control

### P2
- Predictive send-time optimization
- RFM (recency, frequency, monetary) segmentation
- Behavioral triggers (viewed Orlando 3× → send Orlando digest)
- Cross-channel orchestration (email → SMS → web push)

---

## SMS Marketing

### P0
- Opt-in list (phone numbers from consent_records)
- Send SMS blast (compliant with TCPA)
- STOP/HELP auto-replies
- Delivery reports (sent, delivered, failed)

### P1
- Two-way conversations (reply handling)
- Automated drip campaigns
- MMS (images)
- Link shortener + click tracking

### P2
- Conversational AI (Claude-powered auto-responder for basic inquiries)
- Number rental/porting
- International SMS routing

---

## B2B Data Reports

### P0
- View inquiries (who requested data)
- Update inquiry status (new → contacted → qualified → closed)
- Manually generate + download report (all formats)
- Set pricing tiers

### P1
- Invoice generation (PDF)
- Stripe checkout integration
- Customer portal (re-download past reports)
- Report usage analytics (which clients use what)

### P2
- API access tokens (clients pull data via API)
- Usage-based billing
- White-labeled reports
- Automated report generation + delivery on subscription

---

## Scraper Operations

### P0
- Manually trigger any scraper from UI
- View real-time scrape logs
- Cron schedule editor
- Pause/resume all scrapers (global kill switch)
- View last N scrape runs per brand

### P1
- Price verification queue (review flagged stale deals)
- Failed scrape alerts
- Sitemap ingestion (feed target site sitemaps to scrapers)
- Custom scrape depth/rate per brand

### P2
- Visual scraper builder (point-and-click CSS selectors)
- Automatic selector healing (ML detects when site changes layout)
- Distributed scraping (multiple VPS nodes)
- Proxy pool management

---

## SEO Management

### P0
- SEO health dashboard (from seoHealth table)
- Broken link checker + fix queue
- 404 report with redirect suggestions
- Robots.txt editor
- Sitemap regeneration

### P1
- Schema markup validator
- Core Web Vitals monitoring
- Keyword rank tracking (via API: Ahrefs, SEMrush)
- Backlink monitoring
- Content gap analysis

### P2
- Automated SEO fixes (missing alt tags, thin content warnings)
- Internal linking auto-suggestions
- Competitor rank comparison

---

## User/Lead Management

### P0
- Lead list from all sources (roulette, data inquiries, email signups)
- Filter by source, status, date
- Export to CSV
- Mark lead status (new, contacted, converted)
- Delete lead (GDPR)

### P1
- Lead scoring (behavioral + demographic)
- Merge duplicate leads
- Tag leads with custom labels
- Lead enrichment (attach extra data)
- Automated lead routing to CRM

### P2
- Salesforce/HubSpot sync
- Lead attribution (which page/campaign converted)
- Lifetime value tracking

---

## Comments/UGC Moderation

### P0
- (Once user-submitted content exists) moderation queue
- Approve/reject/ban actions
- Spam filter

### P1
- Automated moderation via Claude API
- User reputation scoring

---

## Settings

### P0
- Site settings (title, tagline, contact email, support phone)
- GTM/GA IDs
- Feature flags (enable/disable pages)
- Environment variable viewer (masked)

### P1
- API key management (Meta, Stripe, Resend, Twilio)
- Webhook configuration
- Legal page versioning (track changes to Privacy/Terms)

### P2
- Multi-tenant config (for future white-label)
- Custom domain per brand
- Theme editor (CSS variables)

---

## Monitoring & Alerts

### P0
- System health (uptime, DB connections, scrape success rate)
- Alert on errors (email admin)

### P1
- Slack/Discord webhook integration
- Custom alert thresholds
- Incident log

### P2
- PagerDuty integration
- On-call rotation management

---

## Build Priority (Tonight's Session)

**P0 Foundation:**
1. Admin auth (password login, session cookie)
2. Admin layout with sidebar nav
3. Dashboard (basic stats)
4. Deal management (list, edit, flag, suppress, feature)
5. Brand management (enable/disable, suppress, feature)
6. Ad banners (create, schedule, track)
7. Leads/subscribers list (from existing data_inquiries + consent_records)
8. Scraper controls (trigger, view logs)

**P0 Email infrastructure:**
- Resend API integration
- /api/email/send endpoint
- Subscribers table (unified from existing sources)
- Unsubscribe page + token system

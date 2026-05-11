import {
  pgTable,
  serial,
  text,
  varchar,
  integer,
  boolean,
  timestamp,
  decimal,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ── Brands ──────────────────────────────────────────────
export const brands = pgTable("brands", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  logoUrl: text("logo_url"),
  website: text("website"),
  type: varchar("type", { length: 50 }).notNull().default("broker"), // "direct" | "broker"
  description: text("description"),
  isSuppressed: boolean("is_suppressed").notNull().default(false),
  // Corporate / outreach metadata (for B2B sales prospecting)
  parentCompany: varchar("parent_company", { length: 255 }),
  hqAddress: text("hq_address"),
  hqCity: varchar("hq_city", { length: 100 }),
  hqState: varchar("hq_state", { length: 50 }),
  hqCountry: varchar("hq_country", { length: 50 }),
  hqZip: varchar("hq_zip", { length: 20 }),
  mainPhone: varchar("main_phone", { length: 50 }),
  generalEmail: varchar("general_email", { length: 255 }),
  linkedinUrl: text("linkedin_url"),
  crunchbaseUrl: text("crunchbase_url"),
  ownership: varchar("ownership", { length: 50 }), // "public" | "private" | "pe-owned" | "subsidiary"
  yearFounded: integer("year_founded"),
  employeeCount: varchar("employee_count", { length: 50 }), // "1-50" | "51-200" | etc
  estRevenue: varchar("est_revenue", { length: 50 }),
  contactsLastResearchedAt: timestamp("contacts_last_researched_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const brandsRelations = relations(brands, ({ many }) => ({
  deals: many(deals),
  contacts: many(brandContacts),
}));

// ── Brand contacts (B2B outreach leads) ────────────────────────────────
// One row per known person at a brand. Roles like CEO, VP Marketing,
// Partnerships, Press, etc. Populated by research agents from public sources
// (LinkedIn, Crunchbase, press releases, company websites). Never store
// home addresses; only business contact info.
export const brandContacts = pgTable("brand_contacts", {
  id: serial("id").primaryKey(),
  brandId: integer("brand_id").references(() => brands.id, { onDelete: "cascade" }).notNull(),
  role: varchar("role", { length: 100 }).notNull(), // "CEO" | "CMO" | "VP Marketing" | "Partnerships" | "Press" | ...
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  linkedinUrl: text("linkedin_url"),
  source: varchar("source", { length: 100 }), // "linkedin" | "crunchbase" | "press_release" | "company_website" | "rocketreach" | "manual"
  sourceUrl: text("source_url"),
  confidence: varchar("confidence", { length: 20 }).default("medium"), // "high" | "medium" | "low"
  notes: text("notes"),
  lastVerifiedAt: timestamp("last_verified_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const brandContactsRelations = relations(brandContacts, ({ one }) => ({
  brand: one(brands, { fields: [brandContacts.brandId], references: [brands.id] }),
}));

// ── Destinations ────────────────────────────────────────
export const destinations = pgTable(
  "destinations",
  {
    id: serial("id").primaryKey(),
    city: varchar("city", { length: 255 }).notNull(),
    state: varchar("state", { length: 100 }),
    region: varchar("region", { length: 100 }),
    country: varchar("country", { length: 100 }).notNull().default("US"),
    slug: varchar("slug", { length: 255 }).notNull().unique(),
    latitude: decimal("latitude", { precision: 10, scale: 7 }),
    longitude: decimal("longitude", { precision: 10, scale: 7 }),
    imageUrl: text("image_url"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
);

export const destinationsRelations = relations(destinations, ({ many }) => ({
  deals: many(deals),
}));

// ── Sources (scrape target websites) ────────────────────
export const sources = pgTable("sources", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  baseUrl: text("base_url").notNull(),
  scraperKey: varchar("scraper_key", { length: 100 }).notNull().unique(),
  lastScrapedAt: timestamp("last_scraped_at"),
  status: varchar("status", { length: 50 }).notNull().default("active"),
  dealCount: integer("deal_count").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const sourcesRelations = relations(sources, ({ many }) => ({
  deals: many(deals),
}));

// ── Deals ───────────────────────────────────────────────
export const deals = pgTable(
  "deals",
  {
    id: serial("id").primaryKey(),
    brandId: integer("brand_id").references(() => brands.id),
    destinationId: integer("destination_id").references(() => destinations.id),
    sourceId: integer("source_id").references(() => sources.id),
    title: varchar("title", { length: 500 }).notNull(),
    slug: varchar("slug", { length: 500 }).notNull().unique(),
    price: decimal("price", { precision: 10, scale: 2 }).notNull(),
    originalPrice: decimal("original_price", { precision: 10, scale: 2 }),
    durationNights: integer("duration_nights").notNull(),
    durationDays: integer("duration_days").notNull(),
    description: text("description"),
    resortName: varchar("resort_name", { length: 500 }),
    url: text("url").notNull(),
    imageUrl: text("image_url"),
    inclusions: text("inclusions"), // JSON string of what's included
    requirements: text("requirements"), // JSON string (income, residency, etc.)
    presentationMinutes: integer("presentation_minutes"),
    travelWindow: varchar("travel_window", { length: 255 }),
    savingsPercent: integer("savings_percent"),
    isActive: boolean("is_active").notNull().default(true),
    scrapedAt: timestamp("scraped_at").defaultNow().notNull(),
    expiresAt: timestamp("expires_at"),
    reviewHtml: text("review_html"),
    reviewGeneratedAt: timestamp("review_generated_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("deals_url_idx").on(table.url),
  ],
);

export const dealsRelations = relations(deals, ({ one, many }) => ({
  brand: one(brands, { fields: [deals.brandId], references: [brands.id] }),
  destination: one(destinations, {
    fields: [deals.destinationId],
    references: [destinations.id],
  }),
  source: one(sources, { fields: [deals.sourceId], references: [sources.id] }),
  priceHistory: many(dealPriceHistory),
}));

// ── Deal Price History ──────────────────────────────────
export const dealPriceHistory = pgTable("deal_price_history", {
  id: serial("id").primaryKey(),
  dealId: integer("deal_id")
    .references(() => deals.id, { onDelete: "cascade" })
    .notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  scrapedAt: timestamp("scraped_at").defaultNow().notNull(),
});

export const dealPriceHistoryRelations = relations(
  dealPriceHistory,
  ({ one }) => ({
    deal: one(deals, {
      fields: [dealPriceHistory.dealId],
      references: [deals.id],
    }),
  }),
);

// ── Site Settings ───────────────────────────────────────
export const siteSettings = pgTable("site_settings", {
  id: serial("id").primaryKey(),
  key: varchar("key", { length: 255 }).notNull().unique(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ── SEO Health ─────────────────────────────────────────
export const seoHealth = pgTable("seo_health", {
  id: serial("id").primaryKey(),
  url: text("url").notNull(),
  checkType: varchar("check_type", { length: 100 }).notNull(), // "status", "title", "meta", "schema", "canonical", "alt", "link"
  severity: varchar("severity", { length: 20 }).notNull(), // "critical", "high", "medium", "low"
  message: text("message").notNull(),
  details: text("details"), // JSON string with extra context
  isResolved: boolean("is_resolved").notNull().default(false),
  checkedAt: timestamp("checked_at").defaultNow().notNull(),
  resolvedAt: timestamp("resolved_at"),
});

// ── Blog Posts ────────────────────────────────────────────
export const blogPosts = pgTable("blog_posts", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 500 }).notNull().unique(),
  title: varchar("title", { length: 500 }).notNull(),
  metaTitle: varchar("meta_title", { length: 200 }).notNull(),
  metaDescription: text("meta_description").notNull(),
  category: varchar("category", { length: 50 }).notNull(), // destinations, brands, interests, segments
  publishDate: timestamp("publish_date").notNull(),
  author: varchar("author", { length: 255 }).notNull().default("The VacationDeals.to Team"),
  readTime: varchar("read_time", { length: 50 }),
  bluf: text("bluf").notNull(), // Bottom Line Up Front
  heroImageAlt: text("hero_image_alt"),
  heroGradient: varchar("hero_gradient", { length: 255 }),
  content: text("content").notNull(), // Full HTML content
  faqs: text("faqs").notNull(), // JSON string of FAQ array
  internalLinks: text("internal_links"), // JSON string
  relatedSlugs: text("related_slugs"), // JSON string
  tags: text("tags"), // JSON string
  isPublished: boolean("is_published").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ── Scrape Runs (provenance logging) ───────────────────
export const scrapeRuns = pgTable("scrape_runs", {
  id: serial("id").primaryKey(),
  sourceId: integer("source_id").references(() => sources.id),
  scraperKey: varchar("scraper_key", { length: 100 }).notNull(),
  startedAt: timestamp("started_at").notNull(),
  finishedAt: timestamp("finished_at"),
  dealsFound: integer("deals_found").default(0),
  dealsStored: integer("deals_stored").default(0),
  urlsCrawled: integer("urls_crawled").default(0),
  status: varchar("status", { length: 50 }).notNull().default("running"), // running, success, failed
  errorMessage: text("error_message"),
  pagesVisited: text("pages_visited"), // JSON array of URLs crawled
});

// ── Data Inquiries (B2B leads) ─────────────────────────
export const dataInquiries = pgTable("data_inquiries", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  company: varchar("company", { length: 255 }),
  message: text("message"),
  inquiryType: varchar("inquiry_type", { length: 50 }).notNull().default("historical_data"), // historical_data, api_access, custom_report
  status: varchar("status", { length: 50 }).notNull().default("new"), // new, contacted, qualified, closed
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ── Consent Records (TCPA compliance) ──────────────────
export const consentRecords = pgTable("consent_records", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 50 }),
  ipAddress: varchar("ip_address", { length: 100 }).notNull(),
  userAgent: text("user_agent"),
  formSource: varchar("form_source", { length: 100 }).notNull(), // "roulette_optin", "deal_alerts", "data_inquiry"
  consentText: text("consent_text").notNull(), // exact checkbox text user agreed to
  tcpaConsent: boolean("tcpa_consent").notNull().default(false),
  termsConsent: boolean("terms_consent").notNull().default(false),
  doubleOptInConfirmed: boolean("double_opt_in_confirmed").notNull().default(false),
  consentedAt: timestamp("consented_at").defaultNow().notNull(),
});

// ── Ad Banners ──────────────────────────────────────────
// ── Ad Library Pages (Facebook/Meta advertiser pages) ──
export const adLibraryPages = pgTable("ad_library_pages", {
  id: serial("id").primaryKey(),
  brandId: integer("brand_id").references(() => brands.id),
  pageId: varchar("page_id", { length: 100 }).notNull().unique(), // Facebook Page ID
  pageName: varchar("page_name", { length: 500 }).notNull(),
  pageUrl: text("page_url"), // facebook.com/{page}
  platform: varchar("platform", { length: 50 }).default("facebook"), // facebook, instagram
  totalAdsFound: integer("total_ads_found").default(0),
  lastScrapedAt: timestamp("last_scraped_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ── Ad Library Ads (scraped from Meta Ad Library) ──────
export const adLibraryAds = pgTable("ad_library_ads", {
  id: serial("id").primaryKey(),
  adLibraryPageId: integer("ad_library_page_id").references(() => adLibraryPages.id),
  brandId: integer("brand_id").references(() => brands.id),
  metaAdId: varchar("meta_ad_id", { length: 100 }).notNull().unique(), // Meta's ad library ID
  adCreativeBody: text("ad_creative_body"), // Main ad copy
  adCreativeLinkTitle: text("ad_creative_link_title"), // CTA title
  adCreativeLinkDescription: text("ad_creative_link_description"), // CTA description
  adCreativeLinkCaption: text("ad_creative_link_caption"), // CTA caption
  adSnapshotUrl: text("ad_snapshot_url"), // URL to view ad creative on Meta
  adDeliveryStartTime: timestamp("ad_delivery_start_time"),
  adDeliveryStopTime: timestamp("ad_delivery_stop_time"),
  adCreationTime: timestamp("ad_creation_time"),
  publisherPlatforms: text("publisher_platforms"), // JSON array: ["FACEBOOK","INSTAGRAM"]
  languages: text("languages"), // JSON array of ISO 639-1 codes
  isActive: boolean("is_active").notNull().default(true),
  scrapedAt: timestamp("scraped_at").defaultNow().notNull(),
});

export const adLibraryAdsRelations = relations(adLibraryAds, ({ one }) => ({
  brand: one(brands, { fields: [adLibraryAds.brandId], references: [brands.id] }),
  page: one(adLibraryPages, { fields: [adLibraryAds.adLibraryPageId], references: [adLibraryPages.id] }),
}));

// ── Admin Users ────────────────────────────────────────
export const adminUsers = pgTable("admin_users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: varchar("name", { length: 255 }),
  role: varchar("role", { length: 50 }).notNull().default("admin"), // super-admin, admin, editor, moderator
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const adminSessions = pgTable("admin_sessions", {
  id: serial("id").primaryKey(),
  token: varchar("token", { length: 100 }).notNull().unique(),
  adminUserId: integer("admin_user_id").references(() => adminUsers.id, { onDelete: "cascade" }).notNull(),
  ipAddress: varchar("ip_address", { length: 100 }),
  userAgent: text("user_agent"),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const adminActions = pgTable("admin_actions", {
  id: serial("id").primaryKey(),
  adminUserId: integer("admin_user_id").references(() => adminUsers.id),
  action: varchar("action", { length: 100 }).notNull(), // deal.expire, deal.feature, brand.suppress, etc.
  entityType: varchar("entity_type", { length: 50 }),
  entityId: integer("entity_id"),
  details: text("details"), // JSON
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ── Subscribers (unified email/SMS list) ───────────────
export const subscribers = pgTable("subscribers", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  phone: varchar("phone", { length: 50 }),
  name: varchar("name", { length: 255 }),
  source: varchar("source", { length: 100 }), // roulette, data_inquiry, newsletter, etc.
  status: varchar("status", { length: 50 }).notNull().default("active"), // active, unsubscribed, bounced, spam
  unsubscribeToken: varchar("unsubscribe_token", { length: 100 }).unique(),
  tags: text("tags"), // JSON array
  preferences: text("preferences"), // JSON: { emailOptIn, smsOptIn, weeklyDigest, dealAlerts }
  lastEmailedAt: timestamp("last_emailed_at"),
  unsubscribedAt: timestamp("unsubscribed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ── Email Campaigns ────────────────────────────────────
export const emailCampaigns = pgTable("email_campaigns", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  subject: varchar("subject", { length: 500 }).notNull(),
  htmlBody: text("html_body").notNull(),
  textBody: text("text_body"),
  fromName: varchar("from_name", { length: 255 }).default("VacationDeals.to"),
  fromEmail: varchar("from_email", { length: 255 }).default("hello@vacationdeals.to"),
  segmentFilter: text("segment_filter"), // JSON filter for subscribers
  status: varchar("status", { length: 50 }).notNull().default("draft"), // draft, scheduled, sending, sent
  scheduledAt: timestamp("scheduled_at"),
  sentAt: timestamp("sent_at"),
  totalSent: integer("total_sent").default(0),
  totalOpened: integer("total_opened").default(0),
  totalClicked: integer("total_clicked").default(0),
  totalBounced: integer("total_bounced").default(0),
  totalUnsubscribed: integer("total_unsubscribed").default(0),
  createdByAdminId: integer("created_by_admin_id").references(() => adminUsers.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ── Email Sends (per-recipient tracking) ───────────────
export const emailSends = pgTable("email_sends", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaign_id").references(() => emailCampaigns.id, { onDelete: "cascade" }),
  subscriberId: integer("subscriber_id").references(() => subscribers.id, { onDelete: "cascade" }),
  email: varchar("email", { length: 255 }).notNull(),
  providerMessageId: varchar("provider_message_id", { length: 255 }), // Resend ID
  status: varchar("status", { length: 50 }).notNull().default("sent"), // sent, delivered, opened, clicked, bounced, complained
  sentAt: timestamp("sent_at").defaultNow().notNull(),
  openedAt: timestamp("opened_at"),
  clickedAt: timestamp("clicked_at"),
});

// ── Site Discovery (full crawl of brand websites) ──────
export const sitePages = pgTable("site_pages", {
  id: serial("id").primaryKey(),
  sourceId: integer("source_id").references(() => sources.id),
  url: text("url").notNull(),
  title: varchar("title", { length: 500 }),
  statusCode: integer("status_code"),
  contentType: varchar("content_type", { length: 100 }),
  hasPrice: boolean("has_price").default(false),
  priceFound: decimal("price_found", { precision: 10, scale: 2 }),
  wordCount: integer("word_count"),
  lastCrawledAt: timestamp("last_crawled_at").defaultNow().notNull(),
  discoveredAt: timestamp("discovered_at").defaultNow().notNull(),
});

// ── Roulette Deals (admin-weighted deals for Resort Roulette) ──
export const rouletteDeals = pgTable("roulette_deals", {
  id: serial("id").primaryKey(),
  dealId: integer("deal_id").references(() => deals.id, { onDelete: "cascade" }).notNull().unique(),
  weight: integer("weight").notNull().default(5),
  isFeatured: boolean("is_featured").notNull().default(false),
  isExcluded: boolean("is_excluded").notNull().default(false),
  rarity: varchar("rarity", { length: 20 }).notNull().default("common"),
  spinCount: integer("spin_count").notNull().default(0),
  clickCount: integer("click_count").notNull().default(0),
  conversionCount: integer("conversion_count").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ── Roulette Spins (log every spin for analytics) ──────
export const rouletteSpins = pgTable("roulette_spins", {
  id: serial("id").primaryKey(),
  dealId: integer("deal_id").references(() => deals.id),
  sessionId: varchar("session_id", { length: 100 }),
  userAgent: text("user_agent"),
  clicked: boolean("clicked").notNull().default(false),
  rarity: varchar("rarity", { length: 20 }),
  spunAt: timestamp("spun_at").defaultNow().notNull(),
});

// ── Sublanders (admin overrides for city×modifier pages) ──
// Pairs live in code (packages/shared/sublanders.ts) for SEO stability. This
// table lets admin toggle visibility and override copy without redeploying.
export const sublanders = pgTable(
  "sublanders",
  {
    id: serial("id").primaryKey(),
    citySlug: varchar("city_slug", { length: 100 }).notNull(),
    modifierSlug: varchar("modifier_slug", { length: 100 }).notNull(),
    isEnabled: boolean("is_enabled").notNull().default(true),
    customIntroHtml: text("custom_intro_html"),
    customMetaTitle: varchar("custom_meta_title", { length: 200 }),
    customMetaDescription: varchar("custom_meta_description", { length: 300 }),
    sortOrder: integer("sort_order").notNull().default(0),
    viewCount: integer("view_count").notNull().default(0),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [uniqueIndex("sublanders_city_modifier_idx").on(t.citySlug, t.modifierSlug)],
);

// ── Core Web Vitals ──────────────────────────────────────
// Stores PageSpeed Insights results per URL+device. Each run adds a new row
// (history) so trends can be charted. Admin at /admin/cwv shows latest.
export const cwvResults = pgTable("cwv_results", {
  id: serial("id").primaryKey(),
  url: text("url").notNull(),
  strategy: varchar("strategy", { length: 20 }).notNull(), // "mobile" | "desktop"
  // Core Web Vitals (milliseconds for timing, unitless for CLS)
  lcp: decimal("lcp", { precision: 10, scale: 2 }),  // largest contentful paint (ms)
  cls: decimal("cls", { precision: 6, scale: 4 }),    // cumulative layout shift (unitless)
  inp: decimal("inp", { precision: 10, scale: 2 }),   // interaction to next paint (ms)
  fcp: decimal("fcp", { precision: 10, scale: 2 }),   // first contentful paint (ms)
  ttfb: decimal("ttfb", { precision: 10, scale: 2 }), // time to first byte (ms)
  // Lighthouse category scores (0-100 integer, from PSI's 0-1 float * 100)
  performanceScore: integer("performance_score"),
  accessibilityScore: integer("accessibility_score"),
  bestPracticesScore: integer("best_practices_score"),
  seoScore: integer("seo_score"),
  errorMessage: text("error_message"),
  checkedAt: timestamp("checked_at").defaultNow().notNull(),
});

// ── Prospect tracking ────────────────────────────────────
// Logged each time a UTM-matched prospect banner renders. Gives sales
// a "this prospect clicked my outreach link X times, last seen Y" signal.
export const prospectClicks = pgTable("prospect_clicks", {
  id: serial("id").primaryKey(),
  prospectBrandSlug: varchar("prospect_brand_slug", { length: 100 }).notNull(),
  ipHash: varchar("ip_hash", { length: 64 }),
  userAgent: text("user_agent"),
  referer: text("referer"),
  pagePath: text("page_path"),
  bannerPosition: varchar("banner_position", { length: 50 }),
  viewedAt: timestamp("viewed_at").defaultNow().notNull(),
});

// ── Pitch Diaries (crowdsourced presentation transcripts) ──
// Anonymous submissions from people who attended a timeshare pitch.
// We moderate (status=pending → approved) before exposing publicly.
// The corpus becomes a searchable record of presenter tactics by brand.
export const pitchDiaries = pgTable("pitch_diaries", {
  id: serial("id").primaryKey(),
  brandId: integer("brand_id").references(() => brands.id),
  brandSlug: varchar("brand_slug", { length: 100 }), // denormalized for filtering speed
  // Where + when
  locationCity: varchar("location_city", { length: 100 }),
  resortName: varchar("resort_name", { length: 255 }),
  attendedAt: timestamp("attended_at"),
  durationMinutes: integer("duration_minutes"),
  // What happened
  pressureLevel: integer("pressure_level"), // 1-10 self-rating
  presenterCount: integer("presenter_count"), // # of salespeople rotated through
  managersBroughtIn: integer("managers_brought_in"),
  closingOffer: text("closing_offer"), // final pitch number
  pricesQuoted: text("prices_quoted"), // JSON array, every price they mentioned
  notableQuotes: text("notable_quotes"), // JSON array of memorable lines
  story: text("story").notNull(), // the narrative recap
  didTheyBuy: boolean("did_they_buy").default(false),
  // Submission metadata
  submitterEmail: varchar("submitter_email", { length: 255 }),
  submitterIpHash: varchar("submitter_ip_hash", { length: 64 }),
  status: varchar("status", { length: 20 }).notNull().default("pending"), // pending, approved, rejected
  rejectionReason: text("rejection_reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  approvedAt: timestamp("approved_at"),
});

// ── Scout Network applications (interest only — payment TBD) ──
export const scoutApplications = pgTable("scout_applications", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 50 }),
  cityState: varchar("city_state", { length: 100 }),
  willingToTravelMiles: integer("willing_to_travel_miles"),
  brandsExperienced: text("brands_experienced"), // JSON array of brand slugs
  whyInterested: text("why_interested"),
  ipHash: varchar("ip_hash", { length: 64 }),
  userAgent: text("user_agent"),
  status: varchar("status", { length: 20 }).notNull().default("new"), // new, contacted, approved, rejected
  contactedAt: timestamp("contacted_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ── Ad Banners ──────────────────────────────────────────
export const adBanners = pgTable("ad_banners", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  position: varchar("position", { length: 100 }).notNull(), // "header" | "hero" | "sidebar" | "inline" | "footer"
  htmlContent: text("html_content"),
  imageUrl: text("image_url"),
  linkUrl: text("link_url"),
  // Sales-prospecting: when set, this banner only renders for visitors whose
  // ?utm_content=<value> matches. Lets us send a brand-specific link to a
  // prospect ("see what your branded banner would look like") without
  // changing the default banner everyone else sees.
  utmContentMatch: varchar("utm_content_match", { length: 100 }),
  // Standard ad sizes (px). Set to enforce display dimensions.
  width: integer("width"),
  height: integer("height"),
  // Optional brand association (so reports group by prospect)
  prospectBrandSlug: varchar("prospect_brand_slug", { length: 100 }),
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

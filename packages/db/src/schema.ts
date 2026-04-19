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
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const brandsRelations = relations(brands, ({ many }) => ({
  deals: many(deals),
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

// ── Ad Banners ──────────────────────────────────────────
export const adBanners = pgTable("ad_banners", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  position: varchar("position", { length: 100 }).notNull(), // "header" | "sidebar" | "inline" | "footer"
  htmlContent: text("html_content"),
  imageUrl: text("image_url"),
  linkUrl: text("link_url"),
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

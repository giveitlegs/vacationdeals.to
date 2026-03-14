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

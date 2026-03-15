import type { Deal } from "@/components/DealCard";

// ---------------------------------------------------------------------------
// Database query helpers with graceful fallback
// All functions use dynamic imports to avoid build-time errors when DB is
// unavailable. Each returns null or empty arrays on failure so callers can
// fall back to mock/static data.
// ---------------------------------------------------------------------------

async function getDB() {
  try {
    const { db } = await import("@vacationdeals/db");
    const schema = await import("@vacationdeals/db");
    return { db, schema };
  } catch (e) {
    console.error("[queries] getDB failed:", e);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Get deals with optional filters
// ---------------------------------------------------------------------------

export async function getDeals(filters?: {
  destinationSlug?: string;
  brandSlug?: string;
  maxPrice?: number;
  minPrice?: number;
  durationNights?: number;
  sortBy?: string;
  page?: number;
  limit?: number;
}): Promise<{ deals: Deal[]; total: number } | null> {
  try {
    const conn = await getDB();
    if (!conn) return null;
    const { db, schema } = conn;
    const { sql, eq, and, gte, lte, desc, asc, count } = await import(
      "drizzle-orm"
    );

    const page = filters?.page ?? 1;
    const limit = filters?.limit ?? 100;
    const offset = (page - 1) * limit;

    // Build conditions
    const conditions: ReturnType<typeof eq>[] = [
      eq(schema.deals.isActive, true),
    ];

    if (filters?.destinationSlug) {
      // Sub-query for destination id
      const dest = await db
        .select({ id: schema.destinations.id })
        .from(schema.destinations)
        .where(eq(schema.destinations.slug, filters.destinationSlug))
        .limit(1);
      if (dest.length > 0) {
        conditions.push(eq(schema.deals.destinationId, dest[0].id));
      } else {
        return { deals: [], total: 0 };
      }
    }

    if (filters?.brandSlug) {
      const brand = await db
        .select({ id: schema.brands.id })
        .from(schema.brands)
        .where(eq(schema.brands.slug, filters.brandSlug))
        .limit(1);
      if (brand.length > 0) {
        conditions.push(eq(schema.deals.brandId, brand[0].id));
      } else {
        return { deals: [], total: 0 };
      }
    }

    if (filters?.maxPrice) {
      conditions.push(
        lte(schema.deals.price, String(filters.maxPrice)),
      );
    }

    if (filters?.minPrice) {
      conditions.push(
        gte(schema.deals.price, String(filters.minPrice)),
      );
    }

    if (filters?.durationNights) {
      conditions.push(
        eq(schema.deals.durationNights, filters.durationNights),
      );
    }

    const whereClause = and(...conditions);

    // Determine sort order
    let orderBy;
    switch (filters?.sortBy) {
      case "price-asc":
        orderBy = asc(schema.deals.price);
        break;
      case "price-desc":
        orderBy = desc(schema.deals.price);
        break;
      case "duration":
        orderBy = asc(schema.deals.durationNights);
        break;
      case "savings":
        orderBy = desc(schema.deals.savingsPercent);
        break;
      default:
        orderBy = asc(schema.deals.price);
    }

    // Get total count
    const totalResult = await db
      .select({ count: count() })
      .from(schema.deals)
      .where(whereClause);
    const total = totalResult[0]?.count ?? 0;

    // Get deals with joined brand & destination
    const rows = await db
      .select({
        id: schema.deals.id,
        title: schema.deals.title,
        slug: schema.deals.slug,
        price: schema.deals.price,
        originalPrice: schema.deals.originalPrice,
        durationNights: schema.deals.durationNights,
        durationDays: schema.deals.durationDays,
        resortName: schema.deals.resortName,
        imageUrl: schema.deals.imageUrl,
        inclusions: schema.deals.inclusions,
        savingsPercent: schema.deals.savingsPercent,
        brandName: schema.brands.name,
        brandSlug: schema.brands.slug,
        city: schema.destinations.city,
        state: schema.destinations.state,
      })
      .from(schema.deals)
      .leftJoin(schema.brands, sql`${schema.deals.brandId} = ${schema.brands.id}`)
      .leftJoin(
        schema.destinations,
        sql`${schema.deals.destinationId} = ${schema.destinations.id}`,
      )
      .where(whereClause)
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset);

    const deals: Deal[] = rows.map((r) => ({
      id: r.id,
      title: r.title,
      slug: r.slug,
      price: Number(r.price),
      originalPrice: Number(r.originalPrice ?? 0),
      durationNights: r.durationNights,
      durationDays: r.durationDays,
      resortName: r.resortName ?? r.title,
      imageUrl: r.imageUrl ?? undefined,
      inclusions: parseInclusions(r.inclusions),
      savingsPercent: r.savingsPercent ?? 0,
      brandName: r.brandName ?? "Unknown",
      brandSlug: r.brandSlug ?? "unknown",
      city: r.city ?? "Unknown",
      state: r.state ?? "",
    }));

    return { deals, total };
  } catch (e) {
    console.error("[queries] getDeals failed:", e);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Get all brands with deal counts
// ---------------------------------------------------------------------------

export interface BrandWithCount {
  name: string;
  slug: string;
  type: string;
  description: string | null;
  deals: number;
}

export async function getBrandsWithCounts(): Promise<BrandWithCount[] | null> {
  try {
    const conn = await getDB();
    if (!conn) return null;
    const { db, schema } = conn;
    const { sql, eq, count } = await import("drizzle-orm");

    const rows = await db
      .select({
        name: schema.brands.name,
        slug: schema.brands.slug,
        type: schema.brands.type,
        description: schema.brands.description,
        deals: count(schema.deals.id),
      })
      .from(schema.brands)
      .leftJoin(
        schema.deals,
        sql`${schema.deals.brandId} = ${schema.brands.id} AND ${schema.deals.isActive} = true`,
      )
      .groupBy(
        schema.brands.id,
        schema.brands.name,
        schema.brands.slug,
        schema.brands.type,
        schema.brands.description,
      )
      .orderBy(sql`count(${schema.deals.id}) DESC`);

    if (rows.length === 0) return null;

    return rows.map((r) => ({
      name: r.name,
      slug: r.slug,
      type: r.type,
      description: r.description,
      deals: r.deals,
    }));
  } catch (e) {
    console.error("[queries] getBrandsWithCounts failed:", e);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Get all destinations with deal counts
// ---------------------------------------------------------------------------

export interface DestinationWithCount {
  name: string;
  slug: string;
  state: string | null;
  deals: number;
}

export async function getDestinationsWithCounts(): Promise<
  DestinationWithCount[] | null
> {
  try {
    const conn = await getDB();
    if (!conn) return null;
    const { db, schema } = conn;
    const { sql, eq, count } = await import("drizzle-orm");

    const rows = await db
      .select({
        name: schema.destinations.city,
        slug: schema.destinations.slug,
        state: schema.destinations.state,
        deals: count(schema.deals.id),
      })
      .from(schema.destinations)
      .leftJoin(
        schema.deals,
        sql`${schema.deals.destinationId} = ${schema.destinations.id} AND ${schema.deals.isActive} = true`,
      )
      .groupBy(
        schema.destinations.id,
        schema.destinations.city,
        schema.destinations.slug,
        schema.destinations.state,
      )
      .orderBy(sql`count(${schema.deals.id}) DESC`);

    if (rows.length === 0) return null;

    return rows.map((r) => ({
      name: r.name,
      slug: r.slug,
      state: r.state,
      deals: r.deals,
    }));
  } catch (e) {
    console.error("[queries] getDestinationsWithCounts failed:", e);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Get a single brand by slug
// ---------------------------------------------------------------------------

export interface BrandDetail {
  name: string;
  slug: string;
  type: string;
  description: string | null;
  website: string | null;
  dealCount: number;
  cheapestPrice: number | null;
  destinations: string[];
}

export async function getBrandBySlug(
  slug: string,
): Promise<BrandDetail | null> {
  try {
    const conn = await getDB();
    if (!conn) return null;
    const { db, schema } = conn;
    const { eq, and, sql, count, min } = await import("drizzle-orm");

    const brandRows = await db
      .select()
      .from(schema.brands)
      .where(eq(schema.brands.slug, slug))
      .limit(1);

    if (brandRows.length === 0) return null;
    const brand = brandRows[0];

    // Stats
    const statsRows = await db
      .select({
        dealCount: count(schema.deals.id),
        cheapestPrice: min(schema.deals.price),
      })
      .from(schema.deals)
      .where(
        and(
          eq(schema.deals.brandId, brand.id),
          eq(schema.deals.isActive, true),
        ),
      );

    // Destinations for this brand
    const destRows = await db
      .selectDistinct({ city: schema.destinations.city })
      .from(schema.deals)
      .leftJoin(
        schema.destinations,
        sql`${schema.deals.destinationId} = ${schema.destinations.id}`,
      )
      .where(
        and(
          eq(schema.deals.brandId, brand.id),
          eq(schema.deals.isActive, true),
        ),
      );

    return {
      name: brand.name,
      slug: brand.slug,
      type: brand.type,
      description: brand.description,
      website: brand.website,
      dealCount: statsRows[0]?.dealCount ?? 0,
      cheapestPrice: statsRows[0]?.cheapestPrice
        ? Number(statsRows[0].cheapestPrice)
        : null,
      destinations: destRows
        .map((d) => d.city)
        .filter((c): c is string => c !== null),
    };
  } catch (e) {
    console.error("[queries] getBrandBySlug failed:", e);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Get a single destination by slug
// ---------------------------------------------------------------------------

export interface DestinationDetail {
  name: string;
  slug: string;
  state: string | null;
  description?: string;
  dealCount: number;
  cheapestPrice: number | null;
  brands: string[];
  durations: number[];
}

export async function getDestinationBySlug(
  slug: string,
): Promise<DestinationDetail | null> {
  try {
    const conn = await getDB();
    if (!conn) return null;
    const { db, schema } = conn;
    const { eq, and, sql, count, min } = await import("drizzle-orm");

    const destRows = await db
      .select()
      .from(schema.destinations)
      .where(eq(schema.destinations.slug, slug))
      .limit(1);

    if (destRows.length === 0) return null;
    const dest = destRows[0];

    // Stats
    const statsRows = await db
      .select({
        dealCount: count(schema.deals.id),
        cheapestPrice: min(schema.deals.price),
      })
      .from(schema.deals)
      .where(
        and(
          eq(schema.deals.destinationId, dest.id),
          eq(schema.deals.isActive, true),
        ),
      );

    // Brands in this destination
    const brandRows = await db
      .selectDistinct({ name: schema.brands.name })
      .from(schema.deals)
      .leftJoin(
        schema.brands,
        sql`${schema.deals.brandId} = ${schema.brands.id}`,
      )
      .where(
        and(
          eq(schema.deals.destinationId, dest.id),
          eq(schema.deals.isActive, true),
        ),
      );

    // Durations available
    const durRows = await db
      .selectDistinct({ nights: schema.deals.durationNights })
      .from(schema.deals)
      .where(
        and(
          eq(schema.deals.destinationId, dest.id),
          eq(schema.deals.isActive, true),
        ),
      );

    return {
      name: dest.city,
      slug: dest.slug,
      state: dest.state,
      dealCount: statsRows[0]?.dealCount ?? 0,
      cheapestPrice: statsRows[0]?.cheapestPrice
        ? Number(statsRows[0].cheapestPrice)
        : null,
      brands: brandRows
        .map((b) => b.name)
        .filter((n): n is string => n !== null),
      durations: durRows.map((d) => d.nights).sort((a, b) => a - b),
    };
  } catch (e) {
    console.error("[queries] getDestinationBySlug failed:", e);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Get a single deal by slug (with brand + destination)
// ---------------------------------------------------------------------------

export interface DealDetail {
  id: number;
  title: string;
  slug: string;
  price: number;
  originalPrice: number | null;
  durationNights: number;
  durationDays: number;
  resortName: string | null;
  description: string | null;
  url: string;
  imageUrl: string | null;
  inclusions: string[];
  requirements: string[];
  presentationMinutes: number | null;
  travelWindow: string | null;
  savingsPercent: number | null;
  brandName: string | null;
  brandSlug: string | null;
  city: string | null;
  state: string | null;
  destinationSlug: string | null;
  isActive: boolean;
  updatedAt: string | null;
}

export async function getDealBySlug(
  slug: string,
): Promise<DealDetail | null> {
  try {
    const conn = await getDB();
    if (!conn) return null;
    const { db, schema } = conn;
    const { eq, sql } = await import("drizzle-orm");

    const rows = await db
      .select({
        id: schema.deals.id,
        title: schema.deals.title,
        slug: schema.deals.slug,
        price: schema.deals.price,
        originalPrice: schema.deals.originalPrice,
        durationNights: schema.deals.durationNights,
        durationDays: schema.deals.durationDays,
        resortName: schema.deals.resortName,
        description: schema.deals.description,
        url: schema.deals.url,
        imageUrl: schema.deals.imageUrl,
        inclusions: schema.deals.inclusions,
        requirements: schema.deals.requirements,
        presentationMinutes: schema.deals.presentationMinutes,
        travelWindow: schema.deals.travelWindow,
        savingsPercent: schema.deals.savingsPercent,
        isActive: schema.deals.isActive,
        updatedAt: schema.deals.updatedAt,
        brandName: schema.brands.name,
        brandSlug: schema.brands.slug,
        city: schema.destinations.city,
        state: schema.destinations.state,
        destinationSlug: schema.destinations.slug,
      })
      .from(schema.deals)
      .leftJoin(schema.brands, sql`${schema.deals.brandId} = ${schema.brands.id}`)
      .leftJoin(
        schema.destinations,
        sql`${schema.deals.destinationId} = ${schema.destinations.id}`,
      )
      .where(eq(schema.deals.slug, slug))
      .limit(1);

    if (rows.length === 0) return null;
    const r = rows[0];

    return {
      id: r.id,
      title: r.title,
      slug: r.slug,
      price: Number(r.price),
      originalPrice: r.originalPrice ? Number(r.originalPrice) : null,
      durationNights: r.durationNights,
      durationDays: r.durationDays,
      resortName: r.resortName,
      description: r.description,
      url: r.url,
      imageUrl: r.imageUrl,
      inclusions: parseInclusions(r.inclusions),
      requirements: parseInclusions(r.requirements),
      presentationMinutes: r.presentationMinutes,
      travelWindow: r.travelWindow,
      savingsPercent: r.savingsPercent,
      isActive: r.isActive,
      updatedAt: r.updatedAt ? r.updatedAt.toISOString() : null,
      brandName: r.brandName,
      brandSlug: r.brandSlug,
      city: r.city,
      state: r.state,
      destinationSlug: r.destinationSlug,
    };
  } catch (e) {
    console.error("[queries] getDealBySlug failed:", e);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Get featured deals (cheapest active deals)
// ---------------------------------------------------------------------------

export async function getFeaturedDeals(
  limit: number = 6,
): Promise<Deal[] | null> {
  try {
    const result = await getDeals({ sortBy: "price-asc", limit, page: 1 });
    if (!result || result.deals.length === 0) return null;
    return result.deals;
  } catch (e) {
    console.error("[queries] getFeaturedDeals failed:", e);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Get aggregate deal stats
// ---------------------------------------------------------------------------

export interface DealStats {
  totalDeals: number;
  avgPrice: number;
  cheapestPrice: number;
  destinationCount: number;
  brandCount: number;
  expiredDeals: number;
}

export async function getDealStats(): Promise<DealStats | null> {
  try {
    const conn = await getDB();
    if (!conn) return null;
    const { db, schema } = conn;
    const { eq, sql, count, avg, min, countDistinct } = await import(
      "drizzle-orm"
    );

    // Active deal stats
    const rows = await db
      .select({
        totalDeals: count(schema.deals.id),
        avgPrice: avg(schema.deals.price),
        cheapestPrice: min(schema.deals.price),
        destinationCount: countDistinct(schema.deals.destinationId),
        brandCount: countDistinct(schema.deals.brandId),
      })
      .from(schema.deals)
      .where(eq(schema.deals.isActive, true));

    // Expired/inactive deal count
    const expiredRows = await db
      .select({ expiredDeals: count(schema.deals.id) })
      .from(schema.deals)
      .where(eq(schema.deals.isActive, false));

    const row = rows[0];
    if (!row || row.totalDeals === 0) return null;

    return {
      totalDeals: row.totalDeals,
      avgPrice: Math.round(Number(row.avgPrice ?? 0)),
      cheapestPrice: Number(row.cheapestPrice ?? 0),
      destinationCount: row.destinationCount,
      brandCount: row.brandCount,
      expiredDeals: expiredRows[0]?.expiredDeals ?? 0,
    };
  } catch (e) {
    console.error("[queries] getDealStats failed:", e);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Get all brand slugs (for dynamic slug resolution)
// ---------------------------------------------------------------------------

export async function getAllBrandSlugs(): Promise<Array<{slug: string, name: string, type: string, description: string | null, website: string | null}>> {
  try {
    const conn = await getDB();
    if (!conn) return [];
    const { db, schema } = conn;
    const rows = await db.select({
      slug: schema.brands.slug,
      name: schema.brands.name,
      type: schema.brands.type,
      description: schema.brands.description,
      website: schema.brands.website,
    }).from(schema.brands);
    return rows;
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Get all destination slugs (for dynamic slug resolution)
// ---------------------------------------------------------------------------

export async function getAllDestinationSlugs(): Promise<Array<{slug: string, city: string, state: string | null, region: string | null, country: string}>> {
  try {
    const conn = await getDB();
    if (!conn) return [];
    const { db, schema } = conn;
    const rows = await db.select({
      slug: schema.destinations.slug,
      city: schema.destinations.city,
      state: schema.destinations.state,
      region: schema.destinations.region,
      country: schema.destinations.country,
    }).from(schema.destinations);
    return rows;
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Blog post queries
// ---------------------------------------------------------------------------

import type { BlogPost, BlogFAQ } from "@/lib/blog-types";

export async function getBlogPostsFromDB(filters?: {
  category?: string;
  page?: number;
  limit?: number;
}): Promise<{ posts: BlogPost[]; total: number } | null> {
  try {
    const conn = await getDB();
    if (!conn) return null;
    const { db, schema } = conn;
    const { eq, and, desc, count } = await import("drizzle-orm");

    const page = filters?.page ?? 1;
    const limit = filters?.limit ?? 100;
    const offset = (page - 1) * limit;

    const conditions: ReturnType<typeof eq>[] = [
      eq(schema.blogPosts.isPublished, true),
    ];

    if (filters?.category) {
      conditions.push(eq(schema.blogPosts.category, filters.category));
    }

    const whereClause = and(...conditions);

    const totalResult = await db
      .select({ count: count() })
      .from(schema.blogPosts)
      .where(whereClause);
    const total = totalResult[0]?.count ?? 0;

    const rows = await db
      .select()
      .from(schema.blogPosts)
      .where(whereClause)
      .orderBy(desc(schema.blogPosts.publishDate))
      .limit(limit)
      .offset(offset);

    const posts: BlogPost[] = rows.map((r) => ({
      slug: r.slug,
      title: r.title,
      metaTitle: r.metaTitle,
      metaDescription: r.metaDescription,
      category: r.category as BlogPost["category"],
      publishDate: r.publishDate.toISOString().split("T")[0],
      author: r.author,
      readTime: r.readTime ?? "",
      bluf: r.bluf,
      heroImageAlt: r.heroImageAlt ?? "",
      heroGradient: r.heroGradient ?? "",
      content: r.content,
      faqs: safeParseJson<BlogFAQ[]>(r.faqs, []),
      internalLinks: safeParseJson<{ text: string; href: string }[]>(r.internalLinks, []),
      relatedSlugs: safeParseJson<string[]>(r.relatedSlugs, []),
      tags: safeParseJson<string[]>(r.tags, []),
    }));

    return { posts, total };
  } catch (e) {
    console.error("[queries] getBlogPostsFromDB failed:", e);
    return null;
  }
}

export async function getBlogPostBySlugFromDB(slug: string): Promise<BlogPost | null> {
  try {
    const conn = await getDB();
    if (!conn) return null;
    const { db, schema } = conn;
    const { eq, and } = await import("drizzle-orm");

    const rows = await db
      .select()
      .from(schema.blogPosts)
      .where(
        and(
          eq(schema.blogPosts.slug, slug),
          eq(schema.blogPosts.isPublished, true),
        ),
      )
      .limit(1);

    if (rows.length === 0) return null;
    const r = rows[0];

    return {
      slug: r.slug,
      title: r.title,
      metaTitle: r.metaTitle,
      metaDescription: r.metaDescription,
      category: r.category as BlogPost["category"],
      publishDate: r.publishDate.toISOString().split("T")[0],
      author: r.author,
      readTime: r.readTime ?? "",
      bluf: r.bluf,
      heroImageAlt: r.heroImageAlt ?? "",
      heroGradient: r.heroGradient ?? "",
      content: r.content,
      faqs: safeParseJson<BlogFAQ[]>(r.faqs, []),
      internalLinks: safeParseJson<{ text: string; href: string }[]>(r.internalLinks, []),
      relatedSlugs: safeParseJson<string[]>(r.relatedSlugs, []),
      tags: safeParseJson<string[]>(r.tags, []),
    };
  } catch (e) {
    console.error("[queries] getBlogPostBySlugFromDB failed:", e);
    return null;
  }
}

export async function getBlogPostCount(): Promise<number> {
  try {
    const conn = await getDB();
    if (!conn) return 0;
    const { db, schema } = conn;
    const { eq, count } = await import("drizzle-orm");

    const result = await db
      .select({ count: count() })
      .from(schema.blogPosts)
      .where(eq(schema.blogPosts.isPublished, true));

    return result[0]?.count ?? 0;
  } catch (e) {
    console.error("[queries] getBlogPostCount failed:", e);
    return 0;
  }
}

// ---------------------------------------------------------------------------
// Helper: safely parse JSON strings from DB
// ---------------------------------------------------------------------------

function safeParseJson<T>(raw: string | null | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

// ---------------------------------------------------------------------------
// Helper: parse inclusions JSON string to string array
// ---------------------------------------------------------------------------

function parseInclusions(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
    return [];
  } catch {
    // If it's not JSON, try comma-separated
    return raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
}

// ---------------------------------------------------------------------------
// Price history data loader for the Rate Recap chart
// ---------------------------------------------------------------------------

export interface PricePoint {
  date: string; // ISO date (YYYY-MM-DD)
  price: number;
  brandName: string;
  brandSlug: string;
  destinationSlug: string;
  durationNights: number;
}

export interface BrandInfo {
  name: string;
  slug: string;
  color: string;
}

// Brand color map
const BRAND_COLORS: Record<string, string> = {
  westgate: "#2563EB",
  bookvip: "#10B981",
  getawaydealz: "#F59E0B",
  mrg: "#EF4444",
  wyndham: "#8B5CF6",
  hgv: "#06B6D4",
  marriott: "#EC4899",
  "holiday-inn": "#84CC16",
};
const DEFAULT_COLOR = "#6B7280";

export function getBrandColor(slug: string): string {
  return BRAND_COLORS[slug] ?? DEFAULT_COLOR;
}

// ---------------------------------------------------------------------------
// Fetch price history from DB, with mock fallback
// ---------------------------------------------------------------------------

export async function getPriceHistory(filters?: {
  destinationSlug?: string;
  durationNights?: number;
  days?: number; // last N days, default 30
}): Promise<{ points: PricePoint[]; brands: BrandInfo[]; isMock: boolean }> {
  const days = filters?.days ?? 30;

  try {
    const { db } = await import("@vacationdeals/db");
    const schema = await import("@vacationdeals/db");
    const { sql, eq, and, gte } = await import("drizzle-orm");

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    // Build conditions
    const conditions: ReturnType<typeof eq>[] = [
      eq(schema.deals.isActive, true),
      gte(schema.dealPriceHistory.scrapedAt, cutoff),
    ];

    if (filters?.destinationSlug) {
      const dest = await db
        .select({ id: schema.destinations.id })
        .from(schema.destinations)
        .where(eq(schema.destinations.slug, filters.destinationSlug))
        .limit(1);
      if (dest.length > 0) {
        conditions.push(eq(schema.deals.destinationId, dest[0].id));
      }
    }

    if (filters?.durationNights) {
      conditions.push(eq(schema.deals.durationNights, filters.durationNights));
    }

    const rows = await db
      .select({
        price: schema.dealPriceHistory.price,
        scrapedAt: schema.dealPriceHistory.scrapedAt,
        brandName: schema.brands.name,
        brandSlug: schema.brands.slug,
        destinationSlug: schema.destinations.slug,
        durationNights: schema.deals.durationNights,
      })
      .from(schema.dealPriceHistory)
      .innerJoin(schema.deals, sql`${schema.dealPriceHistory.dealId} = ${schema.deals.id}`)
      .leftJoin(schema.brands, sql`${schema.deals.brandId} = ${schema.brands.id}`)
      .leftJoin(schema.destinations, sql`${schema.deals.destinationId} = ${schema.destinations.id}`)
      .where(and(...conditions))
      .orderBy(schema.dealPriceHistory.scrapedAt);

    if (rows.length > 0) {
      // Group by brand + date + destination + duration, average price
      const grouped = new Map<string, {
        total: number;
        count: number;
        brandName: string;
        brandSlug: string;
        destinationSlug: string;
        durationNights: number;
      }>();
      for (const r of rows) {
        const dateStr = r.scrapedAt.toISOString().split("T")[0];
        const slug = r.brandSlug ?? "unknown";
        const destSlug = r.destinationSlug ?? "unknown";
        const dur = r.durationNights ?? 3;
        const key = `${slug}|${dateStr}|${destSlug}|${dur}`;
        const existing = grouped.get(key);
        if (existing) {
          existing.total += Number(r.price);
          existing.count += 1;
        } else {
          grouped.set(key, {
            total: Number(r.price),
            count: 1,
            brandName: r.brandName ?? "Unknown",
            brandSlug: slug,
            destinationSlug: destSlug,
            durationNights: dur,
          });
        }
      }

      const points: PricePoint[] = [];
      const brandSet = new Map<string, string>();

      for (const [key, val] of grouped) {
        const parts = key.split("|");
        const date = parts[1];
        points.push({
          date,
          price: Math.round(val.total / val.count),
          brandName: val.brandName,
          brandSlug: val.brandSlug,
          destinationSlug: val.destinationSlug,
          durationNights: val.durationNights,
        });
        brandSet.set(val.brandSlug, val.brandName);
      }

      const brands: BrandInfo[] = Array.from(brandSet.entries()).map(([slug, name]) => ({
        name,
        slug,
        color: getBrandColor(slug),
      }));

      return { points, brands, isMock: false };
    }
  } catch {
    // DB unavailable, fall through to mock
  }

  const mock = generateMockData(days);
  return { ...mock, isMock: true };
}

// ---------------------------------------------------------------------------
// Mock data generator
// ---------------------------------------------------------------------------

function generateMockData(days: number): { points: PricePoint[]; brands: BrandInfo[] } {
  const mockBrands: BrandInfo[] = [
    { name: "Westgate Resorts", slug: "westgate", color: "#2563EB" },
    { name: "BookVIP", slug: "bookvip", color: "#10B981" },
    { name: "Club Wyndham", slug: "wyndham", color: "#8B5CF6" },
    { name: "Hilton Grand Vacations", slug: "hgv", color: "#06B6D4" },
    { name: "Marriott Vacation Club", slug: "marriott", color: "#EC4899" },
  ];

  const mockDestinations = ["orlando", "las-vegas", "cancun"];
  const mockDurations = [2, 3];

  // Seed-based pseudo-random for consistent SSR/CSR
  function seededRandom(seed: number): number {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  }

  const basePrices: Record<string, number> = {
    westgate: 99,
    bookvip: 149,
    wyndham: 119,
    hgv: 179,
    marriott: 229,
  };

  const points: PricePoint[] = [];

  // Start from the actual earliest scrape date instead of "N days ago"
  const startDate = new Date("2026-03-14T00:00:00");
  const today = new Date();
  // Calculate actual number of days available (capped to requested range)
  const msPerDay = 86400000;
  const availableDays = Math.min(
    days,
    Math.max(1, Math.floor((today.getTime() - startDate.getTime()) / msPerDay) + 1),
  );

  for (let d = availableDays - 1; d >= 0; d--) {
    const date = new Date(today);
    date.setDate(date.getDate() - d);
    // Don't generate dates before the start date
    if (date < startDate) continue;
    const dateStr = date.toISOString().split("T")[0];

    for (const dest of mockDestinations) {
      for (const dur of mockDurations) {
        for (const brand of mockBrands) {
          const base = basePrices[brand.slug] ?? 149;
          const seed = d * 7 + brand.slug.charCodeAt(0) + dest.charCodeAt(0) + dur * 13;
          const variance = (seededRandom(seed) - 0.5) * 80; // +/- $40
          // Shorter stays are slightly cheaper
          const durationAdj = dur === 2 ? -20 : 0;
          const price = Math.max(79, Math.min(299, Math.round(base + variance + durationAdj)));

          points.push({
            date: dateStr,
            price,
            brandName: brand.name,
            brandSlug: brand.slug,
            destinationSlug: dest,
            durationNights: dur,
          });
        }
      }
    }
  }

  return { points, brands: mockBrands };
}

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
  dealSlug: string; // slug for linking to /deals/{dealSlug}
}

export interface BrandInfo {
  name: string;
  slug: string;
  color: string;
}

// Brand color map — covers ALL brands with distinct colors
const BRAND_COLORS: Record<string, string> = {
  westgate: "#2563EB",           // blue
  bookvip: "#10B981",            // emerald
  getawaydealz: "#F59E0B",      // amber
  mrg: "#EF4444",                // red
  wyndham: "#8B5CF6",            // violet
  hgv: "#06B6D4",                // cyan
  marriott: "#EC4899",           // pink
  "holiday-inn": "#84CC16",      // lime
  staypromo: "#F97316",          // orange
  "vacation-village": "#14B8A6", // teal
  spinnaker: "#A855F7",          // purple
  "departure-depot": "#0EA5E9",  // sky
  "vegas-timeshare": "#DC2626",  // red-600
  "premier-travel": "#059669",   // emerald-600
  festiva: "#7C3AED",            // violet-600
  "discount-vacation": "#D97706", // amber-600
  legendary: "#BE185D",           // pink-700
  "westgate-events": "#4338CA",  // indigo-700
  hyatt: "#B45309",              // amber-700
  bluegreen: "#047857",          // emerald-700
  "capital-vacations": "#6D28D9", // purple-700
  govip: "#64748B",              // slate
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
        dealSlug: schema.deals.slug,
      })
      .from(schema.dealPriceHistory)
      .innerJoin(schema.deals, sql`${schema.dealPriceHistory.dealId} = ${schema.deals.id}`)
      .leftJoin(schema.brands, sql`${schema.deals.brandId} = ${schema.brands.id}`)
      .leftJoin(schema.destinations, sql`${schema.deals.destinationId} = ${schema.destinations.id}`)
      .where(and(...conditions))
      .orderBy(schema.dealPriceHistory.scrapedAt);

    // Always use real data — no mock fallback
    {
      // Group by brand + date + destination + duration, average price
      const grouped = new Map<string, {
        total: number;
        count: number;
        brandName: string;
        brandSlug: string;
        destinationSlug: string;
        durationNights: number;
        dealSlug: string;
        cheapestPrice: number;
      }>();
      for (const r of rows) {
        const dateStr = r.scrapedAt.toISOString().split("T")[0];
        const slug = r.brandSlug ?? "unknown";
        const destSlug = r.destinationSlug ?? "unknown";
        const dur = r.durationNights ?? 3;
        const key = `${slug}|${dateStr}|${destSlug}|${dur}`;
        const price = Number(r.price);
        const existing = grouped.get(key);
        if (existing) {
          existing.total += price;
          existing.count += 1;
          // Keep the slug of the cheapest deal in this group
          if (price < existing.cheapestPrice) {
            existing.cheapestPrice = price;
            existing.dealSlug = r.dealSlug ?? "";
          }
        } else {
          grouped.set(key, {
            total: price,
            count: 1,
            brandName: r.brandName ?? "Unknown",
            brandSlug: slug,
            destinationSlug: destSlug,
            durationNights: dur,
            dealSlug: r.dealSlug ?? "",
            cheapestPrice: price,
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
          dealSlug: val.dealSlug,
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
  } catch (e) {
    console.error("[price-history] DB query failed:", e);
  }

  // Return empty data — no mock
  return { points: [], brands: [], isMock: false };
}

// ---------------------------------------------------------------------------
// Mock data generator
// ---------------------------------------------------------------------------

function generateMockData(days: number): { points: PricePoint[]; brands: BrandInfo[] } {
  const mockBrands: BrandInfo[] = [
    { name: "Westgate Reservations", slug: "westgate", color: "#2563EB" },
    { name: "BookVIP", slug: "bookvip", color: "#10B981" },
    { name: "Club Wyndham", slug: "wyndham", color: "#8B5CF6" },
    { name: "Hilton Grand Vacations", slug: "hgv", color: "#06B6D4" },
    { name: "Marriott Vacation Club", slug: "marriott", color: "#EC4899" },
    { name: "GetawayDealz", slug: "getawaydealz", color: "#F59E0B" },
    { name: "Monster Reservations Group", slug: "mrg", color: "#EF4444" },
    { name: "Holiday Inn Club Vacations", slug: "holiday-inn", color: "#84CC16" },
    { name: "StayPromo", slug: "staypromo", color: "#F97316" },
    { name: "Departure Depot", slug: "departure-depot", color: "#0EA5E9" },
    { name: "Spinnaker Resorts", slug: "spinnaker", color: "#A855F7" },
    { name: "Bluegreen Vacations", slug: "bluegreen", color: "#047857" },
    { name: "Vacation Village Resorts", slug: "vacation-village", color: "#14B8A6" },
    { name: "Las Vegas Timeshare", slug: "vegas-timeshare", color: "#DC2626" },
    { name: "Premier Travel Resorts", slug: "premier-travel", color: "#059669" },
    { name: "Festiva Hospitality Group", slug: "festiva", color: "#7C3AED" },
    { name: "Westgate Events", slug: "westgate-events", color: "#4338CA" },
    { name: "Legendary Vacation Club", slug: "legendary", color: "#BE185D" },
    { name: "Discount Vacation Hotels", slug: "discount-vacation", color: "#D97706" },
    { name: "Capital Vacations", slug: "capital-vacations", color: "#6D28D9" },
    { name: "Hyatt Vacation Club", slug: "hyatt", color: "#B45309" },
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
    getawaydealz: 129,
    mrg: 109,
    "holiday-inn": 159,
    staypromo: 89,
    "departure-depot": 139,
    spinnaker: 169,
    bluegreen: 189,
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

          // Generate a realistic deal slug
          const dealSlug = `${brand.slug}-${dest}-${dur + 1}-night-${price}`;

          points.push({
            date: dateStr,
            price,
            brandName: brand.name,
            brandSlug: brand.slug,
            destinationSlug: dest,
            durationNights: dur,
            dealSlug,
          });
        }
      }
    }
  }

  return { points, brands: mockBrands };
}

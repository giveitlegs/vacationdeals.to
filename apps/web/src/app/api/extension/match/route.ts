import { NextRequest, NextResponse } from "next/server";

/**
 * Chrome extension endpoint: fuzzy-match a resort name from a Google Business Profile
 * to the lowest-priced active vacpack deal.
 *
 * GET /api/extension/match?resort=<business+name>
 *
 * Matching strategy (brand + destination driven, because most deal rows have
 * an empty resort_name — the real signal is "which brand, which city"):
 *
 * 1. Extract candidate brand tokens from the query (westgate, wyndham, hgv, ...)
 * 2. Extract candidate destination tokens (orlando, "las vegas", gatlinburg, ...)
 * 3. For each active non-expired deal:
 *      brandScore = 1 if brand slug/name appears in query, else 0
 *      cityScore  = 1 if destination city appears in query, else 0
 *      resortScore= Jaccard overlap of resort_name tokens with query
 * 4. Confidence = max(brandScore, 0.1) * (0.6 + 0.25*cityScore + 0.15*resortScore)
 *    — brand is a hard requirement; city and resort refine within the brand.
 * 5. Require confidence >= 0.6 (brand + at least city or resort) to consider it a match.
 * 6. Pick the cheapest deal in the top-confidence tier.
 *
 * Response:
 *   { deal: { slug, price, ..., tag, tagColor, landerUrl, matchConfidence } }
 *   or { deal: null, reason: "no_match"|"missing_resort"|"error" }
 */

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Cache-Control": "public, s-maxage=600, stale-while-revalidate=1800",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

// --------------------------------------------------------------------------
// Brand aliases: map common query words / GBP brand names to our slugs
// --------------------------------------------------------------------------

const BRAND_ALIASES: Record<string, string[]> = {
  westgate: ["westgate"],
  wyndham: ["wyndham", "club wyndham", "worldmark"],
  hgv: ["hilton grand", "hilton vacation", "hgv"],
  marriott: ["marriott vacation", "vistana"],
  "holiday-inn": ["holiday inn club", "orange lake"],
  bluegreen: ["bluegreen"],
  hyatt: ["hyatt vacation", "hyatt residence", "hyatt place"],
  "sheraton-vc": ["sheraton vistana"],
  "westin-vc": ["westin", "westin vacation"],
  spinnaker: ["spinnaker"],
  "vacation-village": ["vacation village"],
  festiva: ["festiva", "exploria"],
  "capital-vacations": ["capital vacations", "summer bay"],
  "bahia-principe": ["bahia principe"],
  divi: ["divi"],
  "el-cid": ["el cid"],
  "pueblo-bonito": ["pueblo bonito"],
  "villa-group": ["villa group", "villa del palmar", "villa la estancia"],
  tafer: ["tafer"],
};

// --------------------------------------------------------------------------
// Utilities
// --------------------------------------------------------------------------

const STOP_WORDS = new Set([
  "resort", "resorts", "hotel", "hotels", "inn", "suites", "suite", "spa",
  "club", "vacation", "vacations", "the", "a", "an", "and", "by", "at", "of",
  "on", "in", "&", "-",
]);

function normalize(s: string): string {
  return (s || "")
    .toLowerCase()
    .replace(/[^\w\s&-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(s: string): string[] {
  return normalize(s)
    .split(/\s+/)
    .filter((t) => t.length > 1 && !STOP_WORDS.has(t));
}

function containsPhrase(haystack: string, phrase: string): boolean {
  const h = normalize(haystack);
  const p = normalize(phrase);
  if (!p) return false;
  return h.includes(p);
}

function jaccardOverlap(a: string, b: string): number {
  const aT = new Set(tokenize(a));
  const bT = new Set(tokenize(b));
  if (aT.size === 0 || bT.size === 0) return 0;
  let overlap = 0;
  for (const t of aT) if (bT.has(t)) overlap++;
  const union = new Set([...aT, ...bT]).size;
  return overlap / union;
}

function detectBrand(query: string): string | null {
  const lower = " " + normalize(query) + " ";
  for (const [slug, aliases] of Object.entries(BRAND_ALIASES)) {
    for (const alias of aliases) {
      if (lower.includes(" " + alias + " ") || lower.includes(" " + alias)) return slug;
    }
  }
  return null;
}

// --------------------------------------------------------------------------
// Tag derivation
// --------------------------------------------------------------------------

type Tag = { label: string; color: string };

function deriveTag(args: {
  currentPrice: number;
  history: { price: number; scrapedAt: Date }[];
  firstScrapedAt: Date | null;
}): Tag {
  const now = Date.now();
  const DAY = 86400000;
  const sorted = args.history.slice().sort((a, b) => b.scrapedAt.getTime() - a.scrapedAt.getTime());

  if (args.firstScrapedAt && now - args.firstScrapedAt.getTime() < 2 * DAY) {
    return { label: "NEW DEAL", color: "#10B981" };
  }

  const recent = sorted.filter((h) => now - h.scrapedAt.getTime() < 7 * DAY);
  if (recent.length > 1) {
    const maxRecent = Math.max(...recent.map((h) => h.price));
    if (maxRecent > 0 && args.currentPrice <= maxRecent * 0.9) {
      return { label: "FLASH SALE", color: "#EF4444" };
    }
  }

  if (sorted.length >= 5) {
    const minEver = Math.min(...sorted.map((h) => h.price));
    if (args.currentPrice <= minEver + 0.5) {
      return { label: "LOWEST EVER", color: "#F59E0B" };
    }
  }

  return { label: "EXCLUSIVE RATE", color: "#2563EB" };
}

// --------------------------------------------------------------------------
// Route
// --------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const resortQuery = url.searchParams.get("resort")?.trim();

  if (!resortQuery || resortQuery.length < 3) {
    return NextResponse.json(
      { deal: null, reason: "missing_resort" },
      { status: 400, headers: CORS_HEADERS },
    );
  }

  try {
    const { db } = await import("@vacationdeals/db");
    const schema = await import("@vacationdeals/db");
    const { eq, and, sql, or, isNull, gt, asc } = await import("drizzle-orm");

    // 1. Detect target brand from the query. If we can't detect one, we can't
    //    confidently match any deal — return no_match early.
    const targetBrandSlug = detectBrand(resortQuery);
    if (!targetBrandSlug) {
      return NextResponse.json(
        { deal: null, reason: "no_match", detail: "no_brand_detected" },
        { headers: CORS_HEADERS },
      );
    }

    // 2. Pull all active non-expired deals for that brand, joined with destination
    const rows = await db
      .select({
        dealId: schema.deals.id,
        slug: schema.deals.slug,
        title: schema.deals.title,
        resortName: schema.deals.resortName,
        price: schema.deals.price,
        originalPrice: schema.deals.originalPrice,
        durationNights: schema.deals.durationNights,
        durationDays: schema.deals.durationDays,
        savingsPercent: schema.deals.savingsPercent,
        scrapedAt: schema.deals.scrapedAt,
        brandName: schema.brands.name,
        brandSlug: schema.brands.slug,
        destinationCity: schema.destinations.city,
      })
      .from(schema.deals)
      .leftJoin(schema.brands, sql`${schema.deals.brandId} = ${schema.brands.id}`)
      .leftJoin(schema.destinations, sql`${schema.deals.destinationId} = ${schema.destinations.id}`)
      .where(
        and(
          eq(schema.deals.isActive, true),
          or(isNull(schema.deals.expiresAt), gt(schema.deals.expiresAt, new Date())),
          eq(schema.brands.slug, targetBrandSlug),
          sql`(${schema.deals.brandId} IS NULL OR ${schema.deals.brandId} NOT IN (SELECT id FROM brands WHERE is_suppressed = true))`,
        ),
      )
      .orderBy(asc(schema.deals.price));

    if (rows.length === 0) {
      return NextResponse.json(
        { deal: null, reason: "no_match", detail: "no_active_deals_for_brand" },
        { headers: CORS_HEADERS },
      );
    }

    // 3. Score each candidate: brand is already matched (required above), so
    //    the scoring differentiates within the brand's deals.
    const scored = rows.map((r) => {
      const cityMatch = r.destinationCity ? containsPhrase(resortQuery, r.destinationCity) : false;
      const resortMatch = r.resortName ? jaccardOverlap(resortQuery, r.resortName) : 0;

      // Base 0.6 for brand, +0.25 for city, +0.15 weighted by resort jaccard
      const confidence = 0.6 + (cityMatch ? 0.25 : 0) + resortMatch * 0.15;
      return { ...r, cityMatch, resortMatch, confidence };
    });

    // Prefer city-matching deals. If any match by city, only consider those.
    const cityMatches = scored.filter((r) => r.cityMatch);
    const pool = cityMatches.length > 0 ? cityMatches : scored;

    // Within the pool, pick the top-confidence tier (within 0.05 of max), then cheapest.
    const maxConf = pool.reduce((m, r) => Math.max(m, r.confidence), 0);
    const topTier = pool.filter((r) => r.confidence >= maxConf - 0.05);
    const winner = topTier.sort((a, b) => Number(a.price) - Number(b.price))[0];

    // Tag derivation
    const history = await db
      .select({
        price: schema.dealPriceHistory.price,
        scrapedAt: schema.dealPriceHistory.scrapedAt,
      })
      .from(schema.dealPriceHistory)
      .where(eq(schema.dealPriceHistory.dealId, winner.dealId));

    const firstScrapedAt =
      history.length > 0
        ? history.reduce((min, h) => (h.scrapedAt < min ? h.scrapedAt : min), history[0].scrapedAt)
        : winner.scrapedAt;

    const tag = deriveTag({
      currentPrice: Number(winner.price),
      history: history.map((h) => ({ price: Number(h.price), scrapedAt: h.scrapedAt })),
      firstScrapedAt,
    });

    return NextResponse.json(
      {
        deal: {
          slug: winner.slug,
          price: Number(winner.price),
          originalPrice: winner.originalPrice ? Number(winner.originalPrice) : null,
          durationNights: winner.durationNights,
          durationDays: winner.durationDays,
          savingsPercent: winner.savingsPercent ?? null,
          brandName: winner.brandName ?? "Unknown",
          resortName: winner.resortName ?? winner.destinationCity ?? winner.title,
          destinationCity: winner.destinationCity ?? null,
          tag: tag.label,
          tagColor: tag.color,
          landerUrl: `https://vacationdeals.to/deals/${winner.slug}?utm_source=chrome_ext&utm_medium=gbp_injection&utm_campaign=vacpack_rate`,
          matchConfidence: Math.round(winner.confidence * 100) / 100,
          matchDetail: {
            brand: true,
            city: winner.cityMatch,
            resortOverlap: Math.round(winner.resortMatch * 100) / 100,
          },
        },
      },
      { headers: CORS_HEADERS },
    );
  } catch (e) {
    console.error("[api/extension/match]", e);
    return NextResponse.json(
      { deal: null, reason: "error" },
      { status: 500, headers: CORS_HEADERS },
    );
  }
}

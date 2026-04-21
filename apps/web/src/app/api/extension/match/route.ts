import { NextRequest, NextResponse } from "next/server";

/**
 * Chrome extension endpoint: fuzzy-match a resort name from a Google Business Profile
 * and return the lowest-priced active (non-expired) vacpack deal for that resort.
 *
 * GET /api/extension/match?resort=<business+name>
 *
 * Response:
 *   { deal: {
 *       slug, price, originalPrice, durationNights, durationDays, savingsPercent,
 *       brandName, resortName, tag, tagColor, landerUrl, matchConfidence
 *   } }
 * Or { deal: null } if no confident match.
 *
 * CORS enabled so the MV3 service worker (chrome-extension:// origin) can call.
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
// Fuzzy match helpers
// --------------------------------------------------------------------------

const STOP_WORDS = new Set([
  "resort", "resorts", "hotel", "hotels", "inn", "suites", "suite",
  "spa", "club", "vacation", "vacations", "the", "a", "an", "and", "by",
  "at", "of", "on", "in", "&", "-", "by",
]);

function normalize(s: string): string {
  return s
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

/**
 * Jaccard-style token overlap confidence. 1.0 = identical meaningful tokens.
 * Also rewards when a known brand slug appears as a prefix (e.g., "westgate lakes resort"
 * for brand "westgate" + resortName "Westgate Lakes Resort").
 */
function matchScore(query: string, candidate: string): number {
  const qTokens = new Set(tokenize(query));
  const cTokens = new Set(tokenize(candidate));
  if (qTokens.size === 0 || cTokens.size === 0) return 0;

  let overlap = 0;
  for (const t of qTokens) if (cTokens.has(t)) overlap++;
  const union = new Set([...qTokens, ...cTokens]).size;
  return overlap / union;
}

// --------------------------------------------------------------------------
// Tag derivation from price history (option b)
// --------------------------------------------------------------------------

type Tag = { label: string; color: string };

function deriveTag(args: {
  dealId: number;
  currentPrice: number;
  history: { price: number; scrapedAt: Date }[];
  firstScrapedAt: Date | null;
}): Tag {
  const now = Date.now();
  const DAY = 86400000;

  // Sort descending by date
  const sorted = args.history.slice().sort((a, b) => b.scrapedAt.getTime() - a.scrapedAt.getTime());

  // NEW DEAL: first seen in last 48h
  if (args.firstScrapedAt && now - args.firstScrapedAt.getTime() < 2 * DAY) {
    return { label: "NEW DEAL", color: "#10B981" };
  }

  // FLASH SALE: price dropped ≥10% vs max in the last 7 days
  const recent = sorted.filter((h) => now - h.scrapedAt.getTime() < 7 * DAY);
  if (recent.length > 1) {
    const maxRecent = Math.max(...recent.map((h) => h.price));
    if (maxRecent > 0 && args.currentPrice <= maxRecent * 0.9) {
      return { label: "FLASH SALE", color: "#EF4444" };
    }
  }

  // LOWEST EVER: current price equals historical minimum (≥5 data points to qualify)
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
    return NextResponse.json({ deal: null, reason: "missing_resort" }, { status: 400, headers: CORS_HEADERS });
  }

  try {
    const { db } = await import("@vacationdeals/db");
    const schema = await import("@vacationdeals/db");
    const { eq, and, sql, or, isNull, gt, asc } = await import("drizzle-orm");

    // Pull active, non-expired deals (limited to 200 candidates for fuzzy match)
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
      })
      .from(schema.deals)
      .leftJoin(schema.brands, sql`${schema.deals.brandId} = ${schema.brands.id}`)
      .where(
        and(
          eq(schema.deals.isActive, true),
          or(
            isNull(schema.deals.expiresAt),
            gt(schema.deals.expiresAt, new Date()),
          ),
          // Hide suppressed brands
          sql`(${schema.deals.brandId} IS NULL OR ${schema.deals.brandId} NOT IN (SELECT id FROM brands WHERE is_suppressed = true))`,
        ),
      )
      .orderBy(asc(schema.deals.price));

    // Score each candidate against resortName + brand + title
    const MIN_CONFIDENCE = 0.4;
    const scored = rows
      .map((r) => {
        const candidateText = [r.resortName, r.brandName, r.title].filter(Boolean).join(" ");
        const confidence = matchScore(resortQuery, candidateText);
        return { ...r, confidence };
      })
      .filter((r) => r.confidence >= MIN_CONFIDENCE)
      // Sort by confidence desc, then price asc (lowest rate within best-match group)
      .sort((a, b) => (b.confidence - a.confidence) || (Number(a.price) - Number(b.price)));

    if (scored.length === 0) {
      return NextResponse.json({ deal: null, reason: "no_match" }, { headers: CORS_HEADERS });
    }

    // Among the top-confidence tier (within 0.1 of best), pick the cheapest
    const topConf = scored[0].confidence;
    const topTier = scored.filter((r) => r.confidence >= topConf - 0.1);
    const winner = topTier.sort((a, b) => Number(a.price) - Number(b.price))[0];

    // Pull price history for the winning deal to derive the tag
    const history = await db
      .select({ price: schema.dealPriceHistory.price, scrapedAt: schema.dealPriceHistory.scrapedAt })
      .from(schema.dealPriceHistory)
      .where(eq(schema.dealPriceHistory.dealId, winner.dealId));

    const firstScrapedAt = history.length > 0
      ? history.reduce((min, h) => (h.scrapedAt < min ? h.scrapedAt : min), history[0].scrapedAt)
      : winner.scrapedAt;

    const tag = deriveTag({
      dealId: winner.dealId,
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
          resortName: winner.resortName ?? winner.title,
          tag: tag.label,
          tagColor: tag.color,
          landerUrl: `https://vacationdeals.to/deals/${winner.slug}?utm_source=chrome_ext&utm_medium=gbp_injection&utm_campaign=vacpack_rate`,
          matchConfidence: Math.round(winner.confidence * 100) / 100,
        },
      },
      { headers: CORS_HEADERS },
    );
  } catch (e) {
    console.error("[api/extension/match]", e);
    return NextResponse.json({ deal: null, reason: "error" }, { status: 500, headers: CORS_HEADERS });
  }
}

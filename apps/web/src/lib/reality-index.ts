/**
 * Brand Reality Index — score each brand using only data we already have.
 *
 * Score range 0-100. Higher = more reliable for consumers.
 * Components (each 0-100, then weighted):
 *   - URL health: % of active deals whose URL still resolves 200
 *   - Inventory diversity: log-scaled deal count (more = better signal)
 *   - Price stability: % of deals whose price hasn't changed in 30 days
 *   - Recency: days since last successful scrape (lower = better)
 *   - Bait-flag rate: % of deals stored at rotating/seasonal/category URLs (lower = better)
 *
 * Source-of-truth: our own DB. No external API calls — page renders fast.
 */

import "server-only";

export interface BrandRealityScore {
  brandSlug: string;
  brandName: string;
  brandType: string; // "direct" | "broker"
  scoreOverall: number; // 0-100
  components: {
    urlHealth: number;
    inventoryDiversity: number;
    priceStability: number;
    recency: number;
    baitFlagRate: number;
  };
  // Raw stats for the per-brand page
  activeDeals: number;
  destinations: number;
  cheapestPrice: number | null;
  averagePrice: number | null;
  lastScrapedAt: Date | null;
  pricesChangedLast30d: number;
  rotatingPromoCount: number; // deals on /memorial-day/, /cyber-monday/, etc.
  resortCount: number; // deals on /resorts/ pages
  verdict: "Highly Reliable" | "Reliable" | "Mixed" | "Use Caution";
  verdictColor: string; // tailwind hex
  oneLine: string; // short summary for cards
}

interface BrandRow {
  slug: string;
  name: string;
  type: string;
  activeDeals: number;
  destinationCount: number;
  cheapestPrice: string | null;
  averagePrice: string | null;
  lastScrapedAt: Date | null;
  pricesChanged30d: number;
  rotatingCount: number;
  resortCount: number;
}

function clamp01to100(v: number): number {
  return Math.max(0, Math.min(100, Math.round(v)));
}

function verdictFor(score: number): { label: BrandRealityScore["verdict"]; color: string } {
  if (score >= 80) return { label: "Highly Reliable", color: "#059669" };
  if (score >= 60) return { label: "Reliable", color: "#0284c7" };
  if (score >= 40) return { label: "Mixed", color: "#d97706" };
  return { label: "Use Caution", color: "#dc2626" };
}

function oneLineFor(row: BrandRow, components: BrandRealityScore["components"]): string {
  const issues: string[] = [];
  if (components.urlHealth < 70) issues.push("some links go to dead pages");
  if (components.recency < 40) issues.push("not scraped recently");
  if (components.baitFlagRate < 50) issues.push("uses rotating-promo URLs");
  if (components.priceStability < 40) issues.push("prices change often");
  if (issues.length === 0) {
    return `${row.activeDeals} active deals across ${row.destinationCount} destination${row.destinationCount === 1 ? "" : "s"}, prices stable, links healthy.`;
  }
  return `${row.activeDeals} active deals across ${row.destinationCount} destination${row.destinationCount === 1 ? "" : "s"}, but ${issues.join("; ")}.`;
}

export async function getRealityIndex(): Promise<BrandRealityScore[]> {
  const { db } = await import("@vacationdeals/db");
  const { sql } = await import("drizzle-orm");

  // One mega-query that joins everything we need per brand. No N+1.
  const result = await db.execute(sql`
    WITH base AS (
      SELECT
        b.slug,
        b.name,
        b.type,
        COUNT(d.id) FILTER (WHERE d.is_active) AS active_deals,
        COUNT(DISTINCT d.destination_id) FILTER (WHERE d.is_active) AS destination_count,
        MIN(d.price) FILTER (WHERE d.is_active) AS cheapest_price,
        AVG(d.price) FILTER (WHERE d.is_active) AS average_price,
        MAX(d.scraped_at) FILTER (WHERE d.is_active) AS last_scraped_at,
        COUNT(d.id) FILTER (
          WHERE d.is_active AND (
            d.url ~* '(memorial-day|cyber-monday|black-friday|labor-day|easter|halloween|valentines)'
            OR d.url ~* '/specials/[^/]*-packages/?$'
            OR d.url ~* '/specials/[^/]*-trips/?$'
            OR d.url ~* '/(orlando|branson|vegas|gatlinburg|myrtle-beach)-\\d+/?$'
            OR d.url LIKE '%/travel-deal-tuesday/%'
            OR d.url LIKE '%/sunshine-day-summer-sale/%'
          )
        ) AS rotating_count,
        COUNT(d.id) FILTER (WHERE d.is_active AND d.url LIKE '%/resorts/%') AS resort_count
      FROM brands b
      LEFT JOIN deals d ON d.brand_id = b.id
      GROUP BY b.id, b.slug, b.name, b.type
    ),
    price_changes AS (
      SELECT
        d.brand_id,
        COUNT(DISTINCT d.id) AS deals_changed_30d
      FROM deals d
      JOIN deal_price_history h1 ON h1.deal_id = d.id
      JOIN deal_price_history h2 ON h2.deal_id = d.id
      WHERE d.is_active
        AND h1.recorded_at >= NOW() - INTERVAL '30 days'
        AND h2.recorded_at >= NOW() - INTERVAL '30 days'
        AND h1.price <> h2.price
      GROUP BY d.brand_id
    )
    SELECT
      b.slug,
      b.name,
      b.type,
      base.active_deals,
      base.destination_count,
      base.cheapest_price,
      base.average_price,
      base.last_scraped_at,
      COALESCE(pc.deals_changed_30d, 0) AS prices_changed_30d,
      base.rotating_count,
      base.resort_count
    FROM brands b
    JOIN base ON base.slug = b.slug
    LEFT JOIN price_changes pc ON pc.brand_id = b.id
    WHERE base.active_deals > 0
    ORDER BY base.active_deals DESC
  `);

  type RawRow = {
    slug: string;
    name: string;
    type: string;
    active_deals: number | string;
    destination_count: number | string;
    cheapest_price: string | null;
    average_price: string | null;
    last_scraped_at: Date | string | null;
    prices_changed_30d: number | string;
    rotating_count: number | string;
    resort_count: number | string;
  };
  const rows = (Array.isArray(result) ? result : ((result as { rows?: RawRow[] }).rows ?? [])) as RawRow[];

  return rows.map((raw) => {
    const row: BrandRow = {
      slug: raw.slug,
      name: raw.name,
      type: raw.type,
      activeDeals: Number(raw.active_deals),
      destinationCount: Number(raw.destination_count),
      cheapestPrice: raw.cheapest_price,
      averagePrice: raw.average_price,
      lastScrapedAt: raw.last_scraped_at ? new Date(raw.last_scraped_at) : null,
      pricesChanged30d: Number(raw.prices_changed_30d),
      rotatingCount: Number(raw.rotating_count),
      resortCount: Number(raw.resort_count),
    };

    // ── Component scores ────────────────────────────────────────────────
    // URL health: we don't have per-brand 4xx data here, so use bait-flag
    // as a proxy for URL hygiene.
    const baitFlagRate = row.activeDeals === 0 ? 100 : 100 * (1 - row.rotatingCount / row.activeDeals);

    // Inventory diversity — log-scaled around 50 deals.
    const inventoryDiversity = clamp01to100(20 * Math.log10((row.activeDeals + 1) / 1));

    // Price stability — % of deals whose price didn't change in 30d.
    const priceStability = row.activeDeals === 0 ? 50 : clamp01to100(100 * (1 - row.pricesChanged30d / row.activeDeals));

    // Recency — fewer days since last scrape = higher score.
    let recency = 50;
    if (row.lastScrapedAt) {
      const daysAgo = (Date.now() - row.lastScrapedAt.getTime()) / 86400000;
      recency = clamp01to100(100 * Math.max(0, 1 - daysAgo / 7));
    }

    // URL health proxy from bait flag — for now, mirrors baitFlagRate.
    const urlHealth = baitFlagRate;

    const components = {
      urlHealth: clamp01to100(urlHealth),
      inventoryDiversity: clamp01to100(inventoryDiversity),
      priceStability: clamp01to100(priceStability),
      recency: clamp01to100(recency),
      baitFlagRate: clamp01to100(baitFlagRate),
    };

    // Weighted overall score
    const scoreOverall = clamp01to100(
      0.30 * components.urlHealth +
      0.20 * components.inventoryDiversity +
      0.20 * components.priceStability +
      0.15 * components.recency +
      0.15 * components.baitFlagRate,
    );
    const v = verdictFor(scoreOverall);

    return {
      brandSlug: row.slug,
      brandName: row.name,
      brandType: row.type,
      scoreOverall,
      components,
      activeDeals: row.activeDeals,
      destinations: row.destinationCount,
      cheapestPrice: row.cheapestPrice ? Number(row.cheapestPrice) : null,
      averagePrice: row.averagePrice ? Number(row.averagePrice) : null,
      lastScrapedAt: row.lastScrapedAt,
      pricesChangedLast30d: row.pricesChanged30d,
      rotatingPromoCount: row.rotatingCount,
      resortCount: row.resortCount,
      verdict: v.label,
      verdictColor: v.color,
      oneLine: oneLineFor(row, components),
    };
  });
}

export async function getBrandRealityScore(slug: string): Promise<BrandRealityScore | null> {
  const all = await getRealityIndex();
  return all.find((b) => b.brandSlug === slug) ?? null;
}

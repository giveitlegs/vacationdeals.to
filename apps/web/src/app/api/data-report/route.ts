import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/data-report
 *
 * Generates a comprehensive historical VacPack rate data report with full
 * scrape provenance. Protected by PAYLOAD_SECRET bearer token.
 *
 * Query params:
 *   brand    - Filter by brand slug (optional)
 *   dest     - Filter by destination slug (optional)
 *   from     - Start date YYYY-MM-DD (optional, default 365 days ago)
 *   to       - End date YYYY-MM-DD (optional, default today)
 *   format   - "json" (default) or "csv"
 */
export async function GET(request: NextRequest) {
  // Auth check
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");
  if (!token || token !== process.env.PAYLOAD_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const brandSlug = searchParams.get("brand");
  const destSlug = searchParams.get("dest");
  const fromDate = searchParams.get("from");
  const toDate = searchParams.get("to");
  const format = searchParams.get("format") || "json";

  try {
    const { db } = await import("@vacationdeals/db");
    const schema = await import("@vacationdeals/db");
    const { sql, eq, and, gte, lte, desc } = await import("drizzle-orm");

    // Date range
    const from = fromDate ? new Date(fromDate) : new Date(Date.now() - 365 * 86400000);
    const to = toDate ? new Date(toDate + "T23:59:59") : new Date();

    // Build conditions
    const conditions: ReturnType<typeof eq>[] = [
      gte(schema.dealPriceHistory.scrapedAt, from),
      lte(schema.dealPriceHistory.scrapedAt, to),
    ];

    if (brandSlug) {
      const brand = await db.query.brands.findFirst({
        where: eq(schema.brands.slug, brandSlug),
      });
      if (brand) conditions.push(eq(schema.deals.brandId, brand.id));
    }

    if (destSlug) {
      const dest = await db.query.destinations.findFirst({
        where: eq(schema.destinations.slug, destSlug),
      });
      if (dest) conditions.push(eq(schema.deals.destinationId, dest.id));
    }

    // Fetch all price history with full provenance
    const rows = await db
      .select({
        historyId: schema.dealPriceHistory.id,
        price: schema.dealPriceHistory.price,
        scrapedAt: schema.dealPriceHistory.scrapedAt,
        dealId: schema.deals.id,
        dealTitle: schema.deals.title,
        dealSlug: schema.deals.slug,
        resortName: schema.deals.resortName,
        sourceUrl: schema.deals.url,
        durationNights: schema.deals.durationNights,
        durationDays: schema.deals.durationDays,
        originalPrice: schema.deals.originalPrice,
        dealCreatedAt: schema.deals.createdAt,
        dealScrapedAt: schema.deals.scrapedAt,
        brandName: schema.brands.name,
        brandSlug: schema.brands.slug,
        brandType: schema.brands.type,
        brandWebsite: schema.brands.website,
        destinationCity: schema.destinations.city,
        destinationState: schema.destinations.state,
        destinationCountry: schema.destinations.country,
        sourceName: schema.sources.name,
        sourceBaseUrl: schema.sources.baseUrl,
        sourceScraperKey: schema.sources.scraperKey,
      })
      .from(schema.dealPriceHistory)
      .innerJoin(schema.deals, sql`${schema.dealPriceHistory.dealId} = ${schema.deals.id}`)
      .leftJoin(schema.brands, sql`${schema.deals.brandId} = ${schema.brands.id}`)
      .leftJoin(schema.destinations, sql`${schema.deals.destinationId} = ${schema.destinations.id}`)
      .leftJoin(schema.sources, sql`${schema.deals.sourceId} = ${schema.sources.id}`)
      .where(and(...conditions))
      .orderBy(desc(schema.dealPriceHistory.scrapedAt))
      .limit(50000);

    // Fetch scrape run provenance
    const scrapeRunConditions: ReturnType<typeof eq>[] = [
      gte(schema.scrapeRuns.startedAt, from),
      lte(schema.scrapeRuns.startedAt, to),
    ];
    if (brandSlug) {
      scrapeRunConditions.push(eq(schema.scrapeRuns.scraperKey, brandSlug));
    }

    const scrapeRuns = await db
      .select()
      .from(schema.scrapeRuns)
      .where(and(...scrapeRunConditions))
      .orderBy(desc(schema.scrapeRuns.startedAt))
      .limit(5000);

    // Build report
    const report = {
      metadata: {
        reportTitle: "VacPack Historical Rate Data Report",
        generatedAt: new Date().toISOString(),
        generatedBy: "VacationDeals.to Data Intelligence",
        dateRange: { from: from.toISOString().split("T")[0], to: to.toISOString().split("T")[0] },
        filters: {
          brand: brandSlug || "all",
          destination: destSlug || "all",
        },
        totalRecords: rows.length,
        totalScrapeRuns: scrapeRuns.length,
      },
      methodology: {
        description: "Price data is collected via automated web crawlers running every 6 hours on a dedicated server. Each crawler targets a specific timeshare brand or broker website and extracts deal pricing, resort names, destinations, durations, and inclusions.",
        scrapeFrequency: "Every 6 hours (4x daily) via cron: 0 */6 * * *",
        infrastructure: "Crawlee framework (CheerioCrawler for static sites, PlaywrightCrawler for JS-heavy sites) on Ubuntu 24.04 VPS",
        dataIntegrity: "Each price observation is timestamped at the moment of extraction. Price history records are append-only — no historical data is ever modified or deleted. Deal URLs serve as unique identifiers for deduplication.",
        expirationDetection: "Multi-strategy detection: keyword matching, date parsing, seasonal pattern recognition, and JSON field analysis. Only deal-specific text is analyzed to prevent false positives from shared page elements.",
      },
      priceHistory: rows.map((r) => ({
        observationId: r.historyId,
        observationTimestamp: r.scrapedAt.toISOString(),
        price: Number(r.price),
        originalRetailPrice: r.originalPrice ? Number(r.originalPrice) : null,
        deal: {
          id: r.dealId,
          title: r.dealTitle,
          slug: r.dealSlug,
          resortName: r.resortName,
          sourceUrl: r.sourceUrl,
          durationNights: r.durationNights,
          durationDays: r.durationDays,
          firstSeenAt: r.dealCreatedAt.toISOString(),
          lastVerifiedAt: r.dealScrapedAt.toISOString(),
        },
        brand: {
          name: r.brandName,
          slug: r.brandSlug,
          type: r.brandType,
          website: r.brandWebsite,
        },
        destination: {
          city: r.destinationCity,
          state: r.destinationState,
          country: r.destinationCountry,
        },
        source: {
          name: r.sourceName,
          baseUrl: r.sourceBaseUrl,
          scraperKey: r.sourceScraperKey,
        },
      })),
      scrapeProvenance: scrapeRuns.map((r) => ({
        runId: r.id,
        scraperKey: r.scraperKey,
        startedAt: r.startedAt.toISOString(),
        finishedAt: r.finishedAt?.toISOString() ?? null,
        durationSeconds: r.finishedAt && r.startedAt
          ? Math.round((new Date(r.finishedAt).getTime() - new Date(r.startedAt).getTime()) / 1000)
          : null,
        status: r.status,
        dealsFound: r.dealsFound,
        dealsStored: r.dealsStored,
        errorMessage: r.errorMessage,
      })),
    };

    if (format === "csv") {
      // Generate CSV
      const headers = [
        "observation_id", "timestamp", "price", "retail_price",
        "deal_title", "resort_name", "source_url", "nights", "days",
        "brand_name", "brand_slug", "brand_type",
        "city", "state", "country",
        "source_name", "source_base_url", "scraper_key",
        "first_seen_at", "last_verified_at",
      ];
      const csvRows = [headers.join(",")];
      for (const r of report.priceHistory) {
        csvRows.push([
          r.observationId, r.observationTimestamp, r.price, r.originalRetailPrice ?? "",
          `"${(r.deal.title || "").replace(/"/g, '""')}"`,
          `"${(r.deal.resortName || "").replace(/"/g, '""')}"`,
          `"${r.deal.sourceUrl}"`,
          r.deal.durationNights, r.deal.durationDays,
          `"${r.brand.name}"`, r.brand.slug, r.brand.type,
          `"${r.destination.city ?? ""}"`, r.destination.state ?? "", r.destination.country ?? "",
          `"${r.source.name ?? ""}"`, `"${r.source.baseUrl ?? ""}"`, r.source.scraperKey ?? "",
          r.deal.firstSeenAt, r.deal.lastVerifiedAt,
        ].join(","));
      }

      return new NextResponse(csvRows.join("\n"), {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="vacpack-rate-data-${new Date().toISOString().split("T")[0]}.csv"`,
        },
      });
    }

    return NextResponse.json(report, {
      headers: {
        "Content-Disposition": `attachment; filename="vacpack-rate-report-${new Date().toISOString().split("T")[0]}.json"`,
      },
    });
  } catch (e) {
    console.error("[data-report] Failed:", e);
    return NextResponse.json({ error: "Report generation failed" }, { status: 500 });
  }
}

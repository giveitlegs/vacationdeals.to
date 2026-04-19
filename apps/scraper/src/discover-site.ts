/**
 * Site Discovery Crawler
 *
 * Crawls an entire brand website to discover ALL pages, not just deal pages.
 * Maps the full URL structure, finds pages with prices, and stores results
 * in the site_pages table.
 *
 * Usage:
 *   npx tsx src/discover-site.ts --url=https://westgatereservations.com --source=westgate
 *   npx tsx src/discover-site.ts --url=https://clubwyndham.wyndhamdestinations.com --source=wyndham --max=100
 *
 * This is the VacationDeals.to equivalent of Screaming Frog — a full site crawl
 * that discovers every accessible page and logs what it finds.
 */

import { CheerioCrawler } from "crawlee";
import { db } from "@vacationdeals/db";
import { sitePages, sources } from "@vacationdeals/db";
import { eq, sql } from "drizzle-orm";

async function main() {
  const urlArg = process.argv.find((a) => a.startsWith("--url="))?.split("=")[1];
  const sourceArg = process.argv.find((a) => a.startsWith("--source="))?.split("=")[1];
  const maxArg = parseInt(process.argv.find((a) => a.startsWith("--max="))?.split("=")[1] || "200");

  if (!urlArg) {
    console.error("Usage: npx tsx src/discover-site.ts --url=https://example.com --source=source-key [--max=200]");
    process.exit(1);
  }

  const baseUrl = urlArg.replace(/\/$/, "");
  const baseHost = new URL(baseUrl).hostname;

  console.log(`\n=== Site Discovery: ${baseUrl} ===`);
  console.log(`Max pages: ${maxArg}`);
  console.log(`Source key: ${sourceArg || "none"}\n`);

  // Find source in DB
  let sourceId: number | null = null;
  if (sourceArg) {
    const source = await db.query.sources.findFirst({
      where: eq(sources.scraperKey, sourceArg),
    });
    sourceId = source?.id ?? null;
  }

  let pagesFound = 0;
  let pagesWithPrices = 0;
  const discoveredUrls = new Set<string>();

  const crawler = new CheerioCrawler({
    maxRequestsPerCrawl: maxArg,
    maxRequestRetries: 1,
    requestHandlerTimeoutSecs: 30,
    maxConcurrency: 3,

    async requestHandler({ request, $, body, log }) {
      const url = request.url;
      const html = typeof body === "string" ? body : body.toString();

      // Extract page info
      const title = $("title").text().trim().slice(0, 500);
      const wordCount = $("body").text().split(/\s+/).length;

      // Find prices on page
      const priceMatches = html.match(/\$(\d{2,4})/g) || [];
      const prices = priceMatches
        .map((p) => parseFloat(p.replace("$", "")))
        .filter((p) => p >= 49 && p <= 2000);
      const hasPrice = prices.length > 0;
      const cheapestPrice = hasPrice ? Math.min(...prices) : null;

      // Store in DB
      try {
        // Upsert by URL
        const existing = await db.select({ id: sitePages.id }).from(sitePages)
          .where(eq(sitePages.url, url)).limit(1);

        if (existing.length > 0) {
          await db.update(sitePages).set({
            title,
            statusCode: 200,
            contentType: "text/html",
            hasPrice,
            priceFound: cheapestPrice ? String(cheapestPrice) : null,
            wordCount,
            lastCrawledAt: new Date(),
          }).where(eq(sitePages.id, existing[0].id));
        } else {
          await db.insert(sitePages).values({
            sourceId,
            url,
            title,
            statusCode: 200,
            contentType: "text/html",
            hasPrice,
            priceFound: cheapestPrice ? String(cheapestPrice) : null,
            wordCount,
          });
        }
      } catch (e) {
        // ignore DB errors for discovery
      }

      pagesFound++;
      if (hasPrice) pagesWithPrices++;

      const priceStr = hasPrice ? ` | $${cheapestPrice} (${prices.length} prices)` : "";
      log.info(`[${pagesFound}] ${title.slice(0, 60)}${priceStr}`);

      // Discover more links on this page
      $("a[href]").each((_, el) => {
        const href = $(el).attr("href");
        if (!href) return;

        let fullUrl: string;
        try {
          fullUrl = new URL(href, url).href;
        } catch { return; }

        // Only follow links on the same host
        const linkHost = new URL(fullUrl).hostname;
        if (linkHost !== baseHost) return;

        // Skip non-page URLs
        if (fullUrl.includes("#") || fullUrl.includes("?") ||
            /\.(pdf|jpg|jpeg|png|gif|svg|css|js|ico|woff|woff2|ttf|eot)$/i.test(fullUrl)) return;

        // Strip trailing slash for dedup
        const normalized = fullUrl.replace(/\/$/, "");
        if (!discoveredUrls.has(normalized)) {
          discoveredUrls.add(normalized);
          crawler.addRequests([normalized]);
        }
      });
    },

    async failedRequestHandler({ request, log }) {
      log.warning(`Failed: ${request.url}`);
      try {
        await db.insert(sitePages).values({
          sourceId,
          url: request.url,
          statusCode: 0,
          contentType: "error",
          hasPrice: false,
        }).onConflictDoNothing();
      } catch {}
    },
  });

  await crawler.run([baseUrl]);

  console.log(`\n=== Discovery Complete ===`);
  console.log(`Pages crawled: ${pagesFound}`);
  console.log(`Pages with prices: ${pagesWithPrices}`);
  console.log(`Total URLs discovered: ${discoveredUrls.size}`);

  process.exit(0);
}

main().catch((err) => {
  console.error("Discovery failed:", err);
  process.exit(1);
});

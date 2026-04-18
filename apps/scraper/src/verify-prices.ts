/**
 * Price Verification Script
 *
 * Runs every 6 hours (via cron) to spot-check deal prices against live source URLs.
 * For each active deal, fetches the source URL and checks if the price is still
 * present on the page. Flags deals where:
 * - The source URL is dead (404/5xx)
 * - The price on the source page has changed
 * - The deal appears to be expired/sold out
 *
 * Usage: npx tsx src/verify-prices.ts [--brand=westgate] [--limit=50]
 */

import { db } from "@vacationdeals/db";
import { deals, brands, dealPriceHistory } from "@vacationdeals/db";
import { eq, and, desc, sql } from "drizzle-orm";

const BATCH_SIZE = 50; // verify this many deals per run
const TIMEOUT = 15000;
const EXPIRED_KEYWORDS = ["expired", "sold out", "no longer available", "unavailable", "not found", "404"];

interface VerificationResult {
  dealId: number;
  slug: string;
  brandName: string;
  ourPrice: number;
  sourceUrl: string;
  status: "ok" | "price_changed" | "dead_url" | "expired" | "error";
  livePrice?: number;
  message?: string;
}

async function fetchPagePrices(url: string): Promise<{ prices: number[]; text: string; statusCode: number }> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(TIMEOUT),
    });

    if (!res.ok) {
      return { prices: [], text: "", statusCode: res.status };
    }

    const html = await res.text();

    // Extract all dollar amounts from the page
    const priceMatches = html.match(/\$\s*(\d{2,4}(?:\.\d{2})?)/g) || [];
    const prices = priceMatches
      .map((m) => parseFloat(m.replace(/[\$,\s]/g, "")))
      .filter((p) => p >= 49 && p <= 2000); // reasonable vacation deal range

    return { prices, text: html.toLowerCase(), statusCode: res.status };
  } catch (e) {
    return { prices: [], text: "", statusCode: 0 };
  }
}

async function verifyDeal(deal: {
  id: number;
  slug: string;
  price: string;
  url: string;
  brandName: string | null;
}): Promise<VerificationResult> {
  const ourPrice = Number(deal.price);
  const result: VerificationResult = {
    dealId: deal.id,
    slug: deal.slug,
    brandName: deal.brandName ?? "Unknown",
    ourPrice,
    sourceUrl: deal.url,
    status: "ok",
  };

  const { prices, text, statusCode } = await fetchPagePrices(deal.url);

  // Dead URL
  if (statusCode === 0 || statusCode >= 400) {
    result.status = "dead_url";
    result.message = `HTTP ${statusCode || "timeout"}`;
    return result;
  }

  // Check for expired keywords
  for (const kw of EXPIRED_KEYWORDS) {
    if (text.includes(kw)) {
      result.status = "expired";
      result.message = `Page contains "${kw}"`;
      return result;
    }
  }

  // Check if our price still appears on the page
  if (prices.length > 0) {
    if (prices.includes(ourPrice)) {
      result.status = "ok";
      result.message = `Price $${ourPrice} confirmed on page`;
    } else {
      // Find the closest price to ours
      const closest = prices.reduce((a, b) =>
        Math.abs(b - ourPrice) < Math.abs(a - ourPrice) ? b : a
      );
      result.status = "price_changed";
      result.livePrice = closest;
      result.message = `Our: $${ourPrice}, Live page shows: $${prices.join(", $")} (closest: $${closest})`;
    }
  } else {
    // No prices found on page — might be JS-rendered
    result.status = "ok";
    result.message = "No prices extracted (JS-rendered page?)";
  }

  return result;
}

async function main() {
  const brandArg = process.argv.find((a) => a.startsWith("--brand="))?.split("=")[1];
  const limitArg = parseInt(process.argv.find((a) => a.startsWith("--limit="))?.split("=")[1] || String(BATCH_SIZE));

  console.log(`\n=== Price Verification ===\n`);
  console.log(`Batch size: ${limitArg}${brandArg ? `, Brand: ${brandArg}` : ""}\n`);

  // Get deals to verify (oldest-verified first)
  const conditions = [eq(deals.isActive, true)];
  if (brandArg) {
    const brand = await db.query.brands.findFirst({ where: eq(brands.slug, brandArg) });
    if (brand) conditions.push(eq(deals.brandId, brand.id));
  }

  const dealsToVerify = await db
    .select({
      id: deals.id,
      slug: deals.slug,
      price: deals.price,
      url: deals.url,
      brandName: brands.name,
    })
    .from(deals)
    .leftJoin(brands, sql`${deals.brandId} = ${brands.id}`)
    .where(and(...conditions))
    .orderBy(deals.scrapedAt) // oldest first = most stale
    .limit(limitArg);

  console.log(`Verifying ${dealsToVerify.length} deals...\n`);

  const results: VerificationResult[] = [];
  let ok = 0, changed = 0, dead = 0, expired = 0, errors = 0;

  for (const deal of dealsToVerify) {
    const result = await verifyDeal(deal);
    results.push(result);

    switch (result.status) {
      case "ok": ok++; break;
      case "price_changed":
        changed++;
        console.log(`[PRICE CHANGED] ${result.brandName} | ${result.slug} | ${result.message}`);
        // Update the price in the DB
        if (result.livePrice) {
          await db.update(deals).set({
            price: String(result.livePrice),
            scrapedAt: new Date(),
            updatedAt: new Date(),
          }).where(eq(deals.id, deal.id));
          await db.insert(dealPriceHistory).values({
            dealId: deal.id,
            price: String(result.livePrice),
          });
          console.log(`  → Updated to $${result.livePrice}`);
        }
        break;
      case "dead_url":
        dead++;
        console.log(`[DEAD URL] ${result.brandName} | ${result.slug} | ${result.message}`);
        break;
      case "expired":
        expired++;
        console.log(`[EXPIRED] ${result.brandName} | ${result.slug} | ${result.message}`);
        // Mark as inactive
        await db.update(deals).set({ isActive: false, updatedAt: new Date() }).where(eq(deals.id, deal.id));
        console.log(`  → Marked inactive`);
        break;
      default: errors++; break;
    }

    // Rate limit: 1 request per second
    await new Promise((r) => setTimeout(r, 1000));
  }

  console.log(`\n=== Results ===`);
  console.log(`OK: ${ok} | Changed: ${changed} | Dead: ${dead} | Expired: ${expired} | Errors: ${errors}`);
  console.log(`Total verified: ${results.length}\n`);

  process.exit(0);
}

main().catch((err) => {
  console.error("Verification failed:", err);
  process.exit(1);
});

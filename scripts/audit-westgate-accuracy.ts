/**
 * Westgate deal-accuracy audit.
 *
 * For every active Westgate deal in our DB:
 *   - Fetch the destination URL
 *   - Extract the visible price + nights from the page
 *   - Compare to what we have stored
 *   - Flag mismatches
 *
 * Writes a JSON report + prints a short summary. Does NOT mutate the DB
 * on its own — pass --deactivate to mark confirmed-wrong deals inactive.
 *
 * Run:
 *   npx tsx scripts/audit-westgate-accuracy.ts
 *   npx tsx scripts/audit-westgate-accuracy.ts --deactivate
 */

import { db, deals, brands } from "@vacationdeals/db";
import { eq, and, sql } from "drizzle-orm";
import fs from "node:fs";
import path from "node:path";

const DEACTIVATE = process.argv.includes("--deactivate");
const OUT = path.join(process.cwd(), "reports", `westgate-audit-${new Date().toISOString().split("T")[0]}.json`);

interface DealRow {
  id: number;
  slug: string;
  title: string;
  price: string;
  durationNights: number | null;
  durationDays: number | null;
  url: string | null;
}

interface PageFacts {
  pagePrice: number | null;
  pageNights: number | null;
  pageDays: number | null;
  title: string | null;
  fetchedStatus: number;
}

async function fetchDeals(): Promise<DealRow[]> {
  const brand = await db.select({ id: brands.id }).from(brands).where(eq(brands.slug, "westgate")).limit(1);
  if (brand.length === 0) throw new Error("westgate brand not found");
  const rows = await db.select({
    id: deals.id,
    slug: deals.slug,
    title: deals.title,
    price: deals.price,
    durationNights: deals.durationNights,
    durationDays: deals.durationDays,
    url: deals.url,
  }).from(deals).where(and(eq(deals.brandId, brand[0].id), eq(deals.isActive, true)));
  return rows as DealRow[];
}

function parseNightsFromText(text: string): { nights: number | null; days: number | null } {
  // Look for "X-Day/Y-Night", "X Days, Y Nights", "X Nights", etc.
  const patterns = [
    /(\d+)\s*Days?\s*[\/,\-&]\s*(\d+)\s*Nights?/i,
    /(\d+)\s*Days?\s+and\s+(\d+)\s*Nights?/i,
    /(\d+)\s*Nights?\s*[\/,\-&]\s*(\d+)\s*Days?/i,
    /(\d+)-Day[\/,\-\s]+(\d+)-Night/i,
    /(\d+)-Night[\/,\-\s]+(\d+)-Day/i,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) {
      // First pattern group is first number, second is second number
      const a = parseInt(m[1], 10);
      const b = parseInt(m[2], 10);
      // Heuristic: days > nights typically. Use the larger as days.
      const [days, nights] = a > b ? [a, b] : [b, a];
      return { days, nights };
    }
  }
  // Just nights
  const mN = text.match(/(\d+)[-\s]?Night/i);
  if (mN) {
    const n = parseInt(mN[1], 10);
    if (n >= 1 && n <= 14) return { nights: n, days: n + 1 };
  }
  return { nights: null, days: null };
}

function parsePriceFromText(text: string): number | null {
  // Look for $XXX patterns. Pick the SMALLEST plausible price (promotional rate).
  const matches = [...text.matchAll(/\$\s*([\d,]+(?:\.\d{2})?)/g)]
    .map((m) => parseFloat(m[1].replace(/,/g, "")))
    .filter((n) => Number.isFinite(n) && n >= 29 && n <= 2000);
  if (matches.length === 0) return null;
  // Westgate lists promo price first; take the smallest in the early text
  return Math.min(...matches);
}

async function fetchPageFacts(url: string): Promise<PageFacts> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; VacationDealsAudit/1.0)",
      },
      redirect: "follow",
    });
    if (!res.ok) {
      return { pagePrice: null, pageNights: null, pageDays: null, title: null, fetchedStatus: res.status };
    }
    const html = await res.text();
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch?.[1]?.trim() ?? null;
    // Strip HTML tags and scripts; focus on body text
    const stripped = html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/\s+/g, " ");
    // Focus on the first 4000 chars (hero + headline usually contain price/duration)
    const head = stripped.slice(0, 4000);
    const { nights, days } = parseNightsFromText(head + " " + (title ?? ""));
    const pagePrice = parsePriceFromText(head);
    return { pagePrice, pageNights: nights, pageDays: days, title, fetchedStatus: 200 };
  } catch (e) {
    return { pagePrice: null, pageNights: null, pageDays: null, title: null, fetchedStatus: 0 };
  }
}

async function main() {
  const rows = await fetchDeals();
  console.log(`Auditing ${rows.length} active Westgate deals...`);

  const report: Array<{
    dealId: number;
    slug: string;
    url: string | null;
    dbPrice: number;
    dbNights: number | null;
    pageStatus: number;
    pagePrice: number | null;
    pageNights: number | null;
    mismatch: string[];
    severity: "ok" | "minor" | "major";
  }> = [];

  let ok = 0, minor = 0, major = 0, unreachable = 0;

  for (const r of rows) {
    if (!r.url) {
      report.push({ dealId: r.id, slug: r.slug, url: null, dbPrice: Number(r.price), dbNights: r.durationNights, pageStatus: 0, pagePrice: null, pageNights: null, mismatch: ["no-url"], severity: "major" });
      major++;
      continue;
    }

    const facts = await fetchPageFacts(r.url);
    const dbPrice = Number(r.price);
    const mismatch: string[] = [];

    if (facts.fetchedStatus !== 200) {
      mismatch.push(`fetch-${facts.fetchedStatus || "error"}`);
    }

    if (facts.pagePrice != null && Math.abs(facts.pagePrice - dbPrice) > 1) {
      mismatch.push(`price db=${dbPrice} page=${facts.pagePrice}`);
    }
    if (facts.pageNights != null && r.durationNights != null && facts.pageNights !== r.durationNights) {
      mismatch.push(`nights db=${r.durationNights} page=${facts.pageNights}`);
    }

    const severity: "ok" | "minor" | "major" =
      mismatch.length === 0 ? "ok"
        : mismatch.some((m) => m.startsWith("price") || m.startsWith("fetch-")) ? "major"
          : "minor";

    report.push({
      dealId: r.id,
      slug: r.slug,
      url: r.url,
      dbPrice,
      dbNights: r.durationNights,
      pageStatus: facts.fetchedStatus,
      pagePrice: facts.pagePrice,
      pageNights: facts.pageNights,
      mismatch,
      severity,
    });

    if (severity === "ok") ok++;
    else if (severity === "minor") minor++;
    else if (facts.fetchedStatus !== 200) { unreachable++; major++; }
    else major++;

    // Gentle rate limit
    await new Promise((r) => setTimeout(r, 400));
  }

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(report, null, 2));
  console.log(`\nReport written to ${OUT}`);
  console.log(`\nSummary: total=${rows.length}  ok=${ok}  minor=${minor}  major=${major}  unreachable=${unreachable}`);

  console.log("\nTop 15 major mismatches:");
  for (const r of report.filter((r) => r.severity === "major").slice(0, 15)) {
    console.log(`  [${r.dealId}] ${r.slug}  →  ${r.mismatch.join(", ")}`);
  }

  if (DEACTIVATE) {
    const toDeactivate = report.filter((r) => r.severity === "major" && r.pageStatus === 200 && r.mismatch.some((m) => m.startsWith("price")));
    console.log(`\n--deactivate passed. Deactivating ${toDeactivate.length} deals with confirmed price mismatch...`);
    for (const r of toDeactivate) {
      await db.update(deals).set({ isActive: false, updatedAt: new Date() }).where(eq(deals.id, r.dealId));
    }
    console.log(`Deactivated ${toDeactivate.length}.`);
  }

  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

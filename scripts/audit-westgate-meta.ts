/**
 * Westgate DOM-based accuracy audit (v3).
 *
 * Fetches every active Westgate deal URL, extracts price + nights from the
 * <meta description> / <meta og:description> tags (which carry the canonical
 * marketer copy like "3-day/2-night Orlando Resort stay ... From $329"),
 * and compares to our DB values.
 *
 * Meta descriptions are server-rendered and have stable patterns:
 *   - "3-day/2-night", "X-Day Resort stay", "X days Y nights"
 *   - "From $XXX", "for just $XXX", "for $XXX", "starting at $XXX"
 *
 * Run:
 *   npx tsx scripts/audit-westgate-meta.ts           (report only)
 *   npx tsx scripts/audit-westgate-meta.ts --fix     (update DB + slugs)
 */

import { db, deals, brands } from "@vacationdeals/db";
import { eq, and } from "drizzle-orm";
import fs from "node:fs";
import path from "node:path";

const FIX = process.argv.includes("--fix");
const OUT = path.join(process.cwd(), "reports", `westgate-meta-audit-${new Date().toISOString().split("T")[0]}.json`);

interface DealRow {
  id: number;
  slug: string;
  title: string;
  price: string;
  durationNights: number | null;
  durationDays: number | null;
  url: string | null;
}

interface MetaFacts {
  price: number | null;
  nights: number | null;
  days: number | null;
  metaText: string | null;
  status: number;
}

function extractMeta(html: string): string | null {
  // Prefer og:description (Westgate's hero blurb), fall back to description
  const patterns = [
    /<meta\s+property=["']og:description["']\s+content=["']([^"']+)["']/i,
    /<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i,
  ];
  for (const p of patterns) {
    const m = html.match(p);
    if (m) return m[1].replace(/&amp;/g, "&").replace(/&#039;/g, "'").replace(/&quot;/g, '"');
  }
  return null;
}

function parsePriceFromMeta(text: string): number | null {
  // Markers that reliably precede the deal price in Westgate copy:
  //   "From $XXX"  "for $XXX"  "for just $XXX"  "only $XXX"  "starting at $XXX"
  //   "$XXX per package"
  const markerPatterns = [
    /(?:from|for(?:\s+just)?|only|starting\s+at)\s+\$\s*([\d,]+(?:\.\d{2})?)/i,
    /\$\s*([\d,]+(?:\.\d{2})?)\s*(?:per\s+package|package)/i,
  ];
  for (const p of markerPatterns) {
    const m = text.match(p);
    if (m) {
      const n = parseFloat(m[1].replace(/,/g, ""));
      if (Number.isFinite(n) && n >= 29 && n <= 5000) return n;
    }
  }
  return null;
}

function parseNightsFromMeta(text: string): { nights: number | null; days: number | null } {
  // Patterns in observed Westgate copy:
  //   "3-day/2-night"  "4-day/3-night"  "5-Day/4-Night"
  //   "3-Day Resort stay" (= 2 nights by convention)
  //   "X days Y nights"
  //   "Stay X nights"
  const p1 = text.match(/(\d+)[-\s]?day\s*[\/,\-\s]+\s*(\d+)[-\s]?night/i);
  if (p1) {
    const days = parseInt(p1[1], 10);
    const nights = parseInt(p1[2], 10);
    if (days >= 2 && days <= 10 && nights >= 1 && nights <= 9) return { days, nights };
  }
  const p2 = text.match(/(\d+)[-\s]?night\s*[\/,\-\s]+\s*(\d+)[-\s]?day/i);
  if (p2) {
    const nights = parseInt(p2[1], 10);
    const days = parseInt(p2[2], 10);
    if (days >= 2 && days <= 10 && nights >= 1 && nights <= 9) return { days, nights };
  }
  const p3 = text.match(/(\d+)\s+days?\s+(\d+)\s+nights?/i);
  if (p3) {
    const days = parseInt(p3[1], 10);
    const nights = parseInt(p3[2], 10);
    if (days >= 2 && days <= 10 && nights >= 1 && nights <= 9) return { days, nights };
  }
  // "X-night" alone
  const p4 = text.match(/(\d+)[-\s]?nights?/i);
  if (p4) {
    const n = parseInt(p4[1], 10);
    if (n >= 1 && n <= 9) return { nights: n, days: n + 1 };
  }
  // "X-day" alone — by Westgate convention, day-count - 1 = nights
  const p5 = text.match(/(\d+)[-\s]?day/i);
  if (p5) {
    const d = parseInt(p5[1], 10);
    if (d >= 2 && d <= 10) return { days: d, nights: d - 1 };
  }
  return { nights: null, days: null };
}

async function fetchMeta(url: string): Promise<MetaFacts> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; VacationDealsAudit/1.0)" },
      redirect: "follow",
    });
    if (!res.ok) return { price: null, nights: null, days: null, metaText: null, status: res.status };
    const html = await res.text();
    const meta = extractMeta(html);
    if (!meta) return { price: null, nights: null, days: null, metaText: null, status: 200 };
    return {
      price: parsePriceFromMeta(meta),
      ...parseNightsFromMeta(meta),
      metaText: meta,
      status: 200,
    };
  } catch (e) {
    return { price: null, nights: null, days: null, metaText: null, status: 0 };
  }
}

async function main() {
  const brand = await db.select({ id: brands.id }).from(brands).where(eq(brands.slug, "westgate")).limit(1);
  if (brand.length === 0) throw new Error("westgate brand not found");

  const rows = (await db.select({
    id: deals.id,
    slug: deals.slug,
    title: deals.title,
    price: deals.price,
    durationNights: deals.durationNights,
    durationDays: deals.durationDays,
    url: deals.url,
  }).from(deals).where(and(eq(deals.brandId, brand[0].id), eq(deals.isActive, true)))) as DealRow[];

  console.log(`Auditing ${rows.length} active Westgate deals via <meta> tags...\n`);

  const report: Array<{
    id: number;
    slug: string;
    url: string;
    dbPrice: number;
    dbNights: number | null;
    metaPrice: number | null;
    metaNights: number | null;
    metaText: string | null;
    issues: string[];
    severity: "ok" | "minor" | "major";
  }> = [];

  let ok = 0, minor = 0, major = 0, unreadable = 0;

  for (const r of rows) {
    if (!r.url) {
      report.push({ id: r.id, slug: r.slug, url: "", dbPrice: Number(r.price), dbNights: r.durationNights, metaPrice: null, metaNights: null, metaText: null, issues: ["no-url"], severity: "major" });
      major++;
      continue;
    }

    const facts = await fetchMeta(r.url);
    const dbPrice = Number(r.price);
    const issues: string[] = [];

    if (facts.status !== 200) {
      issues.push(`fetch-${facts.status || "err"}`);
      unreadable++;
    } else if (!facts.metaText) {
      issues.push("no-meta");
      unreadable++;
    } else {
      if (facts.price != null && Math.abs(facts.price - dbPrice) > 1) {
        issues.push(`price db=${dbPrice} meta=${facts.price}`);
      }
      if (facts.nights != null && r.durationNights != null && facts.nights !== r.durationNights) {
        issues.push(`nights db=${r.durationNights} meta=${facts.nights}`);
      }
    }

    const severity: "ok" | "minor" | "major" =
      issues.length === 0 ? "ok"
        : issues.some((i) => i.startsWith("price ") || i.startsWith("nights ") || i === "no-url") ? "major"
          : "minor";

    report.push({
      id: r.id,
      slug: r.slug,
      url: r.url,
      dbPrice,
      dbNights: r.durationNights,
      metaPrice: facts.price,
      metaNights: facts.nights,
      metaText: facts.metaText ? facts.metaText.slice(0, 200) : null,
      issues,
      severity,
    });

    if (severity === "ok") ok++;
    else if (severity === "minor") minor++;
    else major++;

    await new Promise((r) => setTimeout(r, 300));
  }

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(report, null, 2));
  console.log(`\nReport: ${OUT}`);
  console.log(`Summary: total=${rows.length}  ok=${ok}  minor=${minor}  major=${major}  unreadable=${unreadable}\n`);

  console.log("Major mismatches (DB will be corrected with --fix):\n");
  for (const r of report.filter((r) => r.severity === "major")) {
    console.log(`[${r.id}] ${r.slug}`);
    console.log(`  URL: ${r.url}`);
    console.log(`  Issues: ${r.issues.join(", ")}`);
    if (r.metaText) console.log(`  Meta: ${r.metaText.slice(0, 180)}`);
    console.log();
  }

  if (FIX) {
    // Skip /resorts/ URLs — those meta descs contain nightly rates, not
    // package prices, so "meta price" is apples-to-oranges.
    const toFix = report.filter((r) =>
      r.severity === "major" && r.metaText && !r.url.includes("/resorts/"),
    );
    console.log(`\n--fix: correcting ${toFix.length} deals from meta data...`);
    for (const r of toFix) {
      const updates: Partial<{ price: string; durationNights: number; durationDays: number; slug: string; updatedAt: Date }> = { updatedAt: new Date() };
      if (r.metaPrice != null && Math.abs(r.metaPrice - r.dbPrice) > 1) updates.price = String(r.metaPrice);
      if (r.metaNights != null && r.metaNights !== r.dbNights) {
        updates.durationNights = r.metaNights;
        updates.durationDays = r.metaNights + 1;
      }
      if (Object.keys(updates).length === 1) continue; // only updatedAt
      // Recompute slug from corrected values
      const newPrice = updates.price ? Math.trunc(Number(updates.price)) : Math.trunc(r.dbPrice);
      const newNights = updates.durationNights ?? r.dbNights ?? 3;
      const base = r.slug.replace(/-\d+-night-\d+$/, `-${newNights}-night-${newPrice}`);
      if (base !== r.slug) updates.slug = base;
      // Collision handling
      if (updates.slug) {
        let candidate = updates.slug;
        let suffix = 1;
        while (true) {
          const exists = await db.select({ id: deals.id }).from(deals).where(eq(deals.slug, candidate)).limit(1);
          if (exists.length === 0 || exists[0].id === r.id) { updates.slug = candidate; break; }
          suffix++;
          candidate = `${base}-v${suffix}`;
          if (suffix > 20) break;
        }
      }
      await db.update(deals).set(updates).where(eq(deals.id, r.id));
      console.log(`  [${r.id}] updated: ${Object.keys(updates).filter((k) => k !== "updatedAt").join(", ")}`);
    }
  }
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });

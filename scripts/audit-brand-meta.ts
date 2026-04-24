/**
 * Brand-agnostic DOM accuracy audit.
 *
 * Fetches every active deal URL for a given brand, extracts price + nights
 * from <meta description> / <meta og:description>, compares to our DB row.
 *
 * Parse patterns (work across most brands we scrape):
 *   Price:  "from $XXX", "for $XXX", "for just $XXX", "only $XXX",
 *           "starting at $XXX", "$XXX per package"
 *   Nights: "X-day/Y-night", "X days Y nights", "X-night", "X-day"
 *           (day count → nights = days - 1 by convention)
 *
 * Run:
 *   npx tsx scripts/audit-brand-meta.ts --brand=mrg
 *   npx tsx scripts/audit-brand-meta.ts --brand=mrg --fix
 */

import { db, deals, brands } from "@vacationdeals/db";
import { eq, and } from "drizzle-orm";
import fs from "node:fs";
import path from "node:path";

const brandArg = process.argv.find((a) => a.startsWith("--brand="));
const BRAND = brandArg ? brandArg.split("=")[1] : "";
const FIX = process.argv.includes("--fix");

if (!BRAND) {
  console.error("Pass --brand=<slug>");
  process.exit(1);
}

interface DealRow {
  id: number;
  slug: string;
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
  const patterns = [
    /<meta\s+property=["']og:description["']\s+content=["']([^"']+)["']/i,
    /<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i,
  ];
  for (const p of patterns) {
    const m = html.match(p);
    if (m) return m[1]
      .replace(/&amp;/g, "&")
      .replace(/&#039;/g, "'")
      .replace(/&quot;/g, '"')
      .replace(/&#8209;/g, "-")
      .replace(/‑/g, "-"); // non-breaking hyphen
  }
  return null;
}

function priceFromMeta(text: string): number | null {
  const patterns = [
    /(?:from|for(?:\s+just)?|only|starting\s+at)\s+\$\s*([\d,]+(?:\.\d{2})?)/i,
    /\$\s*([\d,]+(?:\.\d{2})?)\s*(?:per\s+package|package)/i,
    /\$\s*([\d,]+(?:\.\d{2})?)[!\s]/,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) {
      const n = parseFloat(m[1].replace(/,/g, ""));
      if (Number.isFinite(n) && n >= 29 && n <= 5000) return n;
    }
  }
  return null;
}

function nightsFromMeta(text: string): { nights: number; days: number } | null {
  // Normalize unusual hyphens/separators
  const t = text.replace(/[‐‑‒–—]/g, "-");
  const p1 = t.match(/(\d+)[-\s]?day[-\s,\/]+\s*(\d+)[-\s]?night/i);
  if (p1) {
    const days = parseInt(p1[1], 10);
    const nights = parseInt(p1[2], 10);
    if (days >= 2 && days <= 10 && nights >= 1 && nights <= 9) return { days, nights };
  }
  const p2 = t.match(/(\d+)[-\s]?night[-\s,\/]+\s*(\d+)[-\s]?day/i);
  if (p2) {
    const nights = parseInt(p2[1], 10);
    const days = parseInt(p2[2], 10);
    if (days >= 2 && days <= 10 && nights >= 1 && nights <= 9) return { days, nights };
  }
  const p3 = t.match(/(\d+)[-\s]?nights?/i);
  if (p3) {
    const n = parseInt(p3[1], 10);
    if (n >= 1 && n <= 9) return { nights: n, days: n + 1 };
  }
  const p4 = t.match(/(\d+)[-\s]?days?/i);
  if (p4) {
    const d = parseInt(p4[1], 10);
    if (d >= 2 && d <= 10) return { days: d, nights: d - 1 };
  }
  return null;
}

async function fetchMeta(url: string): Promise<MetaFacts> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0) Chrome/120" },
      redirect: "follow",
    });
    if (!res.ok) return { price: null, nights: null, days: null, metaText: null, status: res.status };
    const html = await res.text();
    const meta = extractMeta(html);
    if (!meta) return { price: null, nights: null, days: null, metaText: null, status: 200 };
    const parsedNights = nightsFromMeta(meta);
    return {
      price: priceFromMeta(meta),
      nights: parsedNights?.nights ?? null,
      days: parsedNights?.days ?? null,
      metaText: meta,
      status: 200,
    };
  } catch (e) {
    return { price: null, nights: null, days: null, metaText: null, status: 0 };
  }
}

async function main() {
  const brand = await db.select({ id: brands.id, name: brands.name })
    .from(brands).where(eq(brands.slug, BRAND)).limit(1);
  if (brand.length === 0) { console.error(`Brand not found: ${BRAND}`); process.exit(1); }

  const rows = (await db.select({
    id: deals.id,
    slug: deals.slug,
    price: deals.price,
    durationNights: deals.durationNights,
    durationDays: deals.durationDays,
    url: deals.url,
  }).from(deals).where(and(eq(deals.brandId, brand[0].id), eq(deals.isActive, true)))) as DealRow[];

  console.log(`\n=== ${brand[0].name} (${BRAND}) ===`);
  console.log(`Active deals: ${rows.length}\n`);

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
    if (facts.status !== 200) { issues.push(`fetch-${facts.status || "err"}`); unreadable++; }
    else if (!facts.metaText) { issues.push("no-meta"); unreadable++; }
    else {
      if (facts.price != null && Math.abs(facts.price - dbPrice) > 1) issues.push(`price db=${dbPrice} meta=${facts.price}`);
      if (facts.nights != null && r.durationNights != null && facts.nights !== r.durationNights) issues.push(`nights db=${r.durationNights} meta=${facts.nights}`);
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

  const OUT = path.join(process.cwd(), "reports", `${BRAND}-meta-audit-${new Date().toISOString().split("T")[0]}.json`);
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(report, null, 2));

  console.log(`Report: ${OUT}`);
  console.log(`Summary: total=${rows.length}  ok=${ok}  minor=${minor}  major=${major}  unreadable=${unreadable}\n`);

  console.log("Major mismatches:");
  for (const r of report.filter((r) => r.severity === "major")) {
    console.log(`[${r.id}] ${r.slug}`);
    console.log(`  URL: ${r.url}`);
    console.log(`  Issues: ${r.issues.join(", ")}`);
    if (r.metaText) console.log(`  Meta: ${r.metaText.slice(0, 180)}`);
    console.log();
  }

  if (FIX) {
    const toFix = report.filter((r) => r.severity === "major" && r.metaText && !r.url.includes("/resorts/"));
    console.log(`\n--fix: correcting ${toFix.length} deals...`);
    for (const r of toFix) {
      const updates: Record<string, unknown> = { updatedAt: new Date() };
      if (r.metaPrice != null && Math.abs(r.metaPrice - r.dbPrice) > 1) updates.price = String(r.metaPrice);
      if (r.metaNights != null && r.metaNights !== r.dbNights) {
        updates.durationNights = r.metaNights;
        updates.durationDays = r.metaNights + 1;
      }
      if (Object.keys(updates).length === 1) continue;
      const newPrice = updates.price ? Math.trunc(Number(updates.price)) : Math.trunc(r.dbPrice);
      const newNights = (updates.durationNights as number | undefined) ?? r.dbNights ?? 3;
      const base = r.slug.replace(/-\d+-night-\d+(?:-v\d+)?$/, `-${newNights}-night-${newPrice}`);
      if (base !== r.slug) {
        let candidate = base;
        let suffix = 1;
        while (true) {
          const exists = await db.select({ id: deals.id }).from(deals).where(eq(deals.slug, candidate)).limit(1);
          if (exists.length === 0 || exists[0].id === r.id) { updates.slug = candidate; break; }
          suffix++;
          candidate = `${base}-v${suffix}`;
          if (suffix > 20) break;
        }
      }
      await db.update(deals).set(updates as any).where(eq(deals.id, r.id));
      console.log(`  [${r.id}] updated: ${Object.keys(updates).filter((k) => k !== "updatedAt").join(", ")}`);
    }
  }
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });

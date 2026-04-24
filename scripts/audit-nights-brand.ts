/**
 * Brand-agnostic nights audit.
 *
 * For every active deal under a given brand, try to extract the night count
 * from the deal's destination URL. Compare to our DB value and flag
 * confirmed mismatches.
 *
 * URL patterns we trust (in order):
 *   "4-days-3-nights"  |  "3-day-2-night"  |  "5day4night"
 *   "3-nights-4-days"
 *   "-4-3/"  or  "-3-2/"  trailing (resort X-Y convention)
 *
 * Only reports when both numbers are extracted — no fuzzy day-only guesses
 * since "3-day" on the URL can mean either 2 nights (day-count convention)
 * or 3 nights (the page copy sometimes differs).
 *
 * Run:
 *   npx tsx scripts/audit-nights-brand.ts --brand=bookvip
 *   npx tsx scripts/audit-nights-brand.ts --brand=hgv --fix
 */

import { db, deals, brands } from "@vacationdeals/db";
import { eq, and } from "drizzle-orm";

const brandArg = process.argv.find((a) => a.startsWith("--brand="));
const BRAND = brandArg ? brandArg.split("=")[1] : "";
const FIX = process.argv.includes("--fix");

if (!BRAND) {
  console.error("Pass --brand=<slug>");
  process.exit(1);
}

function parseDaysNightsFromUrl(url: string): { days: number; nights: number } | null {
  const lower = url.toLowerCase();
  // "4-days-3-nights" or "3-day-2-night"
  const m1 = lower.match(/(\d+)[-\s]?days?[-\s]+(\d+)[-\s]?nights?/);
  if (m1) {
    const days = parseInt(m1[1], 10);
    const nights = parseInt(m1[2], 10);
    if (days >= 2 && days <= 10 && nights >= 1 && nights <= 9) return { days, nights };
  }
  // "3-nights-4-days" reversed
  const m2 = lower.match(/(\d+)[-\s]?nights?[-\s]+(\d+)[-\s]?days?/);
  if (m2) {
    const nights = parseInt(m2[1], 10);
    const days = parseInt(m2[2], 10);
    if (days >= 2 && days <= 10 && nights >= 1 && nights <= 9) return { days, nights };
  }
  // "3days2nights" (no separator)
  const m3 = lower.match(/(\d+)days?(\d+)nights?/);
  if (m3) {
    const days = parseInt(m3[1], 10);
    const nights = parseInt(m3[2], 10);
    if (days >= 2 && days <= 10 && nights >= 1 && nights <= 9) return { days, nights };
  }
  // Trailing "-4-3/" convention (days-nights)
  const m4 = lower.match(/-(\d)-(\d)(?:\/|$)/);
  if (m4) {
    const a = parseInt(m4[1], 10);
    const b = parseInt(m4[2], 10);
    if (a - b === 1 && a >= 3 && a <= 9) return { days: a, nights: b };
  }
  return null;
}

async function main() {
  const brand = await db.select({ id: brands.id, name: brands.name })
    .from(brands).where(eq(brands.slug, BRAND)).limit(1);
  if (brand.length === 0) {
    console.error(`Brand not found: ${BRAND}`);
    process.exit(1);
  }

  const rows = await db.select({
    id: deals.id,
    slug: deals.slug,
    price: deals.price,
    durationNights: deals.durationNights,
    durationDays: deals.durationDays,
    url: deals.url,
  }).from(deals).where(and(eq(deals.brandId, brand[0].id), eq(deals.isActive, true)));

  console.log(`\n=== ${brand[0].name} (${BRAND}) ===`);
  console.log(`Active deals: ${rows.length}`);

  let confirmed = 0, unparseable = 0, mismatch = 0;
  const fixes: Array<{
    id: number;
    slug: string;
    url: string;
    dbNights: number | null;
    urlNights: number;
    dbDays: number | null;
    urlDays: number;
  }> = [];

  for (const r of rows) {
    if (!r.url) { unparseable++; continue; }
    const parsed = parseDaysNightsFromUrl(r.url);
    if (!parsed) { unparseable++; continue; }
    if (parsed.nights === r.durationNights) {
      confirmed++;
    } else {
      mismatch++;
      fixes.push({
        id: r.id,
        slug: r.slug,
        url: r.url,
        dbNights: r.durationNights,
        urlNights: parsed.nights,
        dbDays: r.durationDays,
        urlDays: parsed.days,
      });
    }
  }

  console.log(`  URL-nights confirmed: ${confirmed}`);
  console.log(`  URL pattern unknown:  ${unparseable}`);
  console.log(`  URL-nights MISMATCH:  ${mismatch}`);

  if (fixes.length > 0) {
    console.log("\nMismatches:");
    for (const f of fixes) {
      console.log(`  [${f.id}] ${f.slug}`);
      console.log(`    URL: ${f.url}`);
      console.log(`    DB: ${f.dbNights}n/${f.dbDays}d  →  URL: ${f.urlNights}n/${f.urlDays}d`);
    }
  }

  if (FIX && fixes.length > 0) {
    console.log(`\n--fix: updating ${fixes.length} deals...`);
    for (const f of fixes) {
      const newSlug = f.slug.replace(/-\d+-night-/, `-${f.urlNights}-night-`);
      await db.update(deals).set({
        durationNights: f.urlNights,
        durationDays: f.urlDays,
        slug: newSlug,
        updatedAt: new Date(),
      }).where(eq(deals.id, f.id));
      console.log(`  [${f.id}] ${f.slug} → ${newSlug}`);
    }
  }

  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });

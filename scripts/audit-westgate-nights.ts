/**
 * Westgate night-count audit (v2).
 *
 * Relies on Westgate's own URL slugs which encode the deal duration, e.g.
 *   /specials/4-days-3-nights-4-disney-tickets/     → 4 days, 3 nights
 *   /specials/westgate-las-vegas-resort-and-casino-4-3/  → 4 days, 3 nights (X-Y suffix)
 *   /specials/3-day-stay-plus-4-seaworld-orlando-tickets/ → 3 days (typically = 2 nights)
 *   /specials/3days-2nights-branson-plus-silver-dollar-city-tickets/ → 3 days, 2 nights
 *
 * When we can cleanly parse days+nights from the URL and they conflict with
 * our DB's duration_nights, that's a real bug (no fuzzy parsing).
 *
 * Run: npx tsx scripts/audit-westgate-nights.ts
 *      npx tsx scripts/audit-westgate-nights.ts --fix  (updates DB)
 */

import { db, deals, brands } from "@vacationdeals/db";
import { eq, and } from "drizzle-orm";

const FIX = process.argv.includes("--fix");

interface DealRow {
  id: number;
  slug: string;
  title: string;
  price: string;
  durationNights: number | null;
  durationDays: number | null;
  url: string | null;
}

// Parse days + nights from a Westgate URL path. Returns null if we can't
// confidently extract both. We deliberately require BOTH to avoid false
// positives on URLs like "/specials/cocoa-beach-4-3/" which might be
// something else.
function parseDaysNightsFromUrl(url: string): { days: number; nights: number } | null {
  const lower = url.toLowerCase();
  // Pattern 1: "4-days-3-nights" or "3-day-2-night"
  const m1 = lower.match(/(\d+)[-\s]?days?[-\s]+(\d+)[-\s]?nights?/);
  if (m1) {
    const days = parseInt(m1[1], 10);
    const nights = parseInt(m1[2], 10);
    if (days >= 2 && days <= 8 && nights >= 1 && nights <= 7) return { days, nights };
  }
  // Pattern 2: "3-nights-4-days" (reversed order)
  const m2 = lower.match(/(\d+)[-\s]?nights?[-\s]+(\d+)[-\s]?days?/);
  if (m2) {
    const nights = parseInt(m2[1], 10);
    const days = parseInt(m2[2], 10);
    if (days >= 2 && days <= 8 && nights >= 1 && nights <= 7) return { days, nights };
  }
  // Pattern 3: "3days2nights" (no separator)
  const m3 = lower.match(/(\d+)days?(\d+)nights?/);
  if (m3) {
    const days = parseInt(m3[1], 10);
    const nights = parseInt(m3[2], 10);
    if (days >= 2 && days <= 8 && nights >= 1 && nights <= 7) return { days, nights };
  }
  // Pattern 4: Trailing "-4-3/" or "-3-2/" (resort URL convention)
  const m4 = lower.match(/-(\d)-(\d)(?:\/|$)/);
  if (m4) {
    const a = parseInt(m4[1], 10);
    const b = parseInt(m4[2], 10);
    // Assume larger = days, smaller = nights, and they're adjacent (e.g. 4-3, 3-2)
    if (a - b === 1 && a >= 3 && a <= 7) return { days: a, nights: b };
  }
  // Pattern 5: Just "3-day" or "4-day" with no nights — infer nights = days - 1
  const m5 = lower.match(/(\d+)[-\s]?day/);
  if (m5 && !lower.includes("night")) {
    const days = parseInt(m5[1], 10);
    if (days >= 2 && days <= 8) return { days, nights: days - 1 };
  }
  return null;
}

async function main() {
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

  let confirmed = 0, unparseable = 0, mismatch = 0;
  const fixes: Array<{ id: number; slug: string; url: string; dbNights: number | null; urlNights: number; dbDays: number | null; urlDays: number }> = [];

  for (const r of rows as DealRow[]) {
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

  console.log(`\nTotal Westgate deals: ${rows.length}`);
  console.log(`  URL-nights confirmed:  ${confirmed}`);
  console.log(`  URL pattern unknown:   ${unparseable}`);
  console.log(`  URL-nights MISMATCH:   ${mismatch}\n`);

  if (fixes.length > 0) {
    console.log("Mismatches (DB will be updated with --fix):\n");
    for (const f of fixes) {
      console.log(`[${f.id}] ${f.slug}`);
      console.log(`  URL: ${f.url}`);
      console.log(`  DB: ${f.dbNights}n/${f.dbDays}d  →  URL says: ${f.urlNights}n/${f.urlDays}d\n`);
    }
  }

  if (FIX && fixes.length > 0) {
    console.log(`Applying ${fixes.length} fixes...`);
    for (const f of fixes) {
      // Rebuild slug with correct nights
      const newSlug = f.slug.replace(/-\d+-night-/, `-${f.urlNights}-night-`);
      await db.update(deals).set({
        durationNights: f.urlNights,
        durationDays: f.urlDays,
        slug: newSlug,
        updatedAt: new Date(),
      }).where(eq(deals.id, f.id));
      console.log(`  [${f.id}] ${f.slug} → ${newSlug}`);
    }
    console.log("Done.");
  }

  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });

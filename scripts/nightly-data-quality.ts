/**
 * Nightly data-quality sweep — runs autonomously on the VPS.
 *
 * Defense-in-depth against the scraper bugs we've already fixed in code.
 * Each scraper change should prevent the bug from reappearing, but if a
 * regression slips in (or a new scraper has the same kind of issue),
 * this script catches it within 24 hours.
 *
 * Sweeps:
 *   1. Duplicate-URL deactivation (http/https, trailing slash variants)
 *   2. Spanish /es/ URL detection (defense vs scraper regression)
 *   3. Category-page URL detection (cheap-, budget-, *-packages, *-trips)
 *   4. Past-season URL detection (memorial-day, easter, labor-day...)
 *   5. Slug-price drift (slug embeds outdated price after scraper update)
 *   6. Login/auth URL detection (deal URL accidentally points to /sign_in)
 *
 * Findings are logged AND auto-fixed for safe categories. Anything
 * ambiguous goes to the log only for human review.
 *
 * Run:  npx tsx scripts/nightly-data-quality.ts          (report only)
 *       npx tsx scripts/nightly-data-quality.ts --fix    (auto-deactivate)
 *
 * Cron:  0 6 * * * cd /var/www/vacationdeals && set -a && source .env && set +a && cd apps/scraper && /usr/bin/npx tsx ../../scripts/nightly-data-quality.ts --fix >> /var/log/vacdeals-data-quality.log 2>&1
 */

import { db, deals } from "@vacationdeals/db";
import { sql } from "drizzle-orm";

const FIX = process.argv.includes("--fix");
const startedAt = new Date().toISOString();
console.log(`\n=== Nightly data-quality sweep — ${startedAt} ===\n`);

interface CountAndIds {
  count: number;
  ids: number[];
}

async function selectIds(query: ReturnType<typeof sql>): Promise<CountAndIds> {
  const result = (await db.execute(query)) as unknown as { rows?: { id: number }[] } | { id: number }[];
  const rows = (Array.isArray(result) ? result : result.rows ?? []) as { id: number }[];
  return { count: rows.length, ids: rows.map((r) => r.id) };
}

async function deactivate(ids: number[], reason: string): Promise<void> {
  if (!FIX || ids.length === 0) return;
  const chunkSize = 500;
  for (let i = 0; i < ids.length; i += chunkSize) {
    const chunk = ids.slice(i, i + chunkSize);
    await db.execute(sql`
      UPDATE deals SET is_active = false, updated_at = NOW()
      WHERE id IN (${sql.join(chunk.map((id) => sql`${id}`), sql`, `)})
    `);
  }
  console.log(`  → deactivated ${ids.length} (${reason})`);
}

async function main() {
  let totalFlagged = 0;
  let totalFixed = 0;

  // ── 1. http/https duplicates ─────────────────────────────────────────────
  const httpDups = await selectIds(sql`
    SELECT d1.id FROM deals d1
    WHERE d1.is_active AND d1.url LIKE 'http://%'
      AND EXISTS (
        SELECT 1 FROM deals d2
        WHERE d2.is_active
          AND d2.url = 'https' || substring(d1.url FROM 5)
          AND d2.id <> d1.id
      )
  `);
  console.log(`http/https duplicates: ${httpDups.count}`);
  if (httpDups.count > 0) {
    await deactivate(httpDups.ids, "http/https duplicate (kept https)");
    totalFlagged += httpDups.count;
    if (FIX) totalFixed += httpDups.count;
  }

  // ── 2. Spanish /es/ URLs (Westgate scraper now skips these in code) ──────
  const esDups = await selectIds(sql`
    SELECT id FROM deals
    WHERE is_active AND url LIKE '%/es/%'
  `);
  console.log(`Spanish /es/ URLs: ${esDups.count}`);
  if (esDups.count > 0) {
    await deactivate(esDups.ids, "Spanish translation duplicate");
    totalFlagged += esDups.count;
    if (FIX) totalFixed += esDups.count;
  }

  // ── 3. Category-page URLs (Westgate APP_DATA includes category landers) ──
  const categoryUrls = await selectIds(sql`
    SELECT id FROM deals
    WHERE is_active AND (
      url ~* '/specials/[^/]*(cheap|budget|last-minute|kid-friendly|family-friendly|honeymoon-packages|military-vacation|holiday-packages|for-couples|for-every-traveler)[^/]*/'
      OR url ~* '/specials/[^/]*-packages-[^/]*/'
      OR url ~* '/specials/[^/]*-packages/?$'
      OR url ~* '/specials/[^/]*-trips/?$'
      OR url ~* '/specials/florida-[^/]+/'
    )
  `);
  console.log(`Category-page URLs: ${categoryUrls.count}`);
  if (categoryUrls.count > 0) {
    await deactivate(categoryUrls.ids, "Category/aggregator URL");
    totalFlagged += categoryUrls.count;
    if (FIX) totalFixed += categoryUrls.count;
  }

  // ── 4. Past-season URLs ──────────────────────────────────────────────────
  const seasonalUrls = await selectIds(sql`
    SELECT id FROM deals
    WHERE is_active
      AND url ~* '(memorial-day|labor-day|veterans-day|easter-vacation|easter-getaway|easter-deal|valentines-day-getaway|halloween-getaway)'
      AND url NOT LIKE '%christmas%'
  `);
  console.log(`Past-season URLs: ${seasonalUrls.count}`);
  if (seasonalUrls.count > 0) {
    await deactivate(seasonalUrls.ids, "Past-season URL");
    totalFlagged += seasonalUrls.count;
    if (FIX) totalFixed += seasonalUrls.count;
  }

  // ── 5. Login / auth URLs accidentally stored as deal URLs ────────────────
  const authUrls = await selectIds(sql`
    SELECT id FROM deals
    WHERE is_active
      AND url ~* '/(users/sign_in|users/login|account/login|signin|register)/?$'
  `);
  console.log(`Auth/login URLs: ${authUrls.count}`);
  if (authUrls.count > 0) {
    await deactivate(authUrls.ids, "Auth/login URL stored as deal");
    totalFlagged += authUrls.count;
    if (FIX) totalFixed += authUrls.count;
  }

  // ── 6. Slug-price drift (report only — fixing is in fix-stale-slug-prices.ts) ──
  const slugDrift = (await db.execute(sql`
    SELECT COUNT(*) AS count FROM deals
    WHERE is_active
      AND slug ~ '-[0-9]+-night-[0-9]+(-v[0-9]+)?$'
      AND substring(slug FROM '-([0-9]+)(?:-v[0-9]+)?$') <> trunc(price)::text
  `)) as unknown as { rows?: { count: string | number }[] } | { count: string | number }[];
  const slugDriftRows = (Array.isArray(slugDrift) ? slugDrift : slugDrift.rows ?? []) as { count: string | number }[];
  const driftCount = Number(slugDriftRows[0]?.count ?? 0);
  console.log(`Slug-price drift: ${driftCount} (run scripts/fix-stale-slug-prices.ts --apply to fix)`);
  totalFlagged += driftCount;

  // ── 7. Active deals with NULL or empty title (should never happen) ───────
  const nullTitles = await selectIds(sql`
    SELECT id FROM deals WHERE is_active AND (title IS NULL OR title = '')
  `);
  console.log(`Null/empty titles: ${nullTitles.count}`);
  if (nullTitles.count > 0) {
    await deactivate(nullTitles.ids, "Null or empty title");
    totalFlagged += nullTitles.count;
    if (FIX) totalFixed += nullTitles.count;
  }

  // ── 8. Placeholder titles ("Resort Information", "special offer", "Author - Unknown") ──
  // Surfaced by the 2026-05-06 visual QA pass — Marriott pages were
  // emitting "special offer - X Vacation Package" because the scraper's
  // h1/h2 selector was grabbing a generic banner. Different scraper
  // bugs produce these; defense-in-depth catches whatever slipped through.
  const placeholderTitles = await selectIds(sql`
    SELECT id FROM deals
    WHERE is_active AND (
      LOWER(title) LIKE 'resort information%'
      OR LOWER(title) LIKE 'special offer%'
      OR LOWER(title) LIKE 'author -%'
      OR LOWER(title) LIKE 'author:%'
      OR LOWER(title) LIKE 'vacation package%'
      OR LOWER(title) LIKE 'promotion%'
      OR LENGTH(title) < 5
    )
  `);
  console.log(`Placeholder titles: ${placeholderTitles.count}`);
  if (placeholderTitles.count > 0) {
    await deactivate(placeholderTitles.ids, "Placeholder/garbage title");
    totalFlagged += placeholderTitles.count;
    if (FIX) totalFixed += placeholderTitles.count;
  }

  // ── 9. Trailing-comma cities ("Unknown,", "Various,") ──
  // Sanitize-city in deal-store.ts trims known prefixes but leaves a trailing
  // comma when the source data was "Various, " or "Unknown, FL" with the
  // state stripped. Cosmetic, but visible to users on /westgate, /3-night-packages.
  const badCityRows = (await db.execute(sql`
    SELECT d.id
    FROM deals d
    JOIN destinations dest ON d.destination_id = dest.id
    WHERE d.is_active
      AND (
        dest.city ILIKE 'unknown,%'
        OR dest.city ILIKE 'various,%'
        OR dest.city LIKE '%,'
        OR TRIM(dest.city) = ''
      )
  `)) as unknown as { rows?: { id: number }[] } | { id: number }[];
  const badCityIds = ((Array.isArray(badCityRows) ? badCityRows : badCityRows.rows ?? []) as { id: number }[]).map((r) => r.id);
  console.log(`Deals with bad city strings: ${badCityIds.length}`);
  if (badCityIds.length > 0) {
    // Don't deactivate — fix in place by repointing to "Unknown" / "Various"
    // canonical destinations. We only deactivate when the title is the
    // problem; a bad city string is recoverable.
    if (FIX) {
      await db.execute(sql`
        UPDATE destinations SET city = REGEXP_REPLACE(TRIM(BOTH ',' FROM TRIM(city)), '\\s*,\\s*$', '')
        WHERE city LIKE '%,'
           OR city ILIKE 'unknown,%'
           OR city ILIKE 'various,%'
      `);
      console.log(`  → trailing-comma cities normalized in destinations table`);
    }
    totalFlagged += badCityIds.length;
  }

  // ── Summary ──────────────────────────────────────────────────────────────
  console.log(`\n=== Summary ===`);
  console.log(`Total flagged: ${totalFlagged}`);
  if (FIX) console.log(`Total auto-deactivated: ${totalFixed}`);
  else console.log(`Pass --fix to auto-deactivate (slug drift not auto-fixed here)`);

  // Alert via log if anything was significantly off
  if (totalFlagged > 50) {
    console.log(`\n⚠ ${totalFlagged} flagged this run — investigate scraper regression.`);
  }

  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

/**
 * Fix deals whose slug-embedded price no longer matches the DB price.
 *
 * Example: slug=`hyatt-cabo-san-lucas-3-night-100` but price=899.
 *
 * Regenerates the slug by replacing the trailing `-<stale-price>` with the
 * actual price. If the new slug already exists (collision), appends `-v2`
 * etc. Old slug is NOT preserved as a redirect — historic price-stale URLs
 * naturally 404.
 *
 * Run:
 *   npx tsx scripts/fix-stale-slug-prices.ts            (dry run)
 *   npx tsx scripts/fix-stale-slug-prices.ts --apply
 */

import { db, deals } from "@vacationdeals/db";
import { eq, and, sql } from "drizzle-orm";

const APPLY = process.argv.includes("--apply");

interface Row {
  id: number;
  slug: string;
  price: string;
}

async function main() {
  // Find rows where slug ends with "-<N>" and <N> != floor(price)
  const rows = (await db.execute(sql`
    SELECT id, slug, price::text AS price
    FROM deals
    WHERE is_active = true
      AND slug ~ '-[0-9]+-night-[0-9]+$'
      AND substring(slug FROM '-([0-9]+)$') <> trunc(price)::text
    ORDER BY id
  `)) as unknown as { rows: Row[] } | Row[];
  const data = (Array.isArray(rows) ? rows : rows.rows) as Row[];

  console.log(`Found ${data.length} deals with stale slug prices\n`);

  // For dry-run, use a Set of already-assigned new slugs to detect in-batch
  // collisions. For --apply, re-check DB each loop so we catch any collision
  // caused by this run's own prior updates.
  const assigned = new Set<string>();
  let applied = 0;
  let skipped = 0;

  for (const r of data) {
    const truncPrice = Math.trunc(Number(r.price));
    const base = r.slug.replace(/-\d+$/, `-${truncPrice}`);

    // Collision check: try base, then -v2, -v3...
    let newSlug = base;
    let suffix = 1;
    while (true) {
      if (APPLY) {
        const exists = await db.select({ id: deals.id }).from(deals).where(eq(deals.slug, newSlug)).limit(1);
        if (exists.length === 0 || exists[0].id === r.id) break;
      } else {
        if (!assigned.has(newSlug)) break;
      }
      suffix++;
      newSlug = `${base}-v${suffix}`;
      if (suffix > 20) { newSlug = `${base}-v${r.id}`; break; }
    }

    console.log(`  [${r.id}] ${r.slug}  →  ${newSlug}`);

    if (APPLY) {
      try {
        await db.update(deals).set({ slug: newSlug, updatedAt: new Date() }).where(eq(deals.id, r.id));
        applied++;
      } catch (e) {
        console.log(`    SKIP (${(e as Error).message.split("\n")[0]})`);
        skipped++;
      }
    } else {
      assigned.add(newSlug);
    }
  }

  if (APPLY) {
    console.log(`\nDone. Applied=${applied} Skipped=${skipped}`);
  } else {
    console.log(`\nDry run complete. Pass --apply to execute.`);
  }
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });

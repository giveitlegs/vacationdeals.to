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

  const fixes: Array<{ id: number; oldSlug: string; newSlug: string }> = [];

  // Check for collisions in DB before applying
  for (const r of data) {
    const truncPrice = Math.trunc(Number(r.price));
    let newSlug = r.slug.replace(/-\d+$/, `-${truncPrice}`);

    // Collision check
    let suffix = 0;
    while (true) {
      const candidate = suffix === 0 ? newSlug : `${newSlug}-v${suffix + 1}`;
      const exists = await db.select({ id: deals.id }).from(deals).where(eq(deals.slug, candidate)).limit(1);
      if (exists.length === 0 || exists[0].id === r.id) {
        newSlug = candidate;
        break;
      }
      suffix++;
      if (suffix > 5) { newSlug = `${newSlug}-v${r.id}`; break; } // bail
    }

    fixes.push({ id: r.id, oldSlug: r.slug, newSlug });
    console.log(`  [${r.id}] ${r.slug}  →  ${newSlug}`);
  }

  if (APPLY && fixes.length > 0) {
    console.log(`\n--apply: updating ${fixes.length} slugs...`);
    for (const f of fixes) {
      await db.update(deals).set({ slug: f.newSlug, updatedAt: new Date() }).where(eq(deals.id, f.id));
    }
    console.log(`Applied ${fixes.length} updates.`);
  } else {
    console.log(`\nDry run complete. Pass --apply to execute.`);
  }
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });

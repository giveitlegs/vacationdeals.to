/**
 * Deactivate deals with implausible prices (< $39 or > $9999).
 *
 * Catches rows produced by the comma-truncated regex bug
 * (e.g. "$1,408" → captured "1") that landed in the DB before
 * the fix in apps/scraper/src/crawlers/*.ts shipped.
 *
 * Run on the VPS:
 *   set -a && source .env && set +a \
 *     && npx tsx scripts/cleanup-implausible-prices.ts
 *
 * Add --dry-run to preview without touching the DB.
 */

import { db, deals } from "@vacationdeals/db";
import { and, eq, lt, or, gt } from "drizzle-orm";

const DRY_RUN = process.argv.includes("--dry-run");
const PRICE_FLOOR = 39;
const PRICE_CEILING = 9999;

async function main() {
  const bad = await db
    .select({
      id: deals.id,
      slug: deals.slug,
      title: deals.title,
      price: deals.price,
      url: deals.url,
      isActive: deals.isActive,
    })
    .from(deals)
    .where(
      and(
        eq(deals.isActive, true),
        or(lt(deals.price, PRICE_FLOOR.toString() as unknown as string), gt(deals.price, PRICE_CEILING.toString() as unknown as string)),
      ),
    );

  console.log(`Found ${bad.length} active deals with implausible price (< $${PRICE_FLOOR} or > $${PRICE_CEILING})`);
  for (const d of bad.slice(0, 50)) {
    console.log(`  $${d.price}  ${d.slug}  ←  ${d.url}`);
  }
  if (bad.length > 50) console.log(`  …and ${bad.length - 50} more`);

  if (DRY_RUN) {
    console.log("\nDry run — no DB writes. Re-run without --dry-run to deactivate these.");
    return;
  }

  if (bad.length === 0) {
    console.log("Nothing to clean up.");
    return;
  }

  let deactivated = 0;
  for (const d of bad) {
    await db.update(deals).set({ isActive: false }).where(eq(deals.id, d.id));
    deactivated++;
  }
  console.log(`\nDeactivated ${deactivated} deals.`);
  console.log("They remain in the DB for forensic purposes; isActive=false hides them from the public site.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

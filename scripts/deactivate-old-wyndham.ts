/**
 * Deactivate old per-destination Wyndham rows.
 *
 * The scraper rewrite (2026-05-07) switched from
 *   .../vacation-getaways/{slug}
 * to
 *   .../vacation-getaways#{anchor}
 * because Wyndham's per-destination URLs now 301 to the corporate
 * home and the hub is the only canonical source. Re-scraping created
 * new rows under the new URLs; the old rows still exist and need to
 * go inactive — they have stale (and often wrong) prices.
 *
 * Run on VPS:
 *   cd /var/www/vacationdeals && set -a && source .env && set +a
 *   cd apps/scraper && npx tsx ../../scripts/deactivate-old-wyndham.ts
 */

import { db } from "@vacationdeals/db";
import { sql } from "drizzle-orm";

async function main() {
  const r = (await db.execute(sql`
    UPDATE deals
    SET is_active = false, updated_at = NOW()
    WHERE is_active = true
      AND source_id = (SELECT id FROM sources WHERE scraper_key = 'wyndham')
      AND url LIKE 'https://clubwyndham.wyndhamdestinations.com/vacationpreview/vacation-getaways/%'
  `)) as unknown as { rowCount?: number };
  console.log(`Deactivated ${r.rowCount ?? "?"} old per-destination Wyndham rows.`);

  // Show remaining active wyndham rows
  const remaining = (await db.execute(sql`
    SELECT id, title, price::float AS price, duration_nights AS nights, url
    FROM deals
    WHERE is_active = true
      AND source_id = (SELECT id FROM sources WHERE scraper_key = 'wyndham')
    ORDER BY id
  `)) as unknown as { rows?: Array<{ id: number; title: string; price: number; nights: number; url: string }> };
  const rows = remaining.rows ?? [];
  console.log(`\nActive wyndham rows after cleanup (${rows.length}):`);
  for (const x of rows) console.log(`  #${x.id} $${x.price} ${x.nights}n  ${x.title}`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

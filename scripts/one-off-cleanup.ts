/**
 * One-off cleanup for residual audit findings:
 *   - Deactivate legacy StayPromo /accommodation/ URLs (current scraper
 *     uses /vacation-packages/cheap-deals/hotels/ paths; the older
 *     accommodation-style rows are dead and won't be re-touched).
 *   - Deactivate the Westgate "branson-vacation-2-show-tickets" 404 row.
 *
 * Run on VPS:
 *   cd /var/www/vacationdeals && set -a && source .env && set +a
 *   cd apps/scraper && npx tsx ../../scripts/one-off-cleanup.ts
 */

import { db } from "@vacationdeals/db";
import { sql } from "drizzle-orm";

async function main() {
  const a = (await db.execute(sql`
    UPDATE deals
    SET is_active = false, updated_at = NOW()
    WHERE is_active = true
      AND url LIKE '%/accommodation/%'
      AND source_id = (SELECT id FROM sources WHERE scraper_key = 'staypromo')
  `)) as unknown as { rowCount?: number };
  console.log(`Legacy staypromo /accommodation/ rows deactivated: ${a.rowCount ?? "?"}`);

  const b = (await db.execute(sql`
    UPDATE deals
    SET is_active = false, updated_at = NOW()
    WHERE is_active = true
      AND url LIKE '%branson-vacation-2-show-tickets-3-day-3-night%'
  `)) as unknown as { rowCount?: number };
  console.log(`Westgate 404 (branson-2-show-tickets) deactivated: ${b.rowCount ?? "?"}`);

  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

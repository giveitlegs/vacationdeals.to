/**
 * Deactivate Westgate deals where APP_DATA's price drifted from the live
 * page and the title doesn't carry a "Starting at $X" pattern that the
 * DOM-correction can use to fix it. Better to hide them than show wrong
 * prices to users; they'll re-activate the next time Westgate's APP_DATA
 * is updated to match the live page (or we add Playwright-based scraping).
 *
 * Run on VPS:
 *   cd /var/www/vacationdeals && set -a && source .env && set +a
 *   cd apps/scraper && npx tsx ../../scripts/deactivate-westgate-residual.ts
 */

import { db } from "@vacationdeals/db";
import { sql } from "drizzle-orm";
import fs from "node:fs";
import path from "node:path";

async function main() {
  const fileCandidates = [
    path.join(process.cwd(), "reports", "westgate-residual-ids.json"),
    path.join(process.cwd(), "..", "..", "reports", "westgate-residual-ids.json"),
  ];
  const file = fileCandidates.find((p) => fs.existsSync(p));
  if (!file) {
    console.error("westgate-residual-ids.json not found.");
    process.exit(1);
  }
  const ids: number[] = JSON.parse(fs.readFileSync(file, "utf8"));
  if (ids.length === 0) {
    console.log("No ids to deactivate.");
    process.exit(0);
  }
  console.log(`Deactivating ${ids.length} Westgate deals (APP_DATA price drift, no headline correction signal)…`);
  const r = (await db.execute(sql`
    UPDATE deals SET is_active = false, updated_at = NOW()
    WHERE is_active = true
      AND id IN (${sql.join(ids.map((id) => sql`${id}`), sql`, `)})
  `)) as unknown as { rowCount?: number };
  console.log(`Affected rows: ${r.rowCount ?? "?"}`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

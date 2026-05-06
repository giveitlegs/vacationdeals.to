/**
 * apply-audit-cleanup.ts — deactivate deals identified as bad by the audit.
 *
 * Reads reports/cleanup-deal-ids.json (produced by audit-all-deals.ts post-
 * processing) and marks each listed deal `is_active = false`. The JSON has
 * three groups:
 *   A — URL is the wrong type (resort/destination overview, login wall,
 *       anchor-only duplicate). Won't fix itself by re-scraping; needs
 *       deactivation. Scraper changes prevent recurrence.
 *   B — URL is unreachable (4xx/5xx/timeout). Source page is gone.
 *   C — Price mismatch confirmed against live page. Deactivating gives the
 *       fixed scraper a clean slate; the next crawl re-upserts the row with
 *       the correct price (and re-activates via the existing storeDeal path).
 *
 * Run on VPS:
 *   cd /var/www/vacationdeals && set -a && source .env && set +a
 *   cd apps/scraper && npx tsx ../../scripts/apply-audit-cleanup.ts --dry-run
 *   cd apps/scraper && npx tsx ../../scripts/apply-audit-cleanup.ts --apply
 */

import { db } from "@vacationdeals/db";
import { sql } from "drizzle-orm";
import fs from "node:fs";
import path from "node:path";

const APPLY = process.argv.includes("--apply");
const DRY = process.argv.includes("--dry-run") || !APPLY;

interface Cleanup {
  A: Array<{ id: number; why: string; src?: string }>;
  B: Array<{ id: number; why: string; src?: string }>;
  C: Array<{ id: number; why: string; src?: string; db?: number; page?: number[] }>;
}

async function deactivate(ids: number[], reason: string): Promise<number> {
  if (ids.length === 0) return 0;
  if (DRY) return ids.length;
  const chunkSize = 500;
  let total = 0;
  for (let i = 0; i < ids.length; i += chunkSize) {
    const chunk = ids.slice(i, i + chunkSize);
    const r = (await db.execute(sql`
      UPDATE deals SET is_active = false, updated_at = NOW()
      WHERE id IN (${sql.join(chunk.map((id) => sql`${id}`), sql`, `)})
        AND is_active = true
    `)) as unknown as { rowCount?: number };
    total += r.rowCount ?? chunk.length;
  }
  console.log(`  → ${reason}: deactivated ${total}`);
  return total;
}

async function main() {
  const fileCandidates = [
    path.join(process.cwd(), "reports", "cleanup-deal-ids.json"),
    path.join(process.cwd(), "..", "..", "reports", "cleanup-deal-ids.json"),
  ];
  const file = fileCandidates.find((p) => fs.existsSync(p));
  if (!file) {
    console.error("cleanup-deal-ids.json not found in reports/. Run audit first.");
    process.exit(1);
  }
  const data: Cleanup = JSON.parse(fs.readFileSync(file, "utf8"));
  console.log(`Loaded cleanup list from ${file}`);
  console.log(`  A (wrong URL type / login): ${data.A.length}`);
  console.log(`  B (unreachable):           ${data.B.length}`);
  console.log(`  C (price mismatch):        ${data.C.length}`);
  console.log(DRY ? "DRY RUN — no changes will be made.\n" : "APPLYING — marking is_active=false.\n");

  const groupedA: Record<string, number[]> = {};
  for (const e of data.A) (groupedA[e.why] ||= []).push(e.id);
  for (const why of Object.keys(groupedA)) await deactivate(groupedA[why], `A: ${why}`);

  const groupedB: Record<string, number[]> = {};
  for (const e of data.B) (groupedB[e.src ?? "unknown"] ||= []).push(e.id);
  for (const src of Object.keys(groupedB)) await deactivate(groupedB[src], `B: unreachable (${src})`);

  const groupedC: Record<string, number[]> = {};
  for (const e of data.C) (groupedC[e.src ?? "unknown"] ||= []).push(e.id);
  for (const src of Object.keys(groupedC)) await deactivate(groupedC[src], `C: price mismatch (${src})`);

  if (DRY) {
    console.log("\nDry run complete. Re-run with --apply to actually deactivate.");
  } else {
    const total = data.A.length + data.B.length + data.C.length;
    console.log(`\nDone. Total deactivated (or would-be): ${total}`);
  }
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

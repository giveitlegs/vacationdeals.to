/**
 * Deal Health Check — runs daily via cron
 *
 * 1. Marks deals past their expiresAt date as inactive
 * 2. HEAD-requests all active deal URLs, marks 404s as inactive
 * 3. Logs results
 */

import { db } from "@vacationdeals/db";
import { deals } from "@vacationdeals/db";
import { eq, and, lt, isNotNull } from "drizzle-orm";

const RATE_LIMIT_MS = 500; // 2 requests/second

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function checkUrlHealth(url: string): Promise<number> {
  try {
    const response = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
      signal: AbortSignal.timeout(10000),
    });
    return response.status;
  } catch {
    return -1; // Network error, assume alive
  }
}

async function main() {
  console.log("=== Deal Health Check ===");
  console.log(`Started at ${new Date().toISOString()}`);

  // Step 1: Deactivate deals past their expiresAt date
  const now = new Date();
  const expiredResult = await db
    .update(deals)
    .set({ isActive: false, updatedAt: now })
    .where(
      and(
        eq(deals.isActive, true),
        isNotNull(deals.expiresAt),
        lt(deals.expiresAt, now),
      ),
    )
    .returning({ id: deals.id, title: deals.title });

  console.log(`\nStep 1: ${expiredResult.length} deals expired by date`);
  for (const d of expiredResult) {
    console.log(`  [expired] ${d.title}`);
  }

  // Step 2: Check active deal URLs for 404s
  const activeDeals = await db
    .select({ id: deals.id, title: deals.title, url: deals.url, slug: deals.slug })
    .from(deals)
    .where(eq(deals.isActive, true));

  console.log(`\nStep 2: Checking ${activeDeals.length} active deal URLs...`);

  let deactivated = 0;
  let checked = 0;
  const dead: string[] = [];

  for (const deal of activeDeals) {
    const status = await checkUrlHealth(deal.url);
    checked++;

    if (status === 404 || status === 410 || status === 403) {
      // Mark as inactive
      await db
        .update(deals)
        .set({ isActive: false, updatedAt: now })
        .where(eq(deals.id, deal.id));
      deactivated++;
      dead.push(`${deal.title} (${status})`);
      console.log(`  [dead ${status}] ${deal.title}`);
    }

    if (checked % 50 === 0) {
      console.log(`  ... checked ${checked}/${activeDeals.length}`);
    }

    await sleep(RATE_LIMIT_MS);
  }

  console.log(`\n=== Health Check Complete ===`);
  console.log(`Checked: ${checked} URLs`);
  console.log(`Expired by date: ${expiredResult.length}`);
  console.log(`Dead URLs (404/410/403): ${deactivated}`);
  console.log(`Still active: ${checked - deactivated}`);

  if (dead.length > 0) {
    console.log(`\nDeactivated deals:`);
    dead.forEach((d) => console.log(`  - ${d}`));
  }

  process.exit(0);
}

main().catch((err) => {
  console.error("Health check failed:", err);
  process.exit(1);
});

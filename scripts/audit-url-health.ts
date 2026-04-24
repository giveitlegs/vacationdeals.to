/**
 * Fast URL health check — HEAD every active deal URL and flag any returning
 * 4xx / 5xx. Deactivates confirmed-dead deals with --fix.
 *
 * This catches "deal link goes to 404" without needing to parse pages.
 *
 * Run:  npx tsx scripts/audit-url-health.ts
 *       npx tsx scripts/audit-url-health.ts --fix
 *       npx tsx scripts/audit-url-health.ts --brand=divi
 */

import { db, deals, brands } from "@vacationdeals/db";
import { eq, and, isNotNull } from "drizzle-orm";
import fs from "node:fs";
import path from "node:path";

const FIX = process.argv.includes("--fix");
const brandArg = process.argv.find((a) => a.startsWith("--brand="));
const BRAND_FILTER = brandArg ? brandArg.split("=")[1] : null;
const CONCURRENCY = 10;

interface Row {
  id: number;
  slug: string;
  brandSlug: string;
  url: string;
}

async function headUrl(url: string): Promise<number> {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 12000);
    const res = await fetch(url, {
      method: "GET", // some sites 405 on HEAD
      headers: { "User-Agent": "Mozilla/5.0 (VacationDealsAudit/1.0)" },
      redirect: "follow",
      signal: ctrl.signal,
    });
    clearTimeout(timer);
    return res.status;
  } catch {
    return 0;
  }
}

async function main() {
  const rowsQuery = db
    .select({
      id: deals.id,
      slug: deals.slug,
      brandSlug: brands.slug,
      url: deals.url,
    })
    .from(deals)
    .leftJoin(brands, eq(deals.brandId, brands.id))
    .where(and(eq(deals.isActive, true), isNotNull(deals.url)));

  const rows = (await rowsQuery) as Row[];
  const filtered = BRAND_FILTER ? rows.filter((r) => r.brandSlug === BRAND_FILTER) : rows;
  console.log(`Checking ${filtered.length} active deal URLs${BRAND_FILTER ? ` (brand=${BRAND_FILTER})` : ""}...\n`);

  const byStatus = new Map<number, Row[]>();
  let done = 0;

  const queue = [...filtered];
  await Promise.all(
    Array.from({ length: CONCURRENCY }, async () => {
      while (queue.length > 0) {
        const r = queue.shift();
        if (!r) break;
        const status = await headUrl(r.url);
        if (!byStatus.has(status)) byStatus.set(status, []);
        byStatus.get(status)!.push(r);
        done++;
        if (done % 20 === 0) process.stdout.write(`  ${done}/${filtered.length}\r`);
      }
    }),
  );

  console.log(`Done — ${done} URLs checked.\n`);

  // Report
  const dead: Row[] = [];
  for (const [status, list] of [...byStatus.entries()].sort((a, b) => a[0] - b[0])) {
    if (status >= 400 || status === 0) {
      console.log(`=== status ${status} (${list.length} deals) ===`);
      // Group by brand
      const byBrand = new Map<string, Row[]>();
      for (const r of list) {
        if (!byBrand.has(r.brandSlug)) byBrand.set(r.brandSlug, []);
        byBrand.get(r.brandSlug)!.push(r);
      }
      for (const [brand, rs] of byBrand) {
        console.log(`  ${brand}: ${rs.length}`);
      }
      dead.push(...list);
    } else {
      console.log(`status ${status}: ${list.length} deals OK`);
    }
  }

  const OUT = path.join(process.cwd(), "reports", `url-health-${new Date().toISOString().split("T")[0]}.json`);
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  const report = [...byStatus.entries()].flatMap(([status, list]) =>
    list.map((r) => ({ id: r.id, slug: r.slug, brand: r.brandSlug, url: r.url, status })),
  );
  fs.writeFileSync(OUT, JSON.stringify(report, null, 2));
  console.log(`\nReport: ${OUT}`);
  console.log(`\nDead URLs (4xx/5xx/timeout): ${dead.length}`);

  if (FIX && dead.length > 0) {
    console.log(`\n--fix: deactivating ${dead.length} deals with dead URLs...`);
    const ids = dead.map((d) => d.id);
    // Chunked updates
    const chunkSize = 100;
    for (let i = 0; i < ids.length; i += chunkSize) {
      const chunk = ids.slice(i, i + chunkSize);
      for (const id of chunk) {
        await db.update(deals).set({ isActive: false, updatedAt: new Date() }).where(eq(deals.id, id));
      }
      console.log(`  Deactivated ${Math.min(i + chunkSize, ids.length)}/${ids.length}`);
    }
  }

  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });

import { db } from "@vacationdeals/db";
import { sql } from "drizzle-orm";

async function main() {
  const r = (await db.execute(sql`
    SELECT s.scraper_key, b.slug AS brand_slug, d.id, d.title, d.is_active
    FROM deals d
    JOIN sources s ON d.source_id = s.id
    JOIN brands b ON d.brand_id = b.id
    WHERE b.slug IN ('wyndham', 'marriott')
    ORDER BY b.slug, d.is_active DESC, d.id
    LIMIT 50
  `)) as unknown as
    | { rows?: Array<{ scraper_key: string; brand_slug: string; id: number; title: string; is_active: boolean }> }
    | Array<{ scraper_key: string; brand_slug: string; id: number; title: string; is_active: boolean }>;
  const rows = (Array.isArray(r) ? r : r.rows ?? []) as Array<{
    scraper_key: string;
    brand_slug: string;
    id: number;
    title: string;
    is_active: boolean;
  }>;
  console.log(`wyndham + marriott deals (first 50):`);
  for (const x of rows) console.log(`  [${x.is_active ? "A" : "i"}] #${x.id} ${x.brand_slug}/${x.scraper_key} :: "${x.title}"`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

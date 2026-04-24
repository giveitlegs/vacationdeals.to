/**
 * Parse SF `internal_all.csv` exports per source and upsert into
 * target_landers on the VPS.
 *
 * Run: npx tsx scripts/sf-import-landers.ts [--date=YYYY-MM-DD]
 *
 * Directory layout it expects:
 *   reports/sf-crawls/<date>/<source-slug>/internal_all.csv
 */

import fs from "node:fs";
import path from "node:path";
import { db } from "@vacationdeals/db";
import { sql } from "drizzle-orm";

const dateArg = process.argv.find((a) => a.startsWith("--date="));
const date = dateArg ? dateArg.split("=")[1] : new Date().toISOString().split("T")[0];
const root = path.join(process.cwd(), "reports", "sf-crawls", date);

if (!fs.existsSync(root)) {
  console.error(`No crawl dir at ${root}`);
  process.exit(1);
}

// Minimal CSV parser: SF quotes fields containing commas, escapes " as ""
function parseCsv(text: string): Record<string, string>[] {
  // Strip UTF-8 BOM if present (SF adds one)
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
  const lines = text.split(/\r?\n/).filter((l) => l.length > 0);
  if (lines.length < 2) return [];
  const headers = splitCsvRow(lines[0]);
  return lines.slice(1).map((line) => {
    const cells = splitCsvRow(line);
    const row: Record<string, string> = {};
    headers.forEach((h, i) => (row[h] = cells[i] ?? ""));
    return row;
  });
}

function splitCsvRow(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuote = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuote) {
      if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (ch === '"') { inQuote = false; }
      else cur += ch;
    } else {
      if (ch === '"') inQuote = true;
      else if (ch === ",") { out.push(cur); cur = ""; }
      else cur += ch;
    }
  }
  out.push(cur);
  return out;
}

async function importSource(sourceSlug: string, csvPath: string): Promise<number> {
  const text = fs.readFileSync(csvPath, "utf-8");
  const rows = parseCsv(text);
  // SF internal_all.csv columns of interest:
  //  Address | Content Type | Status Code | Title 1 | H1-1 | Meta Description 1 | Word Count
  const toUpsert = rows
    .filter((r) => r["Address"] && r["Address"].startsWith("http"))
    .map((r) => ({
      sourceSlug,
      url: r["Address"],
      statusCode: r["Status Code"] ? parseInt(r["Status Code"], 10) : null,
      title: r["Title 1"] || null,
      h1: r["H1-1"] || null,
      metaDescription: r["Meta Description 1"] || null,
      wordCount: r["Word Count"] ? parseInt(r["Word Count"], 10) : null,
      contentType: r["Content Type"] || null,
    }));

  if (toUpsert.length === 0) return 0;

  // Batch upsert via raw SQL (Drizzle doesn't know about this table yet)
  const chunkSize = 500;
  let inserted = 0;
  for (let i = 0; i < toUpsert.length; i += chunkSize) {
    const chunk = toUpsert.slice(i, i + chunkSize);
    const values = chunk.map((_, idx) =>
      `($${idx * 8 + 1}, $${idx * 8 + 2}, $${idx * 8 + 3}, $${idx * 8 + 4}, $${idx * 8 + 5}, $${idx * 8 + 6}, $${idx * 8 + 7}, $${idx * 8 + 8})`
    ).join(",\n");
    const params = chunk.flatMap((r) => [
      r.sourceSlug, r.url, r.statusCode, r.title, r.h1, r.metaDescription, r.wordCount, r.contentType,
    ]);
    const query = sql.raw(`
      INSERT INTO target_landers
        (source_slug, url, status_code, title, h1, meta_description, word_count, content_type)
      VALUES ${values}
      ON CONFLICT (source_slug, url) DO UPDATE SET
        status_code = EXCLUDED.status_code,
        title = EXCLUDED.title,
        h1 = EXCLUDED.h1,
        meta_description = EXCLUDED.meta_description,
        word_count = EXCLUDED.word_count,
        content_type = EXCLUDED.content_type,
        crawled_at = NOW()
    `);
    // Drizzle's sql.raw doesn't support params; switch to direct execute with placeholders
    // Use execute with dynamic params via string substitution guarded by numbers/quoted strings.
    // Safer: use drizzle's execute with sql` template and individual param injection.
    // Since the table isn't in Drizzle schema, use db.execute with sql.raw + explicit escaping.
    const esc = (v: unknown): string => {
      if (v == null) return "NULL";
      if (typeof v === "number") return String(v);
      return `'${String(v).replace(/'/g, "''")}'`;
    };
    const valuesInline = chunk.map((r) =>
      `(${esc(r.sourceSlug)}, ${esc(r.url)}, ${esc(r.statusCode)}, ${esc(r.title)}, ${esc(r.h1)}, ${esc(r.metaDescription)}, ${esc(r.wordCount)}, ${esc(r.contentType)})`
    ).join(",\n");
    await db.execute(sql.raw(`
      INSERT INTO target_landers
        (source_slug, url, status_code, title, h1, meta_description, word_count, content_type)
      VALUES ${valuesInline}
      ON CONFLICT (source_slug, url) DO UPDATE SET
        status_code = EXCLUDED.status_code,
        title = EXCLUDED.title,
        h1 = EXCLUDED.h1,
        meta_description = EXCLUDED.meta_description,
        word_count = EXCLUDED.word_count,
        content_type = EXCLUDED.content_type,
        crawled_at = NOW()
    `));
    // (The intermediate query variable above is intentionally unused — left as
    // documentation of the parameterized form we'd prefer. Drizzle's raw path
    // didn't accept $N placeholders, so we inline-escape instead.)
    void query;
    void params;
    inserted += chunk.length;
  }
  return inserted;
}

async function main() {
  const dirs = fs.readdirSync(root).filter((d) => {
    const p = path.join(root, d);
    return fs.statSync(p).isDirectory();
  });

  console.log(`Importing ${dirs.length} source crawls from ${root}`);

  let total = 0;
  for (const d of dirs) {
    const csv = path.join(root, d, "internal_all.csv");
    if (!fs.existsSync(csv)) {
      console.log(`  ${d}: no internal_all.csv`);
      continue;
    }
    // Strip "vacationdeals" prefix so own-site rows use 'vacationdeals' slug
    const slug = d === "vacationdeals" || d === "vacationdeals-test" ? "vacationdeals" : d;
    const n = await importSource(slug, csv);
    console.log(`  ${slug}: ${n} landers imported`);
    total += n;
  }

  console.log(`\nTotal: ${total} landers across ${dirs.length} sources`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

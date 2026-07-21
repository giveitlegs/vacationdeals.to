/**
 * Insert blog posts from JSON batch files into the blog_posts table.
 *
 * JSON source-of-record lives in research/blog-batches/<batch>/ so content is
 * versioned in git while the DB stays the runtime source (per CMS-managed
 * blog policy). Skips slugs that already exist; validates required fields.
 *
 * Run: npx tsx scripts/insert-blog-batch-json.ts research/blog-batches/weird-batch-2026-07
 *      ... --dry-run   (validate only)
 */

import fs from "fs";
import path from "path";
import { db, blogPosts } from "@vacationdeals/db";

const DRY_RUN = process.argv.includes("--dry-run");
const dirArg = process.argv[2];
if (!dirArg) {
  console.error("Usage: npx tsx scripts/insert-blog-batch-json.ts <batch-dir> [--dry-run]");
  process.exit(1);
}

const REQUIRED = [
  "slug", "title", "metaTitle", "metaDescription", "category",
  "publishDate", "bluf", "content", "faqs",
] as const;
const CATEGORIES = new Set(["destinations", "brands", "interests", "segments"]);

async function main() {
  const batchDir = path.resolve(dirArg);
  const files = fs
    .readdirSync(batchDir)
    .filter((f) => f.endsWith(".json"))
    .sort();
  if (files.length === 0) {
    console.error(`No .json files in ${batchDir}`);
    process.exit(1);
  }

  const existing = await db.select({ slug: blogPosts.slug }).from(blogPosts);
  const existingSlugs = new Set(existing.map((r) => r.slug));

  let inserted = 0;
  let skipped = 0;
  let invalid = 0;
  const seenThisRun = new Set<string>();

  for (const file of files) {
    const raw = fs.readFileSync(path.join(batchDir, file), "utf-8");
    let posts: any[];
    try {
      posts = JSON.parse(raw);
    } catch (e) {
      console.error(`[${file}] JSON parse error: ${e}`);
      invalid++;
      continue;
    }
    if (!Array.isArray(posts)) {
      console.error(`[${file}] Expected a JSON array`);
      invalid++;
      continue;
    }

    for (const p of posts) {
      const missing = REQUIRED.filter((k) => !p[k]);
      if (missing.length) {
        console.error(`[${file}] "${p.slug || p.title}" missing: ${missing.join(", ")}`);
        invalid++;
        continue;
      }
      if (!CATEGORIES.has(p.category)) {
        console.error(`[${file}] "${p.slug}" bad category: ${p.category}`);
        invalid++;
        continue;
      }
      const faqs = Array.isArray(p.faqs) ? p.faqs : [];
      if (faqs.length < 5 || !faqs.every((f: any) => f.question && f.answer)) {
        console.error(`[${file}] "${p.slug}" needs >=5 well-formed FAQs (has ${faqs.length})`);
        invalid++;
        continue;
      }
      if (existingSlugs.has(p.slug) || seenThisRun.has(p.slug)) {
        console.log(`[skip] ${p.slug} (already exists)`);
        skipped++;
        continue;
      }
      seenThisRun.add(p.slug);

      if (DRY_RUN) {
        console.log(`[dry-run ok] ${p.slug} (${p.content.length} chars, ${faqs.length} FAQs)`);
        inserted++;
        continue;
      }

      await db.insert(blogPosts).values({
        slug: p.slug,
        title: p.title,
        metaTitle: p.metaTitle.slice(0, 200),
        metaDescription: p.metaDescription,
        category: p.category,
        publishDate: new Date(p.publishDate),
        author: p.author || "The VacationDeals.to Team",
        readTime: p.readTime || "8 min read",
        bluf: p.bluf,
        heroImageAlt: p.heroImageAlt || p.title,
        heroGradient: p.heroGradient || "from-blue-600 to-cyan-400",
        content: p.content,
        faqs: JSON.stringify(faqs),
        internalLinks: JSON.stringify(p.internalLinks || []),
        relatedSlugs: JSON.stringify(p.relatedSlugs || []),
        tags: JSON.stringify(p.tags || []),
        isPublished: true,
      });
      console.log(`[inserted] ${p.slug}`);
      inserted++;
    }
  }

  console.log(
    `\nDone. ${DRY_RUN ? "Validated" : "Inserted"}: ${inserted}, skipped: ${skipped}, invalid: ${invalid}`,
  );
  process.exit(invalid > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

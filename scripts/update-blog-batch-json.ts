/**
 * UPDATE existing blog posts in place from refreshed JSON batch files.
 *
 * Companion to insert-blog-batch-json.ts, for the `vacpac-content-refresh` skill.
 * The insert script SKIPS existing slugs by design, so it cannot refresh — this one
 * finds each row BY SLUG and UPDATEs the mutable fields, bumping updated_at and
 * last_refreshed_at. It NEVER creates a row (a refresh must not mint URLs) and NEVER
 * changes a slug (URL stability).
 *
 * JSON = source of record in research/content-refresh/<date>/ (array of post objects,
 * or a single object per file — both accepted), same shape as the insert batches.
 *
 * Runtime: imports @vacationdeals/db — MUST run from apps/scraper with tsx + absolute
 * paths (npx/pnpm exec tsx from repo root fail with MODULE_NOT_FOUND):
 *   cd /var/www/vacationdeals/apps/scraper \
 *     && set -a && source /var/www/vacationdeals/.env && set +a \
 *     && ./node_modules/.bin/tsx /var/www/vacationdeals/scripts/update-blog-batch-json.ts \
 *          /var/www/vacationdeals/research/content-refresh/<YYYY-MM-DD> [--dry-run]
 */

import fs from "fs";
import path from "path";
import { db, blogPosts } from "@vacationdeals/db";
import { eq } from "drizzle-orm";

const DRY_RUN = process.argv.includes("--dry-run");
const dirArg = process.argv.find((a, i) => i >= 2 && !a.startsWith("--"));
if (!dirArg) {
  console.error("Usage: tsx scripts/update-blog-batch-json.ts <refresh-dir> [--dry-run]");
  process.exit(1);
}

const REQUIRED = [
  "slug", "title", "metaTitle", "metaDescription", "category",
  "bluf", "content", "faqs",
] as const;
const CATEGORIES = new Set(["destinations", "brands", "interests", "segments"]);
const WORD_FLOOR = 900; // content + FAQ text, matching the evergreen on-page measure

function words(s: unknown): number {
  return String(s ?? "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z#0-9]+;/gi, " ")
    .split(/\s+/)
    .filter(Boolean).length;
}
function faqWords(faqs: Array<{ question?: string; answer?: string }>): number {
  return faqs.reduce((a, f) => a + words(f.question) + words(f.answer), 0);
}
function dollars(s: string): string[] {
  return (String(s).match(/\$\s?[\d,]+(?:\.\d{2})?/g) || []).map((x) => x.replace(/\s/g, ""));
}

async function main() {
  const dir = path.resolve(dirArg!);
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json")).sort();
  if (files.length === 0) {
    console.error(`No .json files in ${dir}`);
    process.exit(1);
  }

  let updated = 0;
  let invalid = 0;
  let notfound = 0;
  let unchanged = 0;
  const seen = new Set<string>();

  for (const file of files) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(fs.readFileSync(path.join(dir, file), "utf-8"));
    } catch (e) {
      console.error(`[${file}] JSON parse error: ${e}`);
      invalid++;
      continue;
    }
    const posts: any[] = Array.isArray(parsed) ? parsed : [parsed];

    for (const p of posts) {
      // ── structural validation (mirrors the insert script) ──
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
      if (seen.has(p.slug)) {
        console.error(`[${file}] "${p.slug}" appears twice in this batch — skipping dup`);
        invalid++;
        continue;
      }

      // ── must already exist (UPDATE only, never create) ──
      const rows = await db.select().from(blogPosts).where(eq(blogPosts.slug, p.slug)).limit(1);
      const old = rows[0];
      if (!old) {
        console.error(`[not-found] "${p.slug}" has no existing row — refresh cannot create it. SKIPPED.`);
        notfound++;
        continue;
      }

      // ── never-degrade gates ──
      const newWords = words(p.content) + faqWords(faqs);
      if (newWords < WORD_FLOOR) {
        console.error(`[${file}] "${p.slug}" below word floor: ${newWords} < ${WORD_FLOOR} — REJECTED.`);
        invalid++;
        continue;
      }
      const oldLen = (old.content || "").length;
      const newLen = (p.content || "").length;
      const oldThin = oldLen < 5000; // the thin band from the audit
      if (newLen < oldLen && !oldThin) {
        console.error(`[${file}] "${p.slug}" length regression ${oldLen}->${newLen} on a non-thin post — REJECTED (never shorten a healthy post).`);
        invalid++;
        continue;
      }

      seen.add(p.slug);

      // ── field-level diff (the "never republish without diffing" gate) ──
      const oldWords = words(old.content) + (() => { try { return faqWords(JSON.parse(old.faqs || "[]")); } catch { return 0; } })();
      const oldD = new Set(dollars(old.content || ""));
      const newD = new Set(dollars(p.content || ""));
      const addedPrices = [...newD].filter((x) => !oldD.has(x));
      const removedPrices = [...oldD].filter((x) => !newD.has(x));
      const changes: string[] = [];
      if (old.title !== p.title) changes.push(`title: "${old.title}" -> "${p.title}"`);
      if (old.metaTitle !== p.metaTitle.slice(0, 200)) changes.push(`metaTitle changed`);
      if (old.metaDescription !== p.metaDescription) changes.push(`metaDescription changed`);
      if (old.category !== p.category) changes.push(`category: ${old.category} -> ${p.category}`);
      changes.push(`words ${oldWords}->${newWords} (${newWords - oldWords >= 0 ? "+" : ""}${newWords - oldWords})`);
      changes.push(`chars ${oldLen}->${newLen}`);
      if (addedPrices.length) changes.push(`prices +[${addedPrices.join(", ")}]`);
      if (removedPrices.length) changes.push(`prices -[${removedPrices.join(", ")}]`);
      const meaningful = changes.filter((c) => !c.startsWith("words ") && !c.startsWith("chars "));
      if (meaningful.length === 0 && addedPrices.length === 0 && removedPrices.length === 0 && oldWords === newWords) {
        console.log(`[no-change] ${p.slug} (identical content — will only bump last_refreshed_at)`);
        unchanged++;
      }

      if (DRY_RUN) {
        console.log(`[dry-run] ${p.slug}\n    ${changes.join("\n    ")}`);
        updated++;
        continue;
      }

      await db.update(blogPosts).set({
        title: p.title,
        metaTitle: p.metaTitle.slice(0, 200),
        metaDescription: p.metaDescription,
        category: p.category,
        author: p.author || old.author,
        readTime: p.readTime || old.readTime,
        bluf: p.bluf,
        heroImageAlt: p.heroImageAlt || old.heroImageAlt,
        heroGradient: p.heroGradient || old.heroGradient,
        content: p.content,
        faqs: JSON.stringify(faqs),
        internalLinks: JSON.stringify(p.internalLinks ?? (old.internalLinks ? JSON.parse(old.internalLinks) : [])),
        relatedSlugs: JSON.stringify(p.relatedSlugs ?? (old.relatedSlugs ? JSON.parse(old.relatedSlugs) : [])),
        tags: JSON.stringify(p.tags ?? (old.tags ? JSON.parse(old.tags) : [])),
        updatedAt: new Date(),
        lastRefreshedAt: new Date(),
      }).where(eq(blogPosts.slug, p.slug));
      console.log(`[updated] ${p.slug}  (${changes.filter((c)=>!c.startsWith("words ")&&!c.startsWith("chars ")).join("; ") || "freshened"})`);
      updated++;
    }
  }

  console.log(
    `\nDone. ${DRY_RUN ? "Validated" : "Updated"}: ${updated}` +
    (unchanged ? `, no-content-change: ${unchanged}` : "") +
    `, not-found: ${notfound}, invalid: ${invalid}`,
  );
  // not-found and invalid are hard problems a refresh must surface
  process.exit(invalid > 0 || notfound > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

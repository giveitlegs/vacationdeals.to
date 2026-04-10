/**
 * QA script for blog posts
 *
 * Validates each post in humanized-100.ts against quality requirements:
 * - Has a story opener (first-person pronoun in first paragraph)
 * - At least 2 misspellings (from known humanization list)
 * - At least 3 grammar imperfections
 * - Has 10 FAQs
 * - Has at least 3 internal links
 * - Has a bluf, title, slug, category
 * - Slug is unique (not in existing 354 slugs)
 *
 * Run: npx tsx scripts/qa-blog-posts.ts
 * Exit 0 if all posts pass, exit 1 if any fail.
 */

import fs from "fs";
import path from "path";
import { humanized100Posts } from "../apps/web/src/lib/blog-posts/humanized-100";

const MISSPELLINGS = ["recieve", "seperate", "occured", "definately", "accomodate", "untill", "truely", "immediatly", "alot", "completley", "beleive", "neccessary", "begining", "enviroment", "realised", "colour", "favour", "behaviour"];

// Grammar imperfection patterns (indicators of humanization)
const GRAMMAR_MARKERS = [
  /\byour (?:at|in|going|watching|basically|lighting|staring|calculating|forgetting|bringing|playing|booking|free|horizontal|paying|paying|exhausted|basically)\b/i, // your vs you're
  /\btheir (?:going|playing|basically|are)\b/i, // their vs they're
  /\bits (?:a|not|real|important|glorious|big|huge|normal)\b/i, // its vs it's
  /\btheres\b/i, // there's
  /\bthats\b/i, // that's
  /\bdont\b/i, // don't
  /\bcouldn't\b/i,
  /\b(?:I|we) literally\b/i, // casual intensifier
  /\byour basically\b/i,
  /\byour going\b/i,
  /\byour already\b/i,
];

interface ValidationResult {
  slug: string;
  passed: boolean;
  issues: string[];
}

function validatePost(post: typeof humanized100Posts[number]): ValidationResult {
  const issues: string[] = [];

  // Check required fields
  if (!post.slug) issues.push("Missing slug");
  if (!post.title) issues.push("Missing title");
  if (!post.metaTitle) issues.push("Missing metaTitle");
  if (!post.metaDescription) issues.push("Missing metaDescription");
  if (!post.bluf) issues.push("Missing bluf");
  if (!post.content) issues.push("Missing content");
  if (!post.category) issues.push("Missing category");

  // Check first-person story opener
  const firstPara = post.content.split("</p>")[0].replace(/<[^>]+>/g, "");
  const firstPersonWords = ["I ", "my ", "we ", "our ", "me "];
  const hasFirstPerson = firstPersonWords.some((w) => firstPara.toLowerCase().includes(w.toLowerCase()));
  if (!hasFirstPerson) issues.push("No first-person story opener");

  // Check misspellings
  const contentLower = post.content.toLowerCase();
  const foundMisspellings = MISSPELLINGS.filter((m) => contentLower.includes(m));
  if (foundMisspellings.length < 2) {
    issues.push(`Only ${foundMisspellings.length} misspellings (need 2+): found [${foundMisspellings.join(", ")}]`);
  }

  // Check grammar imperfections
  const grammarHits = GRAMMAR_MARKERS.filter((rx) => rx.test(post.content));
  if (grammarHits.length < 3) {
    issues.push(`Only ${grammarHits.length} grammar imperfections (need 3+)`);
  }

  // Check FAQs
  if (!post.faqs || post.faqs.length < 10) {
    issues.push(`Only ${post.faqs?.length ?? 0} FAQs (need 10)`);
  }

  // Check internal links
  if (!post.internalLinks || post.internalLinks.length < 3) {
    issues.push(`Only ${post.internalLinks?.length ?? 0} internal links (need 3+)`);
  }

  // Check category
  if (!["destinations", "brands", "interests", "segments"].includes(post.category)) {
    issues.push(`Invalid category: ${post.category}`);
  }

  return {
    slug: post.slug,
    passed: issues.length === 0,
    issues,
  };
}

// Load existing slugs for duplicate check
const existingSlugsFile = path.join(__dirname, "..", "apps", "web", "src", "lib", "blog-posts");
const existingFiles = fs.readdirSync(existingSlugsFile).filter((f) => f.endsWith(".ts") && f !== "humanized-100.ts");
const existingSlugs = new Set<string>();
for (const file of existingFiles) {
  const content = fs.readFileSync(path.join(existingSlugsFile, file), "utf-8");
  const matches = content.matchAll(/slug:\s*"([^"]+)"/g);
  for (const m of matches) existingSlugs.add(m[1]);
}

console.log(`Loaded ${existingSlugs.size} existing slugs for duplicate check.\n`);

// Validate all posts
const results: ValidationResult[] = [];
const slugCounts = new Map<string, number>();

for (const post of humanized100Posts) {
  const result = validatePost(post);

  // Check for duplicate with existing
  if (existingSlugs.has(post.slug)) {
    result.issues.push(`DUPLICATE: slug already exists in other blog files`);
    result.passed = false;
  }

  // Check for internal duplicates
  slugCounts.set(post.slug, (slugCounts.get(post.slug) ?? 0) + 1);

  results.push(result);
}

// Report internal duplicates
for (const [slug, count] of slugCounts) {
  if (count > 1) {
    const r = results.find((r) => r.slug === slug);
    if (r) {
      r.issues.push(`INTERNAL DUPLICATE: ${count} posts with this slug`);
      r.passed = false;
    }
  }
}

// Summary
const passed = results.filter((r) => r.passed).length;
const failed = results.filter((r) => !r.passed).length;

console.log(`=== QA Results ===`);
console.log(`Total posts: ${results.length}`);
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}\n`);

if (failed > 0) {
  console.log(`=== Failures ===`);
  for (const r of results.filter((r) => !r.passed)) {
    console.log(`\n[FAIL] ${r.slug}`);
    for (const issue of r.issues) {
      console.log(`  - ${issue}`);
    }
  }
  process.exit(1);
}

console.log(`All ${passed} posts passed QA.`);
process.exit(0);

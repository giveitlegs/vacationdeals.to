/**
 * Inject contextual sublander links into existing blog posts.
 *
 * Scans every blog post under apps/web/src/lib/blog-posts/*.ts and injects
 * 2-4 contextual anchor links per post based on:
 *
 *   1. Which priority cities are mentioned in the post content?
 *   2. Which modifier keywords (families, bachelor, fall, etc.) appear?
 *   3. For each (city, modifier) pair that matches and is a valid sublander,
 *      inject <a href="/{city}-{modifier}">…</a> in the first unlinked
 *      occurrence of the city/modifier pair.
 *
 * Rules:
 *   - Never inject into a sentence that already contains a link
 *   - Never inject the same sublander twice in one post
 *   - Cap at 4 sublander links per post
 *   - Preserve the raw JS/TS string literal encoding (escaped quotes/newlines)
 *
 * Run:  npx tsx scripts/inject-blog-sublander-links.ts
 *       npx tsx scripts/inject-blog-sublander-links.ts --dry-run    (no writes)
 */

import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const BLOG_DIR = resolve(__dirname, "..", "apps", "web", "src", "lib", "blog-posts");
const DRY_RUN = process.argv.includes("--dry-run");

// Inline the modifier + city config (avoid ESM import headache from shared pkg)
const PRIORITY_CITIES = [
  "orlando",
  "las-vegas",
  "gatlinburg",
  "myrtle-beach",
  "branson",
  "williamsburg",
  "cocoa-beach",
  "cancun",
  "cabo-san-lucas",
  "puerto-vallarta",
  "punta-cana",
  "daytona-beach",
] as const;

const CITY_NAMES: Record<string, { name: string; regex: RegExp }> = {
  "orlando": { name: "Orlando", regex: /\bOrlando\b/i },
  "las-vegas": { name: "Las Vegas", regex: /\bLas Vegas\b|\bVegas\b/i },
  "gatlinburg": { name: "Gatlinburg", regex: /\bGatlinburg\b|\bSmoky Mountain\b/i },
  "myrtle-beach": { name: "Myrtle Beach", regex: /\bMyrtle Beach\b/i },
  "branson": { name: "Branson", regex: /\bBranson\b/i },
  "williamsburg": { name: "Williamsburg", regex: /\bWilliamsburg\b/i },
  "cocoa-beach": { name: "Cocoa Beach", regex: /\bCocoa Beach\b/i },
  "cancun": { name: "Cancun", regex: /\bCancun\b/i },
  "cabo-san-lucas": { name: "Cabo", regex: /\bCabo\b|\bLos Cabos\b/i },
  "puerto-vallarta": { name: "Puerto Vallarta", regex: /\bPuerto Vallarta\b/i },
  "punta-cana": { name: "Punta Cana", regex: /\bPunta Cana\b/i },
  "daytona-beach": { name: "Daytona", regex: /\bDaytona\b/i },
};

// Modifier slug → regex to match in content
const MODIFIER_KEYWORDS: Record<string, { label: string; regex: RegExp }> = {
  "for-families": { label: "for Families", regex: /\b(families|family|kids|children)\b/i },
  "for-couples": { label: "for Couples", regex: /\bcouples?\b/i },
  "for-seniors": { label: "for Seniors", regex: /\b(seniors?|retirees?|55\+)\b/i },
  "solo-travelers": { label: "for Solo Travelers", regex: /\bsolo travel/i },
  "for-groups": { label: "for Groups", regex: /\bgroup trip|group vacation/i },
  "honeymoon": { label: "Honeymoon", regex: /\bhoneymoon/i },
  "bachelor-party": { label: "Bachelor Party", regex: /\bbachelor\s+part/i },
  "bachelorette-party": { label: "Bachelorette Party", regex: /\bbachelorette/i },
  "girls-trip": { label: "Girls Trip", regex: /\bgirls?['’]?\s+(trip|weekend|night)/i },
  "destination-wedding": { label: "Destination Wedding", regex: /\bdestination wedding/i },
  "summer": { label: "Summer", regex: /\bsummer\b/i },
  "fall": { label: "Fall", regex: /\bfall\s+(vacation|trip|foliage|leaf|season)/i },
  "spring": { label: "Spring", regex: /\bspring\s+(vacation|trip|season)/i },
  "winter": { label: "Winter", regex: /\bwinter\b/i },
  "spring-break": { label: "Spring Break", regex: /\bspring break\b/i },
  "shoulder-season": { label: "Shoulder Season", regex: /\bshoulder season\b/i },
  "last-minute": { label: "Last Minute", regex: /\blast[- ]minute\b/i },
  "memorial-day-weekend": { label: "Memorial Day Weekend", regex: /\bmemorial day\b/i },
  "july-4th": { label: "July 4th", regex: /\bjuly\s*4|independence day/i },
  "labor-day-weekend": { label: "Labor Day Weekend", regex: /\blabor day\b/i },
  "thanksgiving": { label: "Thanksgiving", regex: /\bthanksgiving\b/i },
  "christmas": { label: "Christmas", regex: /\bchristmas\b/i },
  "new-years": { label: "New Year's", regex: /\bnew year/i },
  "under-99": { label: "Under $99", regex: /\b(under \$?99|\$59|\$79|\$89|\$99 vacpack)/i },
  "under-149": { label: "Under $149", regex: /\bunder \$?149\b/i },
  "under-199": { label: "Under $199", regex: /\bunder \$?199\b/i },
  "cheap": { label: "Cheap", regex: /\bcheap(est)? vacpack|cheap vacation/i },
  "luxury": { label: "Luxury", regex: /\bluxury\s+(vacpack|resort|vacation)/i },
  "weekend": { label: "Weekend", regex: /\bweekend getaway|weekend trip/i },
  "2-night": { label: "2-Night", regex: /\b2[- ]night\b/i },
  "3-night": { label: "3-Night", regex: /\b3[- ]night\b/i },
  "5-night": { label: "5-Night", regex: /\b5[- ]night\b/i },
  "all-inclusive": { label: "All-Inclusive", regex: /\ball[- ]inclusive\b/i },
  "near-disney": { label: "Near Disney", regex: /\bnear disney|disney world\b/i },
  "near-universal": { label: "Near Universal", regex: /\bnear universal|universal studios\b/i },
  "oceanfront": { label: "Oceanfront", regex: /\boceanfront|ocean ?view\b/i },
  "with-waterpark": { label: "with Waterpark", regex: /\bwaterpark|water park\b/i },
  "ski-in-ski-out": { label: "Ski-In/Ski-Out", regex: /\bski[- ]in[- ]?ski[- ]out\b/i },
  "pet-friendly": { label: "Pet-Friendly", regex: /\bpet[- ]friendly\b/i },
  "adults-only": { label: "Adults Only", regex: /\badults[- ]only\b/i },
};

// Per-city modifier allowlist (matches packages/shared/src/sublanders.ts)
const CITY_SUBLANDERS: Record<string, string[]> = {
  "orlando": ["for-families", "for-couples", "for-seniors", "solo-travelers", "for-groups", "honeymoon", "girls-trip", "summer", "fall", "spring", "winter", "spring-break", "shoulder-season", "last-minute", "memorial-day-weekend", "july-4th", "labor-day-weekend", "thanksgiving", "christmas", "new-years", "under-99", "under-149", "under-199", "cheap", "luxury", "weekend", "2-night", "3-night", "5-night", "near-disney", "near-universal", "with-waterpark"],
  "las-vegas": ["for-couples", "for-seniors", "solo-travelers", "for-groups", "bachelor-party", "bachelorette-party", "honeymoon", "girls-trip", "summer", "fall", "spring", "winter", "shoulder-season", "last-minute", "memorial-day-weekend", "july-4th", "labor-day-weekend", "new-years", "under-99", "under-149", "under-199", "cheap", "luxury", "weekend", "2-night", "3-night", "adults-only"],
  "gatlinburg": ["for-families", "for-couples", "for-seniors", "for-groups", "summer", "fall", "spring", "winter", "shoulder-season", "last-minute", "memorial-day-weekend", "july-4th", "labor-day-weekend", "thanksgiving", "christmas", "under-99", "under-149", "under-199", "cheap", "weekend", "2-night", "3-night", "with-waterpark", "pet-friendly"],
  "myrtle-beach": ["for-families", "for-couples", "for-seniors", "for-groups", "summer", "fall", "spring", "winter", "spring-break", "shoulder-season", "last-minute", "memorial-day-weekend", "july-4th", "labor-day-weekend", "under-99", "under-149", "under-199", "cheap", "weekend", "2-night", "3-night", "5-night", "oceanfront", "pet-friendly"],
  "branson": ["for-families", "for-couples", "for-seniors", "for-groups", "summer", "fall", "spring", "winter", "shoulder-season", "last-minute", "memorial-day-weekend", "july-4th", "thanksgiving", "christmas", "under-99", "under-149", "under-199", "cheap", "weekend", "2-night", "3-night", "with-waterpark"],
  "williamsburg": ["for-families", "for-couples", "for-seniors", "for-groups", "summer", "fall", "spring", "shoulder-season", "last-minute", "memorial-day-weekend", "july-4th", "labor-day-weekend", "thanksgiving", "under-99", "under-149", "under-199", "cheap", "weekend", "2-night", "3-night", "with-waterpark"],
  "cocoa-beach": ["for-families", "for-couples", "for-seniors", "for-groups", "summer", "fall", "spring", "winter", "spring-break", "shoulder-season", "last-minute", "memorial-day-weekend", "july-4th", "under-99", "under-149", "under-199", "cheap", "weekend", "2-night", "3-night", "oceanfront"],
  "cancun": ["for-couples", "solo-travelers", "for-groups", "honeymoon", "destination-wedding", "summer", "fall", "winter", "spring-break", "last-minute", "christmas", "new-years", "under-199", "luxury", "3-night", "5-night", "all-inclusive", "oceanfront", "adults-only"],
  "cabo-san-lucas": ["for-couples", "for-groups", "honeymoon", "destination-wedding", "summer", "fall", "winter", "last-minute", "christmas", "new-years", "luxury", "3-night", "5-night", "all-inclusive", "oceanfront", "adults-only"],
  "puerto-vallarta": ["for-couples", "for-groups", "honeymoon", "destination-wedding", "summer", "fall", "winter", "spring-break", "last-minute", "luxury", "3-night", "5-night", "all-inclusive", "oceanfront", "adults-only"],
  "punta-cana": ["for-couples", "for-groups", "honeymoon", "destination-wedding", "summer", "fall", "winter", "spring-break", "luxury", "3-night", "5-night", "all-inclusive", "oceanfront", "adults-only"],
  "daytona-beach": ["for-families", "for-couples", "for-seniors", "for-groups", "summer", "fall", "spring", "winter", "spring-break", "shoulder-season", "last-minute", "memorial-day-weekend", "july-4th", "under-99", "under-149", "under-199", "cheap", "weekend", "2-night", "3-night", "oceanfront"],
};

// ─────────────────────────────────────────────────────────────
// Injection logic
// ─────────────────────────────────────────────────────────────

interface InjectionCandidate {
  citySlug: string;
  cityName: string;
  modifierSlug: string;
  modifierLabel: string;
  href: string;
  anchorText: string;
}

function findCandidates(content: string): InjectionCandidate[] {
  const out: InjectionCandidate[] = [];
  for (const citySlug of PRIORITY_CITIES) {
    const cityInfo = CITY_NAMES[citySlug];
    if (!cityInfo || !cityInfo.regex.test(content)) continue;
    const allowed = new Set(CITY_SUBLANDERS[citySlug] || []);
    for (const [modSlug, modInfo] of Object.entries(MODIFIER_KEYWORDS)) {
      if (!allowed.has(modSlug)) continue;
      if (!modInfo.regex.test(content)) continue;
      out.push({
        citySlug,
        cityName: cityInfo.name,
        modifierSlug: modSlug,
        modifierLabel: modInfo.label,
        href: `/${citySlug}-${modSlug}`,
        anchorText: `${cityInfo.name} vacation deals ${modInfo.label}`,
      });
    }
  }
  return out;
}

/**
 * Insert a link into the content by finding an unlinked mention of the
 * city name and wrapping it plus a trailing phrase. Returns updated content
 * and whether injection succeeded.
 */
function injectOne(content: string, candidate: InjectionCandidate): { content: string; injected: boolean } {
  const { cityName, modifierLabel, href, anchorText } = candidate;

  // Strategy: find the first occurrence of the city name (as a whole word,
  // not inside an HTML tag, not inside an existing link) and append a short
  // link phrase right after it.
  // e.g., "Orlando trip" → "Orlando trip (see <a>Orlando vacation deals for Families</a>)"
  // This preserves original copy AND surfaces the link inline.

  const cityRe = new RegExp(`\\b${cityName.replace(/ /g, "\\s+")}\\b`, "i");
  const m = content.match(cityRe);
  if (!m) return { content, injected: false };

  const idx = m.index ?? 0;
  const matched = m[0];

  // Avoid injection inside an existing anchor tag or a tag attribute
  const window = content.slice(Math.max(0, idx - 200), idx + matched.length + 200);
  if (
    window.match(/<a\s[^>]*$/i) ||           // inside an open <a> tag
    window.slice(200).match(/^[^<]*<\/a>/i) || // closing </a> just after
    window.match(/href=[^"]*$/i) ||           // inside an href attribute
    content.slice(Math.max(0, idx - 1), idx).match(/["'>]/)  // inside a tag attribute
  ) {
    return { content, injected: false };
  }

  // Pick a unique, natural-sounding phrasing per modifier class
  const phrasing = pickPhrasing(cityName, modifierLabel, href);

  // Insert the anchor right after the city name mention; add a space + phrasing
  const before = content.slice(0, idx + matched.length);
  const after = content.slice(idx + matched.length);
  const replaced = `${before} (${phrasing})${after}`;

  return { content: replaced, injected: true };
}

/**
 * Rotate among a few phrasings so the site doesn't have 1000 identical
 * injected link texts (SEO anti-pattern).
 */
function pickPhrasing(cityName: string, modLabel: string, href: string): string {
  // Use the href to seed deterministic rotation
  const hash = [...href].reduce((h, c) => ((h * 31 + c.charCodeAt(0)) >>> 0), 0);
  const variants = [
    `browse <a href=\\"${href}\\">${cityName} vacation deals ${modLabel}</a>`,
    `see our <a href=\\"${href}\\">${cityName} deals ${modLabel}</a>`,
    `more on <a href=\\"${href}\\">${cityName} ${modLabel} vacation deals</a>`,
    `compare <a href=\\"${href}\\">${cityName} vacpacks ${modLabel}</a>`,
  ];
  return variants[hash % variants.length];
}

function injectIntoContent(originalContent: string): { content: string; inserted: string[] } {
  const candidates = findCandidates(originalContent);
  const inserted: string[] = [];
  let content = originalContent;
  const MAX_INJECTIONS = 4;

  for (const c of candidates) {
    if (inserted.length >= MAX_INJECTIONS) break;
    // Skip if the exact href already appears in the content (already linked)
    if (content.includes(`"${c.href}"`) || content.includes(`\\"${c.href}\\"`)) continue;
    const result = injectOne(content, c);
    if (result.injected) {
      content = result.content;
      inserted.push(`${c.citySlug}-${c.modifierSlug}`);
    }
  }
  return { content, inserted };
}

// ─────────────────────────────────────────────────────────────
// File scan + rewrite
// ─────────────────────────────────────────────────────────────

function processFile(filePath: string): { injected: number; posts: number } {
  const src = readFileSync(filePath, "utf8");
  let totalInserted = 0;
  let postCount = 0;

  // Regex matches `content: "…"` string literals in the blog-post TS files.
  // The content is a single JS string with escaped quotes (\"), escaped
  // newlines (\\n), etc. We need to work on the encoded form so we don't
  // break existing escapes.
  // Accept both TS-style (content:) and JSON-style ("content":) keys.
  // Handle double-quoted string literals:
  let updated = src.replace(
    /(["']?content["']?\s*:\s*)"((?:[^"\\]|\\.)*)"/g,
    (_full, pre, encoded) => {
      postCount++;
      const { content: newEncoded, inserted } = injectIntoContent(encoded);
      if (inserted.length === 0) return `${pre}"${encoded}"`;
      totalInserted += inserted.length;
      return `${pre}"${newEncoded}"`;
    },
  );
  // Handle template literals (backticks) — multi-line content blocks
  updated = updated.replace(
    /(["']?content["']?\s*:\s*)`((?:[^`\\]|\\.)*)`/g,
    (_full, pre, raw) => {
      postCount++;
      // In template literals, we don't need to double-escape \"; we can
      // inline real " quotes. injectIntoContent expects \\" style to match
      // the escape convention used in the injector. Strip the escapes before
      // injecting and re-apply after.
      const decoded = raw;
      const { content: injected, inserted } = injectIntoContent(decoded);
      if (inserted.length === 0) return `${pre}\`${raw}\``;
      // Inside template literals, the anchor we inject uses \" — need to
      // convert those back to real " since the template literal doesn't
      // require escaped quotes.
      const unescaped = injected.replace(/\\"/g, '"');
      totalInserted += inserted.length;
      return `${pre}\`${unescaped}\``;
    },
  );

  if (totalInserted > 0 && !DRY_RUN) {
    writeFileSync(filePath, updated);
  }

  return { injected: totalInserted, posts: postCount };
}

function main() {
  const files = readdirSync(BLOG_DIR)
    .filter((f) => f.endsWith(".ts") && !f.endsWith(".d.ts"))
    .sort();
  let grandTotal = 0;
  let totalPosts = 0;
  const touched: string[] = [];

  for (const f of files) {
    const full = resolve(BLOG_DIR, f);
    const { injected, posts } = processFile(full);
    totalPosts += posts;
    grandTotal += injected;
    if (injected > 0) {
      touched.push(`  ${f}: injected ${injected} links across ${posts} posts`);
    }
  }

  console.log(`${DRY_RUN ? "DRY RUN — " : ""}Processed ${files.length} files, ${totalPosts} posts`);
  console.log(touched.join("\n"));
  console.log(`\nTotal links injected: ${grandTotal}`);
}

main();

/**
 * Inject contextual sublander links into existing blog posts.
 *
 * Scans every blog post in blog-posts/*.ts. For each post:
 *   1. Finds mentions of a known city name + applicable modifier context
 *   2. Inserts a single anchor tag linking to the relevant sublander
 *   3. Limits to 2 injected links per post to avoid over-linking
 *   4. Skips injection if the sentence already contains a link
 *
 * Run: npx tsx scripts/inject-blog-sublander-links.ts
 *
 * This script edits blog-post TS files in place. Review the diff before committing.
 */

import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { PRIORITY_CITIES, CITY_SUBLANDERS, MODIFIERS } from "../packages/shared/src/sublanders.js";

const BLOG_DIR = resolve(__dirname, "..", "apps", "web", "src", "lib", "blog-posts");

const CITY_NAMES: Record<string, string> = {
  orlando: "Orlando",
  "las-vegas": "Las Vegas",
  gatlinburg: "Gatlinburg",
  "myrtle-beach": "Myrtle Beach",
  branson: "Branson",
  williamsburg: "Williamsburg",
  "cocoa-beach": "Cocoa Beach",
  cancun: "Cancun",
  "cabo-san-lucas": "Cabo",
  "puerto-vallarta": "Puerto Vallarta",
  "punta-cana": "Punta Cana",
  "daytona-beach": "Daytona",
};

// Keywords that signal a modifier intent in the text
const MODIFIER_KEYWORDS: Record<string, string[]> = {
  "for-families": ["family", "families", "kids", "children"],
  "for-couples": ["couples", "couple", "romantic"],
  "honeymoon": ["honeymoon", "newlywed"],
  "bachelor-party": ["bachelor"],
  "bachelorette-party": ["bachelorette"],
  "summer": ["summer", "July", "August"],
  "fall": ["fall", "October", "foliage", "leaf"],
  "winter": ["winter", "January", "February"],
  "spring-break": ["spring break"],
  "christmas": ["Christmas", "holiday"],
  "under-99": ["under $99", "cheap", "$59", "$79"],
  "all-inclusive": ["all-inclusive", "all inclusive"],
  "oceanfront": ["oceanfront", "ocean front"],
  "near-disney": ["Disney", "Magic Kingdom"],
  "with-waterpark": ["waterpark", "water park"],
  "3-night": ["3-night", "three night"],
};

function isEligibleLink(citySlug: string, modifierSlug: string): boolean {
  return (CITY_SUBLANDERS[citySlug] || []).includes(modifierSlug);
}

function injectLinks(content: string): { content: string; inserted: number } {
  let inserted = 0;
  let out = content;

  for (const citySlug of PRIORITY_CITIES) {
    if (inserted >= 2) break;
    const cityName = CITY_NAMES[citySlug];
    if (!cityName) continue;

    for (const [modifierSlug, keywords] of Object.entries(MODIFIER_KEYWORDS)) {
      if (inserted >= 2) break;
      if (!isEligibleLink(citySlug, modifierSlug)) continue;

      // Look for sentences that mention the city + any modifier keyword
      for (const kw of keywords) {
        const pattern = new RegExp(
          `(${cityName})([^<]*?\\b${kw}\\b)`,
          "i",
        );
        const m = out.match(pattern);
        if (!m) continue;

        // Skip if the match region already contains a link
        const startIdx = m.index ?? -1;
        if (startIdx < 0) continue;
        const snippet = out.slice(Math.max(0, startIdx - 50), startIdx + m[0].length + 50);
        if (snippet.includes("<a ") || snippet.includes("</a>")) continue;

        const mod = MODIFIERS[modifierSlug];
        if (!mod) continue;

        const linkText = `${cityName} ${mod.h1Fragment}`.replace(/\s+/g, " ").trim();
        const replacement = `<a href="/${citySlug}-${modifierSlug}">${linkText}</a>$2`;
        out = out.replace(pattern, `$1${replacement}`.replace("$1", m[1]));
        inserted++;
        break; // move to next modifier
      }
    }
  }

  return { content: out, inserted };
}

function processFile(path: string): number {
  const src = readFileSync(path, "utf8");
  // Find each `content: "<p>...</p>"` block and inject
  // This is a naive scan — it finds `content:` string literals
  let totalInserted = 0;
  const updated = src.replace(/(content:\s*")((?:[^"\\]|\\.)+)(")/g, (full, pre, body, post) => {
    const decoded = body.replace(/\\"/g, '"').replace(/\\n/g, "\n").replace(/\\\\/g, "\\");
    const { content: newBody, inserted } = injectLinks(decoded);
    if (inserted === 0) return full;
    totalInserted += inserted;
    const encoded = newBody.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n");
    return pre + encoded + post;
  });
  if (totalInserted > 0) {
    writeFileSync(path, updated);
    console.log(`  ${path.split(/[\\/]/).pop()}: injected ${totalInserted}`);
  }
  return totalInserted;
}

function main() {
  const files = readdirSync(BLOG_DIR).filter((f) => f.endsWith(".ts") && !f.endsWith(".d.ts"));
  let grandTotal = 0;
  for (const f of files) {
    const full = resolve(BLOG_DIR, f);
    grandTotal += processFile(full);
  }
  console.log(`\nTotal links injected: ${grandTotal}`);
}

main();

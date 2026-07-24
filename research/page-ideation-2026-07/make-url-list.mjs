// Emits the clickable URL list for the 225 niche pages, grouped by category.
// Reads generated JSON files; labels via the category letter tag baked in tags[].
import fs from "node:fs";
import path from "node:path";

const dir = path.join(process.cwd(), "research", "page-ideation-2026-07", "pages");
const BASE = "https://vacationdeals.to";

const GROUPS = {
  "pages-a1": "A. Proprietary Data & Stat-Bait (1-15)",
  "pages-a2": "A. Proprietary Data & Stat-Bait (16-30)",
  "pages-b1": "B. Requirements / Eligibility AEO (31-45)",
  "pages-b2": "B. Requirements / Eligibility AEO (46-60)",
  "pages-c-legal": "C. State Legal & Rescission (disclaimed)",
  "pages-d-fees": "D. Fee Databases & Cost Tables",
  "pages-e-calc": "E. Calculators & Tools",
  "pages-f-showdowns": "F. Brand x Destination Showdowns",
  "pages-g1": "G. Ultra-Niche Audiences (26-40)",
  "pages-g2": "G. Ultra-Niche Audiences (41-55)",
  "pages-h-seasonal": "H. Seasonal & Event Pegs",
  "pages-i-watchdog": "I. Dealbuster Watchdog",
  "pages-j-glossary": "J. Glossary & Definitions",
};
const ORDER = Object.keys(GROUPS);

let total = 0;
const lines = ["# 225 Niche Pages — Clickable URL List", ""];
for (const key of ORDER) {
  const f = path.join(dir, key + ".json");
  if (!fs.existsSync(f)) { lines.push(`## ${GROUPS[key]}`, "_(file missing)_", ""); continue; }
  const posts = JSON.parse(fs.readFileSync(f, "utf8"));
  lines.push(`## ${GROUPS[key]} (${posts.length})`, "");
  for (const p of posts) { lines.push(`- [${p.title}](${BASE}/${p.slug})`); total++; }
  lines.push("");
}
lines.unshift(`_Total: ${total} pages_`, "");
const out = path.join(process.cwd(), "research", "page-ideation-2026-07", "URL-LIST.md");
fs.writeFileSync(out, lines.join("\n"));
console.log(`wrote ${total} URLs to ${out}`);

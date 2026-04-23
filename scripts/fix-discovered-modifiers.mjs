import { readFileSync, writeFileSync } from "node:fs";

const p = "packages/shared/src/sublanders.ts";
let src = readFileSync(p, "utf8");

// Step 1: remove the wrongly-injected modifier tokens from CITY_BLURB_POOLS entries.
// Pattern to remove: newline + spaces + "bundles", "specials", "timeshare-promotions" (optionally ", flight-and-hotel")
const wrongInjection = /\n\s+"bundles", "specials", "timeshare-promotions"(, "flight-and-hotel")?,\n/g;
const before = src;
src = src.replace(wrongInjection, "\n");
const removals = (before.match(wrongInjection) || []).length;
console.log(`Removed ${removals} wrong injections from blurb pools.`);

// Step 2: Find the CITY_SUBLANDERS object, which begins with:
//   export const CITY_SUBLANDERS: Record<string, string[]> = {
// Then find each city inside and append the new modifiers.
const sublandersStart = src.indexOf("export const CITY_SUBLANDERS");
if (sublandersStart < 0) {
  console.error("CITY_SUBLANDERS not found");
  process.exit(1);
}

const UNIVERSAL = ["bundles", "specials", "timeshare-promotions"];
const MEXICO = new Set(["cancun", "cabo-san-lucas", "puerto-vallarta", "punta-cana", "cozumel"]);

const cities = [
  "orlando", "las-vegas", "gatlinburg", "myrtle-beach", "branson", "williamsburg",
  "cocoa-beach", "cancun", "cabo-san-lucas", "puerto-vallarta", "punta-cana", "daytona-beach",
  "maui", "charleston", "park-city", "hilton-head", "ormond-beach", "new-smyrna-beach",
  "cozumel", "atlanta", "river-ranch",
];

let added = 0;
for (const city of cities) {
  const quotedKey = `"${city}": [`;
  const unquotedKey = `${city}: [`;
  // Find the occurrence AFTER sublandersStart so we don't match the blurb-pool one
  let searchFrom = sublandersStart;
  let idx = src.indexOf(quotedKey, searchFrom);
  let keyLen = quotedKey.length;
  if (idx < 0) {
    idx = src.indexOf(unquotedKey, searchFrom);
    keyLen = unquotedKey.length;
  }
  if (idx < 0) {
    console.log(`NO MATCH: ${city}`);
    continue;
  }
  const arrayStart = idx + keyLen;

  let depth = 1;
  let i = arrayStart;
  while (i < src.length && depth > 0) {
    const ch = src[i];
    if (ch === "[") depth++;
    else if (ch === "]") depth--;
    if (depth === 0) break;
    i++;
  }

  const arrayContent = src.slice(arrayStart, i);
  const toAdd = [...UNIVERSAL];
  if (MEXICO.has(city)) toAdd.push("flight-and-hotel");
  const missing = toAdd.filter((m) => !arrayContent.includes(`"${m}"`));
  if (missing.length === 0) continue;

  const insertion = `\n    ${missing.map((a) => `"${a}"`).join(", ")},`;
  src = src.slice(0, i) + insertion + "\n  " + src.slice(i);
  added += missing.length;
  console.log(`  ${city}: +${missing.length} (${missing.join(", ")})`);
}

writeFileSync(p, src);
console.log(`\nTotal additions: ${added}`);

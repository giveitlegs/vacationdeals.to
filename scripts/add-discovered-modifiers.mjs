import { readFileSync, writeFileSync } from "node:fs";

const p = "packages/shared/src/sublanders.ts";
let src = readFileSync(p, "utf8");

const UNIVERSAL_NEW = ["bundles", "specials", "timeshare-promotions"];
const MEXICO_CARIBBEAN = new Set(["cancun", "cabo-san-lucas", "puerto-vallarta", "punta-cana", "cozumel"]);

const cities = [
  "orlando", "las-vegas", "gatlinburg", "myrtle-beach", "branson", "williamsburg",
  "cocoa-beach", "cancun", "cabo-san-lucas", "puerto-vallarta", "punta-cana", "daytona-beach",
  "maui", "charleston", "park-city", "hilton-head", "ormond-beach", "new-smyrna-beach",
  "cozumel", "atlanta", "river-ranch",
];

let changes = 0;

for (const city of cities) {
  // Match either "city-slug": [  or  unquoted-key: [
  // Both variants appear in the config file
  const pattern1 = `"${city}": [`;
  const pattern2 = `${city}: [`;
  let startIdx = src.indexOf(pattern1);
  let tokenLen = pattern1.length;
  if (startIdx < 0) {
    startIdx = src.indexOf(pattern2);
    tokenLen = pattern2.length;
  }
  if (startIdx < 0) {
    console.log(`NO MATCH: ${city}`);
    continue;
  }
  const arrayStart = startIdx + tokenLen;

  // Find matching closing ]
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
  const toAdd = [...UNIVERSAL_NEW];
  if (MEXICO_CARIBBEAN.has(city)) toAdd.push("flight-and-hotel");

  const additions = toAdd.filter((mod) => !arrayContent.includes(`"${mod}"`));
  if (additions.length === 0) continue;

  const insertion = `\n    ${additions.map((a) => `"${a}"`).join(", ")},`;
  src = src.slice(0, i) + insertion + "\n  " + src.slice(i);
  changes += additions.length;
  console.log(`  ${city}: +${additions.length} (${additions.join(", ")})`);
}

writeFileSync(p, src);
console.log(`\nTotal modifier entries added: ${changes}`);

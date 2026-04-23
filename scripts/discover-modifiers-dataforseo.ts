/**
 * Query DataForSEO Keyword Ideas API to discover new sublander modifiers
 * per priority city. Outputs docs/MODIFIER-DISCOVERY.md with top-volume
 * modifier phrases and candidate additions to CITY_SUBLANDERS.
 *
 * Usage:
 *   DATAFORSEO_LOGIN=... DATAFORSEO_PASSWORD=... npx tsx scripts/discover-modifiers-dataforseo.ts
 *   npx tsx scripts/discover-modifiers-dataforseo.ts --limit=100
 *
 * Cost: DataForSEO bills per request. Keyword-suggestions endpoint is ~$0.01
 * per call. 21 priority cities = ~$0.21 per full run. Safe to run weekly.
 */

import { writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPORT_PATH = resolve(__dirname, "..", "docs", "MODIFIER-DISCOVERY.md");

const LIMIT_ARG = process.argv.find((a) => a.startsWith("--limit="));
const KEYWORD_LIMIT = LIMIT_ARG ? parseInt(LIMIT_ARG.split("=")[1], 10) : 50;

const login = process.env.DATAFORSEO_LOGIN;
const password = process.env.DATAFORSEO_PASSWORD;
if (!login || !password) {
  console.error("DATAFORSEO_LOGIN + DATAFORSEO_PASSWORD required in env");
  process.exit(1);
}
const auth = Buffer.from(`${login}:${password}`).toString("base64");

const CITIES = [
  { slug: "orlando", seed: "orlando vacation deals" },
  { slug: "las-vegas", seed: "las vegas vacation deals" },
  { slug: "gatlinburg", seed: "gatlinburg vacation deals" },
  { slug: "myrtle-beach", seed: "myrtle beach vacation deals" },
  { slug: "branson", seed: "branson vacation deals" },
  { slug: "williamsburg", seed: "williamsburg vacation deals" },
  { slug: "cocoa-beach", seed: "cocoa beach vacation deals" },
  { slug: "cancun", seed: "cancun vacation deals" },
  { slug: "cabo-san-lucas", seed: "cabo san lucas vacation deals" },
  { slug: "puerto-vallarta", seed: "puerto vallarta vacation deals" },
  { slug: "punta-cana", seed: "punta cana vacation deals" },
  { slug: "daytona-beach", seed: "daytona beach vacation deals" },
  { slug: "maui", seed: "maui vacation deals" },
  { slug: "charleston", seed: "charleston vacation deals" },
  { slug: "park-city", seed: "park city vacation deals" },
  { slug: "hilton-head", seed: "hilton head vacation deals" },
  { slug: "ormond-beach", seed: "ormond beach vacation deals" },
  { slug: "new-smyrna-beach", seed: "new smyrna beach vacation deals" },
  { slug: "cozumel", seed: "cozumel vacation deals" },
  { slug: "atlanta", seed: "atlanta vacation deals" },
  { slug: "river-ranch", seed: "river ranch vacation deals" },
];

// Words we already have modifiers for — use to skip duplicates
const EXISTING_MODIFIER_TOKENS = new Set([
  "families", "family", "couples", "seniors", "retirees", "solo", "groups",
  "bachelor", "bachelorette", "honeymoon", "wedding", "girls",
  "summer", "fall", "spring", "winter", "shoulder",
  "last-minute", "memorial", "july", "labor", "thanksgiving", "christmas", "new years",
  "under-99", "under-149", "under-199", "cheap", "luxury",
  "weekend", "2-night", "3-night", "4-night", "5-night",
  "all-inclusive", "all inclusive", "near disney", "near universal",
  "oceanfront", "waterpark", "ski-in", "ski out", "pet-friendly", "adults only",
  "near beach", "historic", "golf", "dude ranch", "beachfront", "snorkeling",
  "concert", "conference",
]);

interface KeywordSuggestion {
  keyword: string;
  searchVolume: number;
  cpc: number | null;
  competition: number | null;
}

async function fetchSuggestions(seedKeyword: string): Promise<KeywordSuggestion[]> {
  // DataForSEO Keywords Data: Google Ads — Keywords For Keywords (live)
  const body = JSON.stringify([
    {
      keywords: [seedKeyword],
      location_code: 2840, // United States
      language_code: "en",
      limit: KEYWORD_LIMIT,
      include_seed_keyword: false,
      include_serp_info: false,
    },
  ]);

  const res = await fetch("https://api.dataforseo.com/v3/keywords_data/google_ads/keywords_for_keywords/live", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Basic ${auth}` },
    body,
  });

  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  const data = await res.json();
  if (data.status_code !== 20000) {
    throw new Error(`DataForSEO error: ${data.status_message || JSON.stringify(data).slice(0, 200)}`);
  }

  const result = data.tasks?.[0]?.result;
  if (!result || !Array.isArray(result)) return [];

  return result
    .filter((r: { keyword?: string; search_volume?: number | null }) => r.keyword && r.search_volume != null && r.search_volume > 0)
    .map((r: { keyword: string; search_volume: number; cpc: number | null; competition: number | null }) => ({
      keyword: r.keyword,
      searchVolume: r.search_volume,
      cpc: r.cpc,
      competition: r.competition,
    }));
}

function extractModifier(keyword: string, cityName: string): string | null {
  // Strip the city name + common connector words to isolate the modifier
  const lower = keyword.toLowerCase();
  const cityLower = cityName.toLowerCase().replace(/-/g, " ");
  let modifier = lower
    .replace(cityLower, "")
    .replace(/\bvacation(s)?\b/g, "")
    .replace(/\bdeals?\b/g, "")
    .replace(/\bpackages?\b/g, "")
    .replace(/\btrip(s)?\b/g, "")
    .replace(/\bgetaway(s)?\b/g, "")
    .replace(/\bbest\b/g, "")
    .replace(/\bcheap(est)?\b/g, "cheap")
    .replace(/\bin\b/g, "")
    .replace(/\bfor\b/g, "for")
    .replace(/\bwith\b/g, "with")
    .replace(/\bto\b/g, "")
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (modifier.length < 3 || modifier.length > 40) return null;
  // Skip if it's a duplicate of existing
  for (const existing of EXISTING_MODIFIER_TOKENS) {
    if (modifier === existing || modifier.replace(/\s/g, "-") === existing) return null;
  }
  return modifier;
}

async function main() {
  console.log(`Querying DataForSEO for ${CITIES.length} cities, ${KEYWORD_LIMIT} keywords each...`);

  const report: string[] = [
    "# Modifier Discovery Report",
    "",
    `**Date:** ${new Date().toISOString()}`,
    `**Source:** DataForSEO Keywords Data (Google Ads / US / EN)`,
    "",
    "Suggested new sublander modifiers based on actual search volume. Each",
    "keyword was extracted from `{city} vacation deals` seed expansions, with",
    "existing modifiers (families, couples, summer, etc.) filtered out.",
    "",
    "Review candidates with volume ≥300 for potential addition to CITY_SUBLANDERS.",
    "",
    "---",
    "",
  ];

  const allCandidates: Array<{ city: string; modifier: string; volume: number; cpc: number | null }> = [];

  for (const city of CITIES) {
    try {
      console.log(`  [${city.slug}] querying...`);
      const suggestions = await fetchSuggestions(city.seed);

      const modifiers = suggestions
        .map((s) => ({ ...s, modifier: extractModifier(s.keyword, city.slug) }))
        .filter((s): s is KeywordSuggestion & { modifier: string } => s.modifier !== null && s.modifier !== "")
        .sort((a, b) => b.searchVolume - a.searchVolume)
        .slice(0, 15);

      report.push(`## ${city.slug}`);
      report.push("");
      report.push("| Candidate modifier | Volume | CPC | Raw query |");
      report.push("|---|---:|---:|---|");
      for (const m of modifiers) {
        report.push(`| \`${m.modifier}\` | ${m.searchVolume.toLocaleString()} | ${m.cpc != null ? `$${m.cpc.toFixed(2)}` : "—"} | ${m.keyword} |`);
        allCandidates.push({ city: city.slug, modifier: m.modifier, volume: m.searchVolume, cpc: m.cpc });
      }
      report.push("");

      // Small rate-limit pause
      await new Promise((r) => setTimeout(r, 200));
    } catch (e) {
      console.error(`  [${city.slug}] failed:`, (e as Error).message);
      report.push(`## ${city.slug}`);
      report.push("");
      report.push(`_API error: ${(e as Error).message}_`);
      report.push("");
    }
  }

  // Cross-city summary: modifiers that appear in multiple cities (prime candidates for universal modifiers)
  const modifierCityMap: Record<string, { cities: Set<string>; totalVolume: number }> = {};
  for (const c of allCandidates) {
    if (!modifierCityMap[c.modifier]) modifierCityMap[c.modifier] = { cities: new Set(), totalVolume: 0 };
    modifierCityMap[c.modifier].cities.add(c.city);
    modifierCityMap[c.modifier].totalVolume += c.volume;
  }
  const crossCity = Object.entries(modifierCityMap)
    .filter(([, v]) => v.cities.size >= 2)
    .sort((a, b) => b[1].totalVolume - a[1].totalVolume)
    .slice(0, 30);

  report.push("---");
  report.push("");
  report.push("## Cross-city modifier candidates (appear in 2+ city results)");
  report.push("");
  report.push("These are the strongest candidates for NEW universal modifiers in `packages/shared/src/sublanders.ts`:");
  report.push("");
  report.push("| Modifier | Cities | Total Volume |");
  report.push("|---|---:|---:|");
  for (const [modifier, info] of crossCity) {
    report.push(`| \`${modifier}\` | ${info.cities.size} (${[...info.cities].join(", ")}) | ${info.totalVolume.toLocaleString()} |`);
  }

  writeFileSync(REPORT_PATH, report.join("\n"));
  console.log(`\nDone. Report: ${REPORT_PATH}`);
  console.log(`Total candidates: ${allCandidates.length}`);
  console.log(`Cross-city candidates: ${crossCity.length}`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

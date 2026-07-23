/**
 * One-shot DataForSEO probe for the 2026-07 niche-page ideation.
 * Single search_volume request (~$0.05) for ~90 representative seed
 * keywords across the planned page categories. Writes JSON to
 * research/page-ideation-2026-07/keyword-probe.json.
 */
import fs from "node:fs";
import path from "node:path";

const login = process.env.DATAFORSEO_LOGIN;
const password = process.env.DATAFORSEO_PASSWORD;
if (!login || !password) {
  console.error("DATAFORSEO creds missing");
  process.exit(1);
}
const auth = Buffer.from(`${login}:${password}`).toString("base64");

const SEEDS = [
  // stats/data pages
  "average timeshare presentation length", "timeshare statistics 2026", "average cost of timeshare presentation gift",
  "how many people buy timeshares at presentations", "timeshare presentation success rate", "average vacation package price",
  "resort fee statistics", "average resort fee las vegas", "timeshare industry statistics",
  // requirements micro-answers
  "timeshare presentation income requirements", "timeshare presentation age requirements", "timeshare presentation married couple requirement",
  "can felons attend timeshare presentation", "timeshare presentation without spouse", "timeshare presentation self employed income",
  "timeshare presentation retired income", "do you need a credit card for timeshare presentation",
  // state law pages
  "timeshare rescission period by state", "florida timeshare cancellation law", "missouri timeshare cancellation law",
  "tennessee timeshare rescission", "nevada timeshare cancellation period", "south carolina timeshare laws",
  // fee databases
  "westgate resort fee", "hilton grand vacations resort fee", "orlando resort fees list", "las vegas resort fee list 2026",
  "gatlinburg resort parking fees", "resort fee comparison",
  // calculators
  "timeshare presentation worth it calculator", "vacation cost calculator family of 4", "timeshare vs hotel cost calculator",
  "vacation package savings calculator", "all inclusive vs pay as you go calculator",
  // brand x destination comparisons
  "westgate vs wyndham branson", "hilton grand vacations vs marriott vegas", "bluegreen vs capital vacations",
  "best timeshare presentation deal orlando", "cheapest timeshare presentation vegas",
  // fringe destination x audience
  "vacation deals for travel nurses", "vacation packages for military retirees", "timeshare presentation deals for teachers",
  "vacation deals cdl drivers", "vacation packages for pastors", "homeschool family vacation deals off season",
  "vacation deals for twins families", "single dad vacation deals", "vacation deals for veterans disability",
  // seasonal/event pegs
  "eclipse 2026 vacation packages", "branson christmas lights packages", "gatlinburg winterfest deals",
  "myrtle beach senior week deals", "orlando hurricane season hotel deals", "spring training vacation packages",
  // dealbuster/expose
  "timeshare presentation horror stories", "vacation package hidden fees", "timeshare exit scam warning signs",
  "fake vacation deal websites", "vacation club membership worth it",
  // glossary
  "what is a vacpack", "what is a timeshare preview package", "what does per couple mean vacation deal",
  "what is a resort credit", "timeshare float week meaning", "what is maintenance fee timeshare",
  "right to use vs deeded timeshare", "what is an owner update meeting",
  // micro destinations we have deals for
  "new smyrna beach timeshare promotions", "cocoa beach timeshare deals", "williamsburg timeshare presentation deals",
  "poconos timeshare deals", "wisconsin dells timeshare presentation", "hilton head timeshare preview",
  "massanutten timeshare presentation deal", "puerto plata vacation packages presentation",
  // long-tail commercial
  "vacation packages under 100 dollars", "99 dollar vacation packages orlando", "49 dollar vacation deals",
  "3 night vacation packages all inclusive", "last minute timeshare presentation deals", "timeshare deals no presentation",
];

async function main() {
  const res = await fetch("https://api.dataforseo.com/v3/keywords_data/google_ads/search_volume/live", {
    method: "POST",
    headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json" },
    body: JSON.stringify([{ keywords: SEEDS, location_code: 2840, language_code: "en" }]),
  });
  const data = await res.json();
  const items = data?.tasks?.[0]?.result || [];
  const out = items
    .map((r: any) => ({
      kw: r.keyword,
      vol: r.search_volume ?? 0,
      comp: r.competition ?? null,
      cpc: r.cpc ?? null,
    }))
    .sort((a: any, b: any) => (b.vol || 0) - (a.vol || 0));
  const dir = path.join(__dirname, "..", "research", "page-ideation-2026-07");
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "keyword-probe.json"), JSON.stringify(out, null, 2));
  console.log(`cost: ~$0.05, keywords: ${out.length}`);
  for (const r of out.slice(0, 40)) console.log(`${String(r.vol).padStart(7)}  ${r.comp ?? "-"}  ${r.kw}`);
  console.log("--- zero/near-zero volume (ultra-low comp candidates) ---");
  console.log(out.filter((r: any) => (r.vol || 0) < 30).map((r: any) => r.kw).join(" | "));
}
main().catch((e) => { console.error(e); process.exit(1); });

/**
 * Staggered scraper wave runner.
 *
 * Instead of running all 19+ scrapers every 6 hours in one batch, this splits
 * them into 5 waves based on deal volume, site weight, and update frequency:
 *
 *   Wave 1 (every 6h, :00):  Westgate, BookVIP, GetawayDealz — highest volume
 *   Wave 2 (every 6h, :15):  MRG, StayPromo, Wyndham, HGV — medium volume
 *   Wave 3 (every 12h, :30): Marriott, Holiday Inn, Spinnaker, Vacation Village — heavier sites
 *   Wave 4 (every 12h, 6:45/18:45): Departure Depot, Vegas Timeshare, Premier Travel, Discount Vacation, Legendary, Festiva
 *   Wave 5 (daily, 2:00 AM): Capital Vacations, Hyatt, Bluegreen, Westgate Events, GoVIP
 *
 * Usage:
 *   npx tsx src/scrape-wave.ts --wave=1
 *   npx tsx src/scrape-wave.ts --wave=all   (runs all waves sequentially)
 *
 * Cron schedule (replace the single 0 STAR/6 cron):
 *
 *   Wave 1: every 6 hours at :00
 *     0 STAR/6 * * * cd /var/www/vacationdeals && export $(cat .env | xargs) && pnpm --filter scraper tsx src/scrape-wave.ts --wave=1
 *   Wave 2: every 6 hours at :15
 *     15 STAR/6 * * * cd /var/www/vacationdeals && export $(cat .env | xargs) && pnpm --filter scraper tsx src/scrape-wave.ts --wave=2
 *   Wave 3: every 12 hours at :30
 *     30 STAR/12 * * * cd /var/www/vacationdeals && export $(cat .env | xargs) && pnpm --filter scraper tsx src/scrape-wave.ts --wave=3
 *   Wave 4: every 12 hours at 6:45, 18:45
 *     45 6,18 * * * cd /var/www/vacationdeals && export $(cat .env | xargs) && pnpm --filter scraper tsx src/scrape-wave.ts --wave=4
 *   Wave 5: daily at 2:00 AM
 *     0 2 * * * cd /var/www/vacationdeals && export $(cat .env | xargs) && pnpm --filter scraper tsx src/scrape-wave.ts --wave=5
 *
 * (Replace STAR with asterisk in actual crontab)
 */

import { deactivateExpiredDeals } from "./storage/deal-store";

// ── Crawler imports ─────────────────────────────────────────────────────────

import { runWestgateCrawler } from "./crawlers/westgate";
import { runBookvipCrawler } from "./crawlers/bookvip";
import { runGetawaydealzCrawler } from "./crawlers/getawaydealz";
import { runMrgCrawler } from "./crawlers/mrg";
import { runStayPromoCrawler } from "./crawlers/staypromo";
import { runWyndhamCrawler } from "./crawlers/wyndham";
import { runHgvCrawler } from "./crawlers/hgv";
import { runMarriottCrawler } from "./crawlers/marriott";
import { runHolidayInnCrawler } from "./crawlers/holiday-inn";
import { runSpinnakerCrawler } from "./crawlers/spinnaker";
import { runVacationVillageCrawler } from "./crawlers/vacation-village";
import { runDepartureDepotCrawler } from "./crawlers/departure-depot";
import { runVegasTimeshareCrawler } from "./crawlers/vegas-timeshare";
import { runPremierTravelCrawler } from "./crawlers/premier-travel";
import { runFestivaCrawler } from "./crawlers/festiva";
import { runDiscountVacationCrawler } from "./crawlers/discount-vacation";
import { runLegendaryCrawler } from "./crawlers/legendary";
import { runHyattCrawler } from "./crawlers/hyatt";
import { runCapitalVacationsCrawler } from "./crawlers/capital-vacations";
import { runBluegreenCrawler } from "./crawlers/bluegreen";
import { runWestgateEventsCrawler } from "./crawlers/westgate-events";
import { runGovipCrawler } from "./crawlers/govip";
import { runElCidCrawler } from "./crawlers/el-cid";
import { runPuebloBtonitoCrawler } from "./crawlers/pueblo-bonito";
import { runDiviCrawler } from "./crawlers/divi";
import { runBahiaPrincipeCrawler } from "./crawlers/bahia-principe";
import { runTaferCrawler } from "./crawlers/tafer";
import { runVillaGroupCrawler } from "./crawlers/villa-group";
import { runSheratonVcCrawler } from "./crawlers/sheraton-vc";
import { runWestinVcCrawler } from "./crawlers/westin-vc";
import { runVacationvipCrawler } from "./crawlers/vacationvip";
import { runBestvacationdealzCrawler } from "./crawlers/bestvacationdealz";
import { runMonsterVacationsCrawler } from "./crawlers/monster-vacations";
import { runTimesharePresentationDealsCrawler } from "./crawlers/timeshare-presentation-deals";
import { runAllInclusivePromotionsCrawler } from "./crawlers/all-inclusive-promotions";
import { runExploriaCrawler } from "./crawlers/exploria";
import { runMassannutenCrawler } from "./crawlers/massanutten";
import { runIWantToTravelToCrawler } from "./crawlers/iwanttotravelto";
import { runVacationOfferCrawler } from "./crawlers/vacation-offer";
import { runMargaritavilleCrawler } from "./crawlers/margaritaville";

// ── Wave definitions ────────────────────────────────────────────────────────

const CRAWLERS: Record<string, () => Promise<void>> = {
  westgate: runWestgateCrawler,
  bookvip: runBookvipCrawler,
  getawaydealz: runGetawaydealzCrawler,
  mrg: runMrgCrawler,
  staypromo: runStayPromoCrawler,
  wyndham: runWyndhamCrawler,
  hgv: runHgvCrawler,
  marriott: runMarriottCrawler,
  "holiday-inn": runHolidayInnCrawler,
  spinnaker: runSpinnakerCrawler,
  "vacation-village": runVacationVillageCrawler,
  "departure-depot": runDepartureDepotCrawler,
  "vegas-timeshare": runVegasTimeshareCrawler,
  "premier-travel": runPremierTravelCrawler,
  festiva: runFestivaCrawler,
  "discount-vacation": runDiscountVacationCrawler,
  legendary: runLegendaryCrawler,
  hyatt: runHyattCrawler,
  "capital-vacations": runCapitalVacationsCrawler,
  bluegreen: runBluegreenCrawler,
  "westgate-events": runWestgateEventsCrawler,
  govip: runGovipCrawler,
  "el-cid": runElCidCrawler,
  "pueblo-bonito": runPuebloBtonitoCrawler,
  divi: runDiviCrawler,
  "bahia-principe": runBahiaPrincipeCrawler,
  tafer: runTaferCrawler,
  "villa-group": runVillaGroupCrawler,
  "sheraton-vc": runSheratonVcCrawler,
  "westin-vc": runWestinVcCrawler,
  vacationvip: runVacationvipCrawler,
  bestvacationdealz: runBestvacationdealzCrawler,
  "monster-vacations": runMonsterVacationsCrawler,
  "timeshare-presentation-deals": runTimesharePresentationDealsCrawler,
  "all-inclusive-promotions": runAllInclusivePromotionsCrawler,
  exploria: runExploriaCrawler,
  massanutten: runMassannutenCrawler,
  iwanttotravelto: runIWantToTravelToCrawler,
  "vacation-offer": runVacationOfferCrawler,
  margaritaville: runMargaritavilleCrawler,
};

const WAVES: Record<number, string[]> = {
  1: ["westgate", "bookvip", "getawaydealz"],
  2: ["mrg", "staypromo", "wyndham", "hgv"],
  3: ["marriott", "holiday-inn", "spinnaker", "vacation-village"],
  4: ["departure-depot", "vegas-timeshare", "premier-travel", "discount-vacation", "legendary", "festiva"],
  5: ["capital-vacations", "hyatt", "bluegreen", "westgate-events", "govip", "el-cid", "pueblo-bonito", "divi", "bahia-principe", "tafer", "villa-group", "sheraton-vc", "westin-vc", "vacationvip", "bestvacationdealz", "monster-vacations", "timeshare-presentation-deals", "all-inclusive-promotions", "exploria", "massanutten", "iwanttotravelto", "vacation-offer", "margaritaville"],
};

// ── Runner ──────────────────────────────────────────────────────────────────

async function runWave(waveNumber: number) {
  const sources = WAVES[waveNumber];
  if (!sources) {
    console.error(`Unknown wave: ${waveNumber}`);
    console.error(`Available waves: ${Object.keys(WAVES).join(", ")}`);
    process.exit(1);
  }

  console.log(`\n=== Wave ${waveNumber}: ${sources.join(", ")} ===\n`);
  const startTime = Date.now();
  let succeeded = 0;
  let failed = 0;

  for (const source of sources) {
    const crawler = CRAWLERS[source];
    if (!crawler) {
      console.error(`[wave${waveNumber}] No crawler found for: ${source}`);
      failed++;
      continue;
    }

    console.log(`\n--- ${source} ---`);
    const crawlerStart = Date.now();

    try {
      await crawler();
      const elapsed = ((Date.now() - crawlerStart) / 1000).toFixed(1);
      console.log(`[${source}] Completed in ${elapsed}s`);
      succeeded++;
    } catch (err) {
      const elapsed = ((Date.now() - crawlerStart) / 1000).toFixed(1);
      console.error(`[${source}] Failed after ${elapsed}s:`, err);
      failed++;
    }
  }

  const totalElapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(
    `\n=== Wave ${waveNumber} complete: ${succeeded} succeeded, ${failed} failed (${totalElapsed}s) ===\n`
  );
}

async function main() {
  const waveArg = process.argv.find((arg) => arg.startsWith("--wave="));
  const waveValue = waveArg?.split("=")[1];

  if (!waveValue) {
    console.error("Usage: tsx src/scrape-wave.ts --wave=<1-5|all>");
    console.error("  --wave=1    High-volume scrapers (Westgate, BookVIP, GetawayDealz)");
    console.error("  --wave=2    Medium-volume scrapers (MRG, StayPromo, Wyndham, HGV)");
    console.error("  --wave=3    Heavy sites (Marriott, Holiday Inn, Spinnaker, Vacation Village)");
    console.error("  --wave=4    Newer scrapers (Departure Depot, Vegas Timeshare, Premier Travel, Festiva)");
    console.error("  --wave=5    Low-frequency (Bluegreen, Westgate Events, GoVIP)");
    console.error("  --wave=all  Run all waves sequentially");
    process.exit(1);
  }

  // Deactivate expired deals before any scraping
  console.log("Deactivating deals past their expiration date...");
  try {
    await deactivateExpiredDeals();
  } catch (err) {
    console.error("Failed to deactivate expired deals:", err);
  }

  if (waveValue === "all") {
    for (const waveNum of Object.keys(WAVES).map(Number)) {
      await runWave(waveNum);
    }
  } else {
    const waveNum = parseInt(waveValue, 10);
    if (isNaN(waveNum)) {
      console.error(`Invalid wave number: ${waveValue}`);
      process.exit(1);
    }
    await runWave(waveNum);
  }

  console.log("\nAll done!");
  process.exit(0);
}

main();

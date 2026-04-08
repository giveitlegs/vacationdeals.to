import { runWestgateCrawler } from "./crawlers/westgate";
import { runBookvipCrawler } from "./crawlers/bookvip";
import { runGetawaydealzCrawler } from "./crawlers/getawaydealz";
import { runMrgCrawler } from "./crawlers/mrg";
import { runWestgateEventsCrawler } from "./crawlers/westgate-events";
import { runHgvCrawler } from "./crawlers/hgv";
import { runWyndhamCrawler } from "./crawlers/wyndham";
import { runHolidayInnCrawler } from "./crawlers/holiday-inn";
import { runMarriottCrawler } from "./crawlers/marriott";
import { runGovipCrawler } from "./crawlers/govip";
import { runStayPromoCrawler } from "./crawlers/staypromo";
import { runVacationVillageCrawler } from "./crawlers/vacation-village";
import { runSpinnakerCrawler } from "./crawlers/spinnaker";
import { runDepartureDepotCrawler } from "./crawlers/departure-depot";
import { runVegasTimeshareCrawler } from "./crawlers/vegas-timeshare";
import { runPremierTravelCrawler } from "./crawlers/premier-travel";
import { runDiscountVacationCrawler } from "./crawlers/discount-vacation";
import { runLegendaryCrawler } from "./crawlers/legendary";
import { runFestivaCrawler } from "./crawlers/festiva";
import { runHyattCrawler } from "./crawlers/hyatt";
import { runCapitalVacationsCrawler } from "./crawlers/capital-vacations";
import { runBluegreenCrawler } from "./crawlers/bluegreen";
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
import { deactivateExpiredDeals, getRunStats } from "./storage/deal-store";
import { db } from "@vacationdeals/db";
import { scrapeRuns, sources } from "@vacationdeals/db";
import { eq } from "drizzle-orm";

async function logScrapeRun(scraperKey: string, runFn: () => Promise<void>) {
  const startedAt = new Date();
  const statsBefore = await getRunStats(scraperKey);

  // Create run record
  let runId: number | null = null;
  try {
    const source = await db.query.sources.findFirst({
      where: eq(sources.scraperKey, scraperKey),
    });
    const [run] = await db.insert(scrapeRuns).values({
      sourceId: source?.id ?? null,
      scraperKey,
      startedAt,
      status: "running",
    }).returning();
    runId = run.id;
  } catch (e) {
    console.warn(`[scrape-run] Could not log start for ${scraperKey}:`, e);
  }

  try {
    await runFn();
    const statsAfter = await getRunStats(scraperKey);
    const dealsStored = (statsAfter?.dealCount ?? 0) - (statsBefore?.dealCount ?? 0);

    if (runId) {
      await db.update(scrapeRuns).set({
        finishedAt: new Date(),
        dealsFound: statsAfter?.dealCount ?? 0,
        dealsStored: Math.max(0, dealsStored),
        status: "success",
      }).where(eq(scrapeRuns.id, runId));
    }
  } catch (err) {
    if (runId) {
      await db.update(scrapeRuns).set({
        finishedAt: new Date(),
        status: "failed",
        errorMessage: String(err),
      }).where(eq(scrapeRuns.id, runId)).catch(() => {});
    }
    throw err;
  }
}

const crawlers: Record<string, () => Promise<void>> = {
  westgate: runWestgateCrawler,
  bookvip: runBookvipCrawler,
  getawaydealz: runGetawaydealzCrawler,
  mrg: runMrgCrawler,
  "westgate-events": runWestgateEventsCrawler,
  hgv: runHgvCrawler,
  wyndham: runWyndhamCrawler,
  "holiday-inn": runHolidayInnCrawler,
  marriott: runMarriottCrawler,
  govip: runGovipCrawler,
  staypromo: runStayPromoCrawler,
  "vacation-village": runVacationVillageCrawler,
  spinnaker: runSpinnakerCrawler,
  "departure-depot": runDepartureDepotCrawler,
  "vegas-timeshare": runVegasTimeshareCrawler,
  "premier-travel": runPremierTravelCrawler,
  "discount-vacation": runDiscountVacationCrawler,
  legendary: runLegendaryCrawler,
  festiva: runFestivaCrawler,
  hyatt: runHyattCrawler,
  "capital-vacations": runCapitalVacationsCrawler,
  bluegreen: runBluegreenCrawler,
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
};

async function main() {
  const sourceArg = process.argv.find((arg) => arg.startsWith("--source="));
  const sourceKey = sourceArg?.split("=")[1];

  // Deactivate deals whose expiresAt date has passed before scraping
  console.log("Deactivating deals past their expiration date...");
  try {
    await deactivateExpiredDeals();
  } catch (err) {
    console.error("Failed to deactivate expired deals:", err);
  }

  if (sourceKey) {
    const crawler = crawlers[sourceKey];
    if (!crawler) {
      console.error(`Unknown source: ${sourceKey}`);
      console.error(`Available: ${Object.keys(crawlers).join(", ")}`);
      process.exit(1);
    }
    console.log(`Running ${sourceKey} crawler...`);
    await logScrapeRun(sourceKey, crawler);
  } else {
    console.log("Running all crawlers...");
    for (const [name, crawler] of Object.entries(crawlers)) {
      console.log(`\n--- ${name} ---`);
      try {
        await logScrapeRun(name, crawler);
      } catch (err) {
        console.error(`${name} crawler failed:`, err);
      }
    }
  }

  console.log("\nAll done!");
  process.exit(0);
}

main();

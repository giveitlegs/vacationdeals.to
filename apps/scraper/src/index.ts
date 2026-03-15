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
};

async function main() {
  const sourceArg = process.argv.find((arg) => arg.startsWith("--source="));
  const sourceKey = sourceArg?.split("=")[1];

  if (sourceKey) {
    const crawler = crawlers[sourceKey];
    if (!crawler) {
      console.error(`Unknown source: ${sourceKey}`);
      console.error(`Available: ${Object.keys(crawlers).join(", ")}`);
      process.exit(1);
    }
    console.log(`Running ${sourceKey} crawler...`);
    await crawler();
  } else {
    console.log("Running all crawlers...");
    for (const [name, crawler] of Object.entries(crawlers)) {
      console.log(`\n--- ${name} ---`);
      try {
        await crawler();
      } catch (err) {
        console.error(`${name} crawler failed:`, err);
      }
    }
  }

  console.log("\nAll done!");
  process.exit(0);
}

main();

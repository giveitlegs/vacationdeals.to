import { runWestgateCrawler } from "./crawlers/westgate";
import { runBookvipCrawler } from "./crawlers/bookvip";
import { runGetawaydealzCrawler } from "./crawlers/getawaydealz";
import { runMrgCrawler } from "./crawlers/mrg";
import { runWestgateEventsCrawler } from "./crawlers/westgate-events";

const crawlers: Record<string, () => Promise<void>> = {
  westgate: runWestgateCrawler,
  bookvip: runBookvipCrawler,
  getawaydealz: runGetawaydealzCrawler,
  mrg: runMrgCrawler,
  "westgate-events": runWestgateEventsCrawler,
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

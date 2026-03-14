import { CheerioCrawler } from "crawlee";
import { storeDeal } from "../storage/deal-store.js";
import type { ScrapedDeal } from "@vacationdeals/shared";

export async function runBookvipCrawler() {
  const crawler = new CheerioCrawler({
    maxRequestsPerCrawl: 100,
    async requestHandler({ request, $, log }) {
      log.info(`Scraping ${request.url}`);

      // TODO: Implement BookVIP parsing logic
      // BookVIP has deal cards with price, duration, destination, savings %
      // Schema.org markup may provide structured data

      log.info("BookVIP crawler: parser not yet implemented");
    },
  });

  await crawler.run(["https://bookvip.com"]);
}

import { CheerioCrawler } from "crawlee";
import { storeDeal } from "../storage/deal-store.js";
import type { ScrapedDeal } from "@vacationdeals/shared";

export async function runWestgateCrawler() {
  const crawler = new CheerioCrawler({
    maxRequestsPerCrawl: 50,
    async requestHandler({ request, $, log }) {
      log.info(`Scraping ${request.url}`);

      // TODO: Implement Westgate-specific parsing logic
      // Westgate uses Angular.js with JSON data in the page
      // Look for window.__data or similar JSON payloads
      // Parse resort catalog, seasonal pricing, availability

      log.info("Westgate crawler: parser not yet implemented");
    },
  });

  await crawler.run(["https://westgatereservations.com"]);
}

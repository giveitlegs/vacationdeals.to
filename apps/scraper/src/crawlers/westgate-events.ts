import { PlaywrightCrawler } from "crawlee";
import { storeDeal } from "../storage/deal-store.js";
import type { ScrapedDeal } from "@vacationdeals/shared";

export async function runWestgateEventsCrawler() {
  // Westgate Events uses AJAX-based pagination - needs browser rendering
  const crawler = new PlaywrightCrawler({
    maxRequestsPerCrawl: 50,
    async requestHandler({ request, page, log }) {
      log.info(`Scraping ${request.url}`);

      // Event cards in Bootstrap grid (.col-lg-3, .col-lg-4)
      // Main content: #event-results
      // Filter sidebar: .listing-sidebar
      // AJAX pagination: .ajax-paging
      // Includes concerts, sports, comedy, theme parks, cruises

      log.info("Westgate Events crawler: parser not yet implemented");
    },
  });

  await crawler.run(["https://westgateevents.com"]);
}

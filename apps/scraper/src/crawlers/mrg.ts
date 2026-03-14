import { CheerioCrawler } from "crawlee";
import { storeDeal } from "../storage/deal-store.js";
import type { ScrapedDeal } from "@vacationdeals/shared";

export async function runMrgCrawler() {
  const crawler = new CheerioCrawler({
    maxRequestsPerCrawl: 100,
    async requestHandler({ request, $, log }) {
      log.info(`Scraping ${request.url}`);

      // MRG uses WordPress + Elementor + JetEngine listing grid
      // Deal cards are in .jet-listing-dynamic-post-* elements
      // Look for destination name, price, duration, and image
      // Filter system uses travel type, party size, duration (3-7 nights)

      log.info("MRG crawler: parser not yet implemented");
    },
  });

  await crawler.run(["https://mrgvacationpackages.com"]);
}

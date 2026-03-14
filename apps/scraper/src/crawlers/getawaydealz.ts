import { CheerioCrawler } from "crawlee";
import { storeDeal } from "../storage/deal-store.js";
import type { ScrapedDeal } from "@vacationdeals/shared";

export async function runGetawaydealzCrawler() {
  const crawler = new CheerioCrawler({
    maxRequestsPerCrawl: 50,
    async requestHandler({ request, $, log }) {
      log.info(`Scraping ${request.url}`);

      // TODO: Implement GetawayDealz parsing logic
      // React SPA with serialized JSON state
      // Contains pricing matrices, nightly rates, guest configs

      log.info("GetawayDealz crawler: parser not yet implemented");
    },
  });

  await crawler.run(["https://getawaydealz.com"]);
}

import { CheerioCrawler } from "crawlee";
import { storeDeal } from "../storage/deal-store";

const SOURCE_KEY = "orlando99";
const BASE_URL = "https://orlando99.com";

// Single-deal site: Westgate Town Center Orlando 3-night $99 preview package.
// Homepage is the only deal page; everything else is a blog.
export async function runOrlando99Crawler() {
  const crawler = new CheerioCrawler({
    maxRequestsPerCrawl: 2,
    requestHandlerTimeoutSecs: 30,
    async requestHandler({ request, $, log }) {
      log.info(`Processing ${request.url}`);

      // Headline price always appears as "$99" with the resort name "Westgate Town Center"
      // in h1.hotel-title (the resort name) or first <h1>.
      const headline =
        $("h1.hotel-title").first().text().replace(/\s+/g, " ").trim() ||
        $("h1").first().text().replace(/\s+/g, " ").trim();
      const bodyText = $("body").text();
      const priceMatch = bodyText.match(/\$\s*99\b/);
      if (!priceMatch || !headline) {
        log.warning("Could not extract headline price");
        return;
      }

      const nightsMatch = bodyText.match(/(\d+)\s*nights?/i);
      const nights = nightsMatch ? parseInt(nightsMatch[1], 10) : 3;

      storeDeal(
        {
          title: `${headline} — Orlando 3-Night Preview Package`,
          price: 99,
          durationNights: nights,
          durationDays: nights + 1,
          city: "Orlando",
          state: "FL",
          country: "US",
          brandSlug: SOURCE_KEY,
          url: BASE_URL,
          resortName: headline,
          inclusions: ["Resort accommodations"],
          presentationMinutes: 120,
        },
        SOURCE_KEY,
      );
      log.info(`Stored: ${headline} ($99)`);
    },
  });

  await crawler.run([BASE_URL]);
}

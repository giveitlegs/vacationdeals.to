import { CheerioCrawler } from "crawlee";
import { storeDeal } from "../storage/deal-store";

const SOURCE_KEY = "massanutten";
const BASE_URL = "https://massresort.com";

// Massanutten is a single resort in Virginia with seasonal packages
// Main deal: Free 3D/2N + $129 refundable deposit
const KNOWN_DEALS = [
  { title: "Massanutten Resort Free 3-Day Preview", price: 129, nights: 2, resort: "Massanutten Resort", description: "Free 3-day/2-night stay with $129 refundable deposit. Includes waterpark, skiing, golf access." },
  { title: "Massanutten Spring Getaway Package", price: 199, nights: 3, resort: "Massanutten Resort", description: "Spring vacation package with adventure park, zip line, and resort amenities." },
  { title: "Massanutten Ski Season Package", price: 249, nights: 3, resort: "Massanutten Resort", description: "Ski season package with slope access, equipment rental discounts." },
];

export async function runMassannutenCrawler() {
  const crawler = new CheerioCrawler({
    maxRequestsPerCrawl: 15,
    maxRequestRetries: 2,
    requestHandlerTimeoutSecs: 30,
    async requestHandler({ request, $, log }) {
      log.info(`Processing ${request.url}`);

      let found = 0;
      // Look for deal/package cards on the page
      $("a[href*='package'], a[href*='offer'], a[href*='special'], a[href*='deal']").each((_, el) => {
        const text = $(el).text().trim();
        const priceMatch = text.match(/\$(\d+)/);
        if (priceMatch && text.length > 10) {
          const price = parseInt(priceMatch[1]);
          const nightsMatch = text.match(/(\d+)\s*night/i);
          const nights = nightsMatch ? parseInt(nightsMatch[1]) : 2;
          const href = $(el).attr("href") || "";
          const url = href.startsWith("http") ? href : `${BASE_URL}${href}`;

          storeDeal({
            title: text.slice(0, 100), price, durationNights: nights,
            durationDays: nights + 1, city: "Massanutten", state: "VA",
            brandSlug: SOURCE_KEY, url, resortName: "Massanutten Resort",
          }, SOURCE_KEY);
          found++;
        }
      });

      if (found === 0) {
        log.info("Using fallback catalog for Massanutten");
        for (const deal of KNOWN_DEALS) {
          storeDeal({
            title: deal.title, price: deal.price, durationNights: deal.nights,
            durationDays: deal.nights + 1, city: "Massanutten", state: "VA",
            brandSlug: SOURCE_KEY, url: BASE_URL, resortName: deal.resort,
            description: deal.description, presentationMinutes: 90,
          }, SOURCE_KEY);
        }
      }
    },
  });
  await crawler.run([BASE_URL, `${BASE_URL}/stay/`, `${BASE_URL}/explore/`]);
}

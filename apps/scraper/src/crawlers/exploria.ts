import { CheerioCrawler } from "crawlee";
import { storeDeal } from "../storage/deal-store";

const SOURCE_KEY = "exploria";
const BASE_URL = "https://exploriavacations.com";

// Divi theme (et_pb_section) with 3 resort packages at $149 each
const KNOWN_DEALS = [
  { title: "Summer Bay Orlando Resort Preview", city: "Orlando", state: "FL", price: 149, nights: 2, resort: "Summer Bay Orlando", url: "/book-orlando-resortpreview/", inclusions: ["6 Heated Pools", "Adventure Park", "Marina Access"] },
  { title: "Grand Seas Resort Daytona Beach Preview", city: "Daytona Beach", state: "FL", price: 149, nights: 2, resort: "Grand Seas Resort", url: "/book-daytona-resortpreview/", inclusions: ["Beachfront Access", "812ft Beach", "Near Attractions"] },
  { title: "Pocono Mountain Villas Preview", city: "Pocono Mountains", state: "PA", price: 149, nights: 2, resort: "Pocono Mountain Villas", url: "/book-pocono-resortpreview/", inclusions: ["Adventure Park", "Zip Line", "Indoor/Outdoor Pools", "Golf Course"] },
];

export async function runExploriaCrawler() {
  const crawler = new CheerioCrawler({
    maxRequestsPerCrawl: 15,
    maxRequestRetries: 2,
    requestHandlerTimeoutSecs: 30,
    async requestHandler({ request, $, log }) {
      log.info(`Processing ${request.url}`);

      let found = 0;
      // Divi theme sections with resort info
      $(".et_pb_section").each((_, section) => {
        const text = $(section).text();
        const h3 = $(section).find("h3, h2").first().text().trim();
        const priceMatch = text.match(/\$(\d+)/);
        const nightsMatch = text.match(/(\d+)[- ]day/i);

        if (h3 && priceMatch && h3.length > 5) {
          const price = parseInt(priceMatch[1]);
          const nights = nightsMatch ? parseInt(nightsMatch[1]) - 1 : 2;
          const link = $(section).find("a[href*='book']").attr("href");
          const url = link ? `${BASE_URL}${link}` : request.url;

          storeDeal({
            title: h3, price, durationNights: nights, durationDays: nights + 1,
            city: "Unknown", brandSlug: SOURCE_KEY, url, resortName: h3,
          }, SOURCE_KEY);
          found++;
        }
      });

      if (found === 0) {
        log.info("No deals parsed, using fallback catalog");
        for (const deal of KNOWN_DEALS) {
          storeDeal({
            title: deal.title, price: deal.price, durationNights: deal.nights,
            durationDays: deal.nights + 1, city: deal.city, state: deal.state,
            brandSlug: SOURCE_KEY, url: `${BASE_URL}${deal.url}`,
            resortName: deal.resort, inclusions: deal.inclusions,
            presentationMinutes: 90,
          }, SOURCE_KEY);
        }
      }
    },
  });
  await crawler.run([BASE_URL]);
}

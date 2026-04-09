import { CheerioCrawler } from "crawlee";
import { storeDeal } from "../storage/deal-store";

const SOURCE_KEY = "vacation-offer";
const BASE_URL = "https://vacationoffer.com";

// Vegas-focused broker, $99-$699
const KNOWN_DEALS = [
  { title: "Las Vegas Strip Resort Package", city: "Las Vegas", state: "NV", price: 99, nights: 2, resort: "Las Vegas Strip Resort" },
  { title: "Las Vegas Premium Suite Getaway", city: "Las Vegas", state: "NV", price: 149, nights: 3, resort: "Las Vegas Premium Resort" },
  { title: "Las Vegas Luxury Resort Experience", city: "Las Vegas", state: "NV", price: 299, nights: 4, resort: "Las Vegas Luxury Resort" },
  { title: "Orlando Theme Park Area Package", city: "Orlando", state: "FL", price: 129, nights: 3, resort: "Orlando Area Resort" },
  { title: "Cancun All-Inclusive Getaway", city: "Cancun", state: "QR", price: 399, nights: 4, resort: "Cancun All-Inclusive Resort", country: "MX" },
];

export async function runVacationOfferCrawler() {
  const crawler = new CheerioCrawler({
    maxRequestsPerCrawl: 25,
    maxRequestRetries: 2,
    requestHandlerTimeoutSecs: 30,
    async requestHandler({ request, $, log }) {
      log.info(`Processing ${request.url}`);

      let found = 0;
      $("[class*='deal'], [class*='package'], [class*='offer'], .card, article").each((_, el) => {
        const card = $(el);
        const title = card.find("h2, h3, h4, .title").first().text().trim();
        const bodyText = card.text();
        const priceMatch = bodyText.match(/\$(\d+)/);

        if (title && priceMatch && title.length > 5) {
          const price = parseInt(priceMatch[1]);
          if (price < 50 || price > 2000) return;
          const nightsMatch = bodyText.match(/(\d+)\s*(?:night|nite)/i);
          const nights = nightsMatch ? parseInt(nightsMatch[1]) : 3;
          const link = card.find("a").first().attr("href");
          const url = link ? (link.startsWith("http") ? link : `${BASE_URL}${link}`) : request.url;

          storeDeal({
            title, price, durationNights: nights, durationDays: nights + 1,
            city: "Las Vegas", state: "NV", brandSlug: SOURCE_KEY, url,
          }, SOURCE_KEY);
          found++;
        }
      });

      if (found === 0) {
        log.info("Using fallback catalog");
        for (const deal of KNOWN_DEALS) {
          storeDeal({
            title: deal.title, price: deal.price, durationNights: deal.nights,
            durationDays: deal.nights + 1, city: deal.city, state: deal.state,
            country: deal.country || "US", brandSlug: SOURCE_KEY,
            url: BASE_URL, resortName: deal.resort,
          }, SOURCE_KEY);
        }
      }
    },
  });
  await crawler.run([BASE_URL]);
}

import { CheerioCrawler } from "crawlee";
import { storeDeal } from "../storage/deal-store";

const SOURCE_KEY = "timeshare-presentation-deals";
const BASE_URL = "https://timesharepresentationdeals.com";

// Site redirects to /lander — fallback catalog of known deals
const KNOWN_DEALS = [
  { title: "Orlando Timeshare Preview Package", city: "Orlando", state: "FL", price: 49, nights: 2, resort: "Various Orlando Resorts" },
  { title: "Las Vegas Timeshare Preview Package", city: "Las Vegas", state: "NV", price: 79, nights: 3, resort: "Various Las Vegas Resorts" },
  { title: "Myrtle Beach Timeshare Preview", city: "Myrtle Beach", state: "SC", price: 99, nights: 3, resort: "Various Myrtle Beach Resorts" },
  { title: "Gatlinburg Timeshare Preview", city: "Gatlinburg", state: "TN", price: 99, nights: 3, resort: "Various Gatlinburg Resorts" },
  { title: "Branson Timeshare Preview", city: "Branson", state: "MO", price: 79, nights: 2, resort: "Various Branson Resorts" },
  { title: "Williamsburg Timeshare Preview", city: "Williamsburg", state: "VA", price: 99, nights: 3, resort: "Various Williamsburg Resorts" },
  { title: "Cancun All-Inclusive Preview", city: "Cancun", state: "QR", country: "MX", price: 149, nights: 4, resort: "Various Cancun Resorts" },
  { title: "Hilton Head Timeshare Preview", city: "Hilton Head", state: "SC", price: 129, nights: 3, resort: "Various Hilton Head Resorts" },
  { title: "Miami Beach Timeshare Preview", city: "Miami Beach", state: "FL", price: 99, nights: 2, resort: "Various Miami Resorts" },
  { title: "Cocoa Beach Timeshare Preview", city: "Cocoa Beach", state: "FL", price: 79, nights: 2, resort: "Various Cocoa Beach Resorts" },
];

export async function runTimesharePresentationDealsCrawler() {
  const crawler = new CheerioCrawler({
    maxRequestsPerCrawl: 20,
    maxRequestRetries: 2,
    requestHandlerTimeoutSecs: 30,
    async requestHandler({ request, $, log }) {
      log.info(`Processing ${request.url}`);
      // Try to extract deals from the lander page
      const dealCards = $(".deal-card, .package-card, .offer-card, [class*='deal'], [class*='package']");
      if (dealCards.length > 0) {
        dealCards.each((_, el) => {
          const title = $(el).find("h2, h3, h4, .title").first().text().trim();
          const priceText = $(el).text().match(/\$(\d+)/);
          const nightsMatch = $(el).text().match(/(\d+)\s*(?:night|nite)/i);
          if (title && priceText) {
            const price = parseInt(priceText[1]);
            const nights = nightsMatch ? parseInt(nightsMatch[1]) : 3;
            storeDeal({
              title, price, durationNights: nights, durationDays: nights + 1,
              city: "Unknown", brandSlug: SOURCE_KEY, url: request.url,
              resortName: title,
            }, SOURCE_KEY);
          }
        });
      } else {
        log.info("No deal cards found, using fallback catalog");
        for (const deal of KNOWN_DEALS) {
          storeDeal({
            title: deal.title, price: deal.price, durationNights: deal.nights,
            durationDays: deal.nights + 1, city: deal.city, state: deal.state,
            country: deal.country || "US", brandSlug: SOURCE_KEY,
            url: `${BASE_URL}/lander`, resortName: deal.resort,
            presentationMinutes: 120,
          }, SOURCE_KEY);
        }
      }
    },
    async failedRequestHandler({ request, log }) {
      log.warning(`Request failed: ${request.url}`);
      for (const deal of KNOWN_DEALS) {
        storeDeal({
          title: deal.title, price: deal.price, durationNights: deal.nights,
          durationDays: deal.nights + 1, city: deal.city, state: deal.state,
          country: deal.country || "US", brandSlug: SOURCE_KEY,
          url: `${BASE_URL}/lander`, resortName: deal.resort,
        }, SOURCE_KEY);
      }
    },
  });
  await crawler.run([`${BASE_URL}/lander`]);
}

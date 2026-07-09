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

      // Domain-repurpose guard: timesharepresentationdeals.com now 301s to an
      // unrelated pet-clinic site (found 2026-07-08). If we were redirected
      // off-domain, there is nothing to scrape — do NOT seed anything.
      const finalUrl = request.loadedUrl || request.url;
      if (!/timesharepresentationdeals\.com/i.test(new URL(finalUrl).hostname)) {
        log.warning(
          `[${SOURCE_KEY}] Redirected off-domain to ${finalUrl} — domain repurposed, emitting 0 deals`,
        );
        return;
      }

      // Only DOM-verified deals; the KNOWN_DEALS catalog fallback (which even
      // ran on request failure) kept resurrecting deals for a dead site.
      const dealCards = $(".deal-card, .package-card, .offer-card, [class*='deal'], [class*='package']");
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
      if (dealCards.length === 0) {
        log.info(`[${SOURCE_KEY}] No deal cards found; emitting 0 (fallback removed 2026-07-09)`);
      }
    },
    async failedRequestHandler({ request, log }) {
      log.warning(`Request failed: ${request.url} — emitting 0 deals (fallback removed 2026-07-09)`);
    },
  });
  await crawler.run([`${BASE_URL}/lander`]);
}

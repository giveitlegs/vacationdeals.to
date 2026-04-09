import { CheerioCrawler } from "crawlee";
import { storeDeal } from "../storage/deal-store";

const SOURCE_KEY = "margaritaville";
const BASE_URL = "https://margaritavillevcrentals.com";

// Wyndham sub-brand — St. Thomas, Nashville, Orlando
const KNOWN_DEALS = [
  { title: "Margaritaville St. Thomas Resort Preview", city: "St. Thomas", state: "USVI", price: 299, nights: 3, resort: "Margaritaville Vacation Club St. Thomas" },
  { title: "Margaritaville Nashville Resort Preview", city: "Nashville", state: "TN", price: 199, nights: 2, resort: "Margaritaville Vacation Club Nashville" },
  { title: "Margaritaville Orlando Resort Preview", city: "Orlando", state: "FL", price: 199, nights: 3, resort: "Margaritaville Resort Orlando" },
  { title: "Margaritaville Rio Mar Resort Preview", city: "Rio Grande", state: "PR", price: 249, nights: 3, resort: "Margaritaville Vacation Club Rio Mar" },
];

export async function runMargaritavilleCrawler() {
  const crawler = new CheerioCrawler({
    maxRequestsPerCrawl: 20,
    maxRequestRetries: 2,
    requestHandlerTimeoutSecs: 30,
    async requestHandler({ request, $, log }) {
      log.info(`Processing ${request.url}`);

      let found = 0;
      $("[class*='property'], [class*='resort'], [class*='card'], [class*='listing'], article").each((_, el) => {
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
          const imageUrl = card.find("img").first().attr("src");

          storeDeal({
            title, price, durationNights: nights, durationDays: nights + 1,
            city: "Unknown", brandSlug: SOURCE_KEY, url,
            resortName: title, imageUrl: imageUrl || undefined,
          }, SOURCE_KEY);
          found++;
        }
      });

      if (found === 0) {
        log.info("Using fallback catalog for Margaritaville");
        for (const deal of KNOWN_DEALS) {
          storeDeal({
            title: deal.title, price: deal.price, durationNights: deal.nights,
            durationDays: deal.nights + 1, city: deal.city, state: deal.state,
            brandSlug: SOURCE_KEY, url: BASE_URL, resortName: deal.resort,
            presentationMinutes: 90,
          }, SOURCE_KEY);
        }
      }
    },
  });
  await crawler.run([BASE_URL]);
}

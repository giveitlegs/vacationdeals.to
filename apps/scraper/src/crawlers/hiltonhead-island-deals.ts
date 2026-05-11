import { CheerioCrawler } from "crawlee";
import { storeDeal } from "../storage/deal-store";

// hiltonheadislanddeals.com — Palmera Vacation Club's customer-facing HHI
// preview-package broker. Each hotel card has a name in .robo-header div
// and a price phrase "Packages from $XXX" in an <h6>.
const SOURCE_KEY = "hiltonhead-island-deals";
const BASE_URL = "https://hiltonheadislanddeals.com";

export async function runHiltonheadIslandDealsCrawler() {
  const crawler = new CheerioCrawler({
    maxRequestsPerCrawl: 5,
    maxRequestRetries: 2,
    requestHandlerTimeoutSecs: 30,
    async requestHandler({ request, $, log }) {
      log.info(`Processing ${request.url}`);

      // Each hotel card is a .hotel-name block containing the name in
      // .robo-header. We anchor on .hotel-name (one per hotel) instead of
      // .robo-header (which also appears inside package-description headers).
      const headers = $(".hotel-name");
      log.info(`Found ${headers.length} hotel cards`);
      let stored = 0;

      headers.each((_, el) => {
        const headerEl = $(el);
        const hotelName = headerEl.find(".robo-header").first().text().trim().replace(/\s+/g, " ")
          || headerEl.text().trim().replace(/\s+/g, " ");
        if (!hotelName) return;

        // The price block "Packages from $XXX" lives in a sibling after the
        // .hotel-name div, all inside the same .boxed wrapper.
        const card = headerEl.closest(".boxed, .hotel, .hotel-card, div.full, .listing").first();
        const block = card.length ? card : headerEl.parent().parent();
        const blockText = block.text();

        const priceMatch = blockText.match(/Packages?\s*(?:from\s*)?\$([\d,]+)/i);
        if (!priceMatch) {
          // Fallback: first $XXX in block text where XXX >= 50.
          const prices = Array.from(blockText.matchAll(/\$([\d,]+)/g))
            .map((m) => parseInt(m[1].replace(/,/g, ""), 10))
            .filter((n) => Number.isFinite(n) && n >= 50 && n <= 999);
          if (!prices.length) return;
          var price = Math.min(...prices);
        } else {
          var price = parseInt(priceMatch[1].replace(/,/g, ""), 10);
        }
        if (!Number.isFinite(price) || price < 50) return;

        const bookHref = block.find('a.btn-hv, a[href*="hotel.php"]').first().attr("href") || "/";
        const url = bookHref.startsWith("http") ? bookHref : `${BASE_URL}${bookHref}`;

        const imageUrl = block.find("img").first().attr("src");

        storeDeal(
          {
            title: `${hotelName} — Hilton Head Island Preview Package`,
            price,
            durationNights: 3,
            durationDays: 4,
            city: "Hilton Head Island",
            state: "SC",
            country: "US",
            brandSlug: SOURCE_KEY,
            url,
            resortName: hotelName,
            imageUrl: imageUrl
              ? imageUrl.startsWith("http") ? imageUrl : `${BASE_URL}${imageUrl}`
              : undefined,
            inclusions: ["$100 Visa gift card", "Palmera Vacation Club preview tour required"],
            presentationMinutes: 90,
          },
          SOURCE_KEY,
        );
        stored += 1;
      });

      log.info(`Stored ${stored} deals`);
    },
  });

  await crawler.run([BASE_URL]);
}

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

      // Each hotel card has a .robo-header containing the hotel name.
      const headers = $(".robo-header");
      log.info(`Found ${headers.length} hotel cards`);
      let stored = 0;

      headers.each((_, el) => {
        const headerEl = $(el);
        const hotelName = headerEl.text().trim().replace(/\s+/g, " ");
        if (!hotelName) return;

        // Walk forward to find the price <h6>...Packages from $XXX</h6>.
        const card = headerEl.closest("div").first();
        const block = card.length ? card : headerEl.parent();
        const blockText = block.text();

        const priceMatch = blockText.match(/Packages?\s*(?:from\s*)?\$([\d,]+)/i);
        if (!priceMatch) {
          log.debug(`Skipping "${hotelName}" — no price`);
          return;
        }
        const price = parseInt(priceMatch[1].replace(/,/g, ""), 10);
        if (!Number.isFinite(price) || price < 50) return;

        // Booking URL: <a class="btn-hv orange-bg" href="/hotel.php?id=...">
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

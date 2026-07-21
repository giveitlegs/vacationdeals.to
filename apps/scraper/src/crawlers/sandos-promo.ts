import { CheerioCrawler } from "crawlee";
import { storeDeal } from "../storage/deal-store";

const SOURCE_KEY = "sandos-promo";
const BASE_URL = "https://sandospromo.com";

// sandospromo.com is a Hugo site (verified 2026-07-20) whose homepage renders
// one .hp-resort-card per Sandos property with clean class hooks:
//   .hp-resort-name     — "Sandos Finisterra"
//   .hp-resort-location — "Cabo San Lucas" / "Cancun Hotel Zone" / "Playa del Carmen"
//   .hp-resort-price    — "$555 <span>/ 3 nights</span>"
//   .hp-resort-retail   — "Hotels.com: $1,950*"  (comparison rate)
//   .hp-resort-ribbon   — "SAVE 73%"
// Packages are all-inclusive for 2 adults + 2 kids in exchange for a Royal
// Elite (Sandos' in-house club) presentation. All properties are in Mexico.
const LOCATIONS: Record<string, string> = {
  "cancun hotel zone": "Cancun",
  cancun: "Cancun",
  "cabo san lucas": "Cabo San Lucas",
  "playa del carmen": "Playa del Carmen",
};

export async function runSandosPromoCrawler() {
  const crawler = new CheerioCrawler({
    maxRequestsPerCrawl: 3,
    maxRequestRetries: 2,
    requestHandlerTimeoutSecs: 30,
    async requestHandler({ request, $, log }) {
      log.info(`Processing ${request.url}`);

      const cards = $(".hp-resort-card");
      log.info(`Found ${cards.length} resort cards`);
      let stored = 0;

      cards.each((_, el) => {
        const card = $(el);
        const resortName = card.find(".hp-resort-name").first().text().replace(/\s+/g, " ").trim();
        if (!resortName) return;

        const priceText = card.find(".hp-resort-price").first().text();
        const priceMatch = priceText.match(/\$([\d,]+)/);
        const price = priceMatch ? parseInt(priceMatch[1].replace(/,/g, ""), 10) : NaN;
        if (!Number.isFinite(price) || price < 39 || price > 5000) {
          log.warning(`Skipping "${resortName}" — no valid price in "${priceText.trim()}"`);
          return;
        }

        const nightsMatch = priceText.match(/(\d+)\s*nights?/i);
        const nights = nightsMatch ? parseInt(nightsMatch[1], 10) : 3;

        const locText = card.find(".hp-resort-location").first().text().trim();
        const city = LOCATIONS[locText.toLowerCase()] ?? locText;
        if (!city) return;

        const retailMatch = card.find(".hp-resort-retail").first().text().match(/\$([\d,]+)/);
        const originalPrice = retailMatch
          ? parseInt(retailMatch[1].replace(/,/g, ""), 10)
          : undefined;
        const savingsMatch = card.find(".hp-resort-ribbon").first().text().match(/(\d+)\s*%/);

        const href = card.find("a.hp-resort-btn").first().attr("href");
        const url = href
          ? href.startsWith("http")
            ? href
            : `${BASE_URL}${href}`
          : `${BASE_URL}/#${resortName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;

        const imageUrl = card.find("img.hp-resort-img").first().attr("src");

        storeDeal(
          {
            title: `${resortName} ${city} — ${nights} Night All-Inclusive Promo Package`,
            price,
            originalPrice: originalPrice && originalPrice > price ? originalPrice : undefined,
            savingsPercent: savingsMatch ? parseInt(savingsMatch[1], 10) : undefined,
            durationNights: nights,
            durationDays: nights + 1,
            city,
            country: "MX",
            brandSlug: SOURCE_KEY,
            url,
            resortName,
            imageUrl: imageUrl
              ? imageUrl.startsWith("http")
                ? imageUrl
                : `${BASE_URL}${imageUrl}`
              : undefined,
            inclusions: [
              "All-inclusive for 2 adults + 2 kids",
              "Buffet meals and resort bars",
              "One a la carte dinner each evening",
            ],
            presentationMinutes: 120,
            requirements: ["Attend a 90-120 minute Royal Elite presentation"],
          },
          SOURCE_KEY,
        );
        stored++;
      });

      if (stored === 0) {
        log.warning(`[${SOURCE_KEY}] 0 resort cards yielded deals — storing nothing`);
      } else {
        log.info(`[${SOURCE_KEY}] Stored ${stored} deals`);
      }
    },
  });

  await crawler.run([BASE_URL]);
}

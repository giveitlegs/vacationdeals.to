import { CheerioCrawler } from "crawlee";
import { storeDeal } from "../storage/deal-store";

const SOURCE_KEY = "all-inclusive-promotions";
const BASE_URL = "https://allinclusivepromotions.com";

// UIKit grid-based site with uk-card elements
export async function runAllInclusivePromotionsCrawler() {
  const crawler = new CheerioCrawler({
    maxRequestsPerCrawl: 30,
    maxRequestRetries: 2,
    requestHandlerTimeoutSecs: 30,
    async requestHandler({ request, $, log }) {
      log.info(`Processing ${request.url}`);

      // Extract deals from uk-card elements
      $(".uk-card, [class*='card']").each((_, el) => {
        const card = $(el);
        const title = card.find("h3, h2, .uk-card-title").first().text().trim();
        const bodyText = card.text();
        const priceMatch = bodyText.match(/\$(\d+)/);
        const nightsMatch = bodyText.match(/(\d+)\s*night/i) || bodyText.match(/(\d+)\s*days?\s*\/?\s*(\d+)\s*night/i);

        if (title && priceMatch) {
          const price = parseInt(priceMatch[1]);
          const nights = nightsMatch ? parseInt(nightsMatch[1]) - 1 || 4 : 4;
          const imageUrl = card.find("img").attr("src") || card.find("[data-src]").attr("data-src");
          const link = card.find("a").attr("href");
          const url = link ? (link.startsWith("http") ? link : `${BASE_URL}${link}`) : request.url;

          // Detect destination from title
          const destMap: Record<string, { city: string; state: string; country: string }> = {
            "punta cana": { city: "Punta Cana", state: "La Altagracia", country: "DO" },
            cancun: { city: "Cancun", state: "QR", country: "MX" },
            "cabo": { city: "Cabo San Lucas", state: "BCS", country: "MX" },
            "puerto vallarta": { city: "Puerto Vallarta", state: "JA", country: "MX" },
            jamaica: { city: "Montego Bay", state: "", country: "JM" },
            aruba: { city: "Oranjestad", state: "", country: "AW" },
            "costa rica": { city: "Costa Rica", state: "", country: "CR" },
            "curaçao": { city: "Willemstad", state: "", country: "CW" },
            curacao: { city: "Willemstad", state: "", country: "CW" },
          };

          let dest = { city: title, state: "", country: "US" };
          for (const [key, val] of Object.entries(destMap)) {
            if (title.toLowerCase().includes(key)) { dest = val; break; }
          }

          storeDeal({
            title: `${title} All-Inclusive Vacation Package`,
            price, durationNights: nights, durationDays: nights + 1,
            city: dest.city, state: dest.state, country: dest.country,
            brandSlug: SOURCE_KEY, url, resortName: title,
            imageUrl: imageUrl || undefined,
            inclusions: ["All-Inclusive Resort", "Meals & Drinks Included"],
            presentationMinutes: 90,
          }, SOURCE_KEY);
        }
      });

      // Enqueue destination pages
      $("a[href*='/destination'], a[href*='/package'], a[href*='/resort']").each((_, el) => {
        const href = $(el).attr("href");
        if (href) {
          const fullUrl = href.startsWith("http") ? href : `${BASE_URL}${href}`;
          crawler.addRequests([fullUrl]);
        }
      });
    },
  });
  await crawler.run([BASE_URL]);
}

import { CheerioCrawler } from "crawlee";
import { storeDeal } from "../storage/deal-store";

const SOURCE_KEY = "iwanttotravelto";
const BASE_URL = "https://iwanttotravelto.com";

// Blog-style MRG affiliate site with vacation deal articles
export async function runIWantToTravelToCrawler() {
  const crawler = new CheerioCrawler({
    maxRequestsPerCrawl: 40,
    maxRequestRetries: 2,
    requestHandlerTimeoutSecs: 30,
    async requestHandler({ request, $, log }) {
      log.info(`Processing ${request.url}`);

      // Blog post deal extraction
      $("article, .post, .entry, [class*='post'], [class*='deal']").each((_, el) => {
        const card = $(el);
        const title = card.find("h2, h3, h1, .entry-title").first().text().trim();
        const bodyText = card.text();
        const priceMatch = bodyText.match(/\$(\d+)/);
        const nightsMatch = bodyText.match(/(\d+)\s*(?:night|nite)/i) || bodyText.match(/(\d+)\s*days?\s*[\/&]\s*(\d+)\s*night/i);

        if (title && priceMatch && title.length > 5) {
          const price = parseInt(priceMatch[1]);
          if (price < 10 || price > 2000) return; // Skip non-deal prices
          const nights = nightsMatch ? parseInt(nightsMatch[nightsMatch.length > 2 ? 2 : 1]) : 3;
          const link = card.find("a").first().attr("href");
          const url = link || request.url;
          const imageUrl = card.find("img").first().attr("src");

          // Detect destination from title
          const cityPatterns: Record<string, { city: string; state: string }> = {
            orlando: { city: "Orlando", state: "FL" },
            "las vegas": { city: "Las Vegas", state: "NV" },
            cancun: { city: "Cancun", state: "QR" },
            gatlinburg: { city: "Gatlinburg", state: "TN" },
            branson: { city: "Branson", state: "MO" },
            "myrtle beach": { city: "Myrtle Beach", state: "SC" },
            williamsburg: { city: "Williamsburg", state: "VA" },
            miami: { city: "Miami", state: "FL" },
          };

          let dest = { city: "Various", state: "" };
          for (const [key, val] of Object.entries(cityPatterns)) {
            if (title.toLowerCase().includes(key) || bodyText.toLowerCase().includes(key)) {
              dest = val; break;
            }
          }

          storeDeal({
            title, price, durationNights: nights, durationDays: nights + 1,
            city: dest.city, state: dest.state, brandSlug: SOURCE_KEY,
            url, imageUrl: imageUrl || undefined,
          }, SOURCE_KEY);
        }
      });

      // Enqueue linked pages
      $("a[href]").each((_, el) => {
        const href = $(el).attr("href") || "";
        if (href.startsWith(BASE_URL) && !href.includes("#") && !href.includes("?")) {
          crawler.addRequests([href]);
        }
      });
    },
  });
  await crawler.run([BASE_URL]);
}

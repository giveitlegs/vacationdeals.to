import { CheerioCrawler } from "crawlee";
import { storeDeal } from "../storage/deal-store";

const SOURCE_KEY = "all-inclusive-promotions";
const BASE_URL = "https://www.allinclusivepromotions.com";

// Each destination card on the index page is an <a class="uk-card ..."> with
// a real /destination-...-promotions href. Title sits in h3.el-title and the
// price phrase ("From $479") lives in the .el-meta line right after.
export async function runAllInclusivePromotionsCrawler() {
  const crawler = new CheerioCrawler({
    maxRequestsPerCrawl: 5,
    maxRequestRetries: 2,
    requestHandlerTimeoutSecs: 30,
    async requestHandler({ request, $, log }) {
      log.info(`Processing ${request.url}`);

      const cards = $("a.uk-card");
      log.info(`Found ${cards.length} card anchors`);
      let stored = 0;

      cards.each((_, el) => {
        const card = $(el);
        const title = card.find("h3.el-title").first().text().trim();
        if (!title) return;

        const meta = card.find(".el-meta").first().text();
        const body = `${meta} ${card.text()}`;

        const priceCandidates = Array.from(body.matchAll(/\$([\d,]+)/g))
          .map((m) => parseInt(m[1].replace(/,/g, ""), 10))
          .filter((n) => Number.isFinite(n) && n >= 50);
        const price = priceCandidates.length ? Math.min(...priceCandidates) : NaN;
        if (!Number.isFinite(price)) {
          log.warning(`Skipping "${title}" — no valid price`);
          return;
        }

        const nightsMatch = body.match(/(\d+)\s*nights?/i) || body.match(/(\d+)\s*days?/i);
        const nights = nightsMatch ? parseInt(nightsMatch[1], 10) : 4;

        const destMap: Record<string, { city: string; state: string; country: string }> = {
          "punta cana": { city: "Punta Cana", state: "La Altagracia", country: "DO" },
          cancun: { city: "Cancun", state: "QR", country: "MX" },
          "cabo san lucas": { city: "Cabo San Lucas", state: "BCS", country: "MX" },
          cabo: { city: "Cabo San Lucas", state: "BCS", country: "MX" },
          "puerto vallarta": { city: "Puerto Vallarta", state: "JA", country: "MX" },
          jamaica: { city: "Montego Bay", state: "", country: "JM" },
          aruba: { city: "Oranjestad", state: "", country: "AW" },
          "costa rica": { city: "Costa Rica", state: "", country: "CR" },
          "curaçao": { city: "Willemstad", state: "", country: "CW" },
          curacao: { city: "Willemstad", state: "", country: "CW" },
          loreto: { city: "Loreto", state: "BCS", country: "MX" },
        };

        let dest = { city: "Various", state: "", country: "MX" };
        for (const [key, val] of Object.entries(destMap)) {
          if (title.toLowerCase().includes(key)) {
            dest = val;
            break;
          }
        }

        const href = card.attr("href") || "";
        const url = href
          ? href.startsWith("http")
            ? href
            : `${BASE_URL}${href.startsWith("/") ? "" : "/"}${href}`
          : `${BASE_URL}/`;

        const imageUrl =
          card.find("img").first().attr("src") ||
          card.find("[data-src]").first().attr("data-src");

        storeDeal(
          {
            title: `${title} All-Inclusive Vacation Package`,
            price,
            durationNights: nights,
            durationDays: nights + 1,
            city: dest.city,
            state: dest.state,
            country: dest.country,
            brandSlug: SOURCE_KEY,
            url,
            resortName: title,
            imageUrl: imageUrl || undefined,
            inclusions: ["All-Inclusive Resort", "Meals & Drinks Included"],
            presentationMinutes: 90,
          },
          SOURCE_KEY,
        );
        stored += 1;
      });

      log.info(`Stored ${stored} deals from index page`);
    },
  });

  await crawler.run([BASE_URL]);
}

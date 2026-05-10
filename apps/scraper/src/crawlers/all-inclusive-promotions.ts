import { CheerioCrawler } from "crawlee";
import { storeDeal } from "../storage/deal-store";

const SOURCE_KEY = "all-inclusive-promotions";
const BASE_URL = "https://www.allinclusivepromotions.com";

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

// Single-page card grid. Each card has an h3.el-title.uk-card-title and a
// price like "$479" or "$1,408". The page has no per-card detail URLs, so
// we mint a deterministic url-fragment per destination to keep the unique
// constraint on deals.url happy.
export async function runAllInclusivePromotionsCrawler() {
  const crawler = new CheerioCrawler({
    maxRequestsPerCrawl: 5,
    maxRequestRetries: 2,
    requestHandlerTimeoutSecs: 30,
    async requestHandler({ request, $, log }) {
      log.info(`Processing ${request.url}`);

      const titles = $("h3.el-title.uk-card-title");
      log.info(`Found ${titles.length} destination cards`);

      titles.each((_, el) => {
        const titleEl = $(el);
        const title = titleEl.text().trim();
        if (!title) return;

        // The card body sits in the parent's parent (UIKit el-* nesting).
        // Walk up two ancestors to capture the price.
        const card = titleEl.closest(".uk-card, .el-item, [class*='card']").first();
        const bodyText = (card.length ? card : titleEl.parent().parent()).text();

        const priceCandidates = Array.from(bodyText.matchAll(/\$([\d,]+)/g))
          .map((m) => parseInt(m[1].replace(/,/g, ""), 10))
          .filter((n) => Number.isFinite(n) && n >= 50);
        const price = priceCandidates.length ? Math.max(...priceCandidates) : NaN;
        if (!Number.isFinite(price)) {
          log.warning(`Skipping "${title}" — no valid price`);
          return;
        }

        const nightsMatch = bodyText.match(/(\d+)\s*nights?/i);
        const nights = nightsMatch ? parseInt(nightsMatch[1], 10) : 4;

        // Destination from title
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

        // No per-destination URLs exist on the source — synthesize a unique
        // fragment so each destination gets its own row in deals.url.
        const url = `${BASE_URL}/#${slugify(title)}`;

        const imageUrl = card.find("img").first().attr("src") || card.find("[data-src]").first().attr("data-src");

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
      });
    },
  });

  await crawler.run([BASE_URL]);
}

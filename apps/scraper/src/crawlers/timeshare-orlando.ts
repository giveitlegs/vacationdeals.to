import { CheerioCrawler } from "crawlee";
import { storeDeal } from "../storage/deal-store";

const SOURCE_KEY = "timeshare-orlando";
const BASE_URL = "https://timeshareorlando.com";

// Sister site of timesharevacationpackages.com (same FL ST35208 operator),
// Orlando-only. Same DOM shape as TVP destination pages.
export async function runTimeshareOrlandoCrawler() {
  const crawler = new CheerioCrawler({
    maxRequestsPerCrawl: 5,
    maxRequestRetries: 2,
    requestHandlerTimeoutSecs: 30,
    async requestHandler({ request, $, log }) {
      log.info(`Processing ${request.url}`);

      const titles = $("h3.el-title.uk-h4");
      log.info(`Found ${titles.length} resort cards`);
      let stored = 0;

      titles.each((_, el) => {
        const titleEl = $(el);
        const resortName = titleEl.text().replace(/\s+/g, " ").trim();
        if (!resortName) return;

        const card = titleEl.closest("li, .el-item, .uk-grid > div, .uk-card").first();
        const container = card.length ? card : titleEl.parent().parent();

        let priceText = "";
        container.find("h2").each((__, h) => {
          const t = $(h).text();
          if (/\$[\d,]+\s*PER\s+FAMILY/i.test(t) && !priceText) priceText = t;
        });
        const priceMatch = priceText.match(/\$([\d,]+)/);
        const price = priceMatch ? parseInt(priceMatch[1].replace(/,/g, ""), 10) : NaN;
        if (!Number.isFinite(price) || price < 50) {
          log.warning(`Skipping "${resortName}" — no valid price`);
          return;
        }

        const giftMatch = container.text().match(/\$(\d+)\s*(?:Visa|gift card|cash card)/i);
        const giftCard = giftMatch ? `$${giftMatch[1]} Visa gift card` : null;

        const url = `${BASE_URL}/#${resortName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
        const imageUrl = container.find("img").first().attr("src");

        storeDeal(
          {
            title: `${resortName} — Orlando Timeshare Preview Package`,
            price,
            durationNights: 3,
            durationDays: 4,
            city: "Orlando",
            state: "FL",
            country: "US",
            brandSlug: SOURCE_KEY,
            url,
            resortName,
            imageUrl: imageUrl ? (imageUrl.startsWith("http") ? imageUrl : `${BASE_URL}${imageUrl}`) : undefined,
            inclusions: giftCard ? [giftCard, "Resort accommodations"] : ["Resort accommodations"],
            presentationMinutes: 120,
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

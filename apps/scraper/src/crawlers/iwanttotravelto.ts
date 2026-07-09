import { CheerioCrawler } from "crawlee";
import { storeDeal } from "../storage/deal-store";

const SOURCE_KEY = "iwanttotravelto";
const BASE_URL = "https://iwanttotravelto.com";
const DEALS_URL = `${BASE_URL}/deals/`;

// iwanttotravelto.com is a Hugo blog whose ONLY structured price inventory
// lives in the tables on /deals/ (rediscovered 2026-07-09):
//   - Flash-sales table: | Destination | $price | N nights | inclusions |
//   - Main table:        | Destination(link) | From $price | resorts |
// Earlier versions crawled blog articles and extracted incidental dollar
// amounts ("Things to Do in..." posts, a stray $2,000) — never do that.
// Main-table packages are the standard 4-night / 5-day vacpack per the
// page copy; flash rows carry their own nights column.
const DEFAULT_NIGHTS = 4;

function parseCityState(text: string): { city: string; state?: string } {
  const m = text.match(/^(.+?),\s*([A-Z]{2})$/);
  if (m) return { city: m[1].trim(), state: m[2] };
  return { city: text.trim() };
}

function anchor(city: string, price: number): string {
  return `${city}-${price}`.toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

export async function runIWantToTravelToCrawler() {
  const crawler = new CheerioCrawler({
    maxRequestsPerCrawl: 5,
    maxRequestRetries: 2,
    requestHandlerTimeoutSecs: 30,
    async requestHandler({ request, $, log }) {
      log.info(`Processing ${request.url}`);
      let stored = 0;

      $("table tbody tr").each((_, tr) => {
        const cells = $(tr).find("td");
        if (cells.length < 2) return;

        const destText = cells.eq(0).text().trim();
        const priceText = cells.eq(1).text().trim();
        const priceMatch = priceText.match(/\$([\d,]+)/);
        if (!destText || !priceMatch) return;

        const price = parseInt(priceMatch[1].replace(/,/g, ""), 10);
        if (!Number.isFinite(price) || price < 49 || price > 1500) return;

        // Nights: flash table has "4 nights" in col 3; main table doesn't.
        const nightsMatch = cells.eq(2).text().match(/(\d+)\s*nights?/i);
        const nights = nightsMatch ? parseInt(nightsMatch[1], 10) : DEFAULT_NIGHTS;

        // Inclusions/resorts from the remaining cell.
        const extraText = cells.eq(cells.length - 1).text().trim();
        const isFlash = Boolean(nightsMatch);

        const { city, state } = parseCityState(destText);
        if (!city || city.length < 3) return;

        storeDeal(
          {
            title: `${destText} Vacation Package — ${nights} Nights from $${price}`,
            price,
            durationNights: nights,
            durationDays: nights + 1,
            city,
            state,
            brandSlug: SOURCE_KEY,
            // Row-unique fragment: deal-store upserts match on url.
            url: `${DEALS_URL}#${anchor(city, price)}`,
            resortName: !isFlash && extraText && extraText !== "Resort TBD" ? extraText : undefined,
            inclusions: isFlash && extraText ? [extraText] : undefined,
            presentationMinutes: 120,
            requirements: ["Attend 90-120 minute resort presentation", "$150 refundable deposit"],
          },
          SOURCE_KEY,
        );
        stored++;
      });

      log.info(`[${SOURCE_KEY}] Stored ${stored} table-row deals from ${request.url}`);
    },
  });
  await crawler.run([DEALS_URL]);
}

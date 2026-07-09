import { CheerioCrawler } from "crawlee";
import { storeDeal } from "../storage/deal-store";

const SOURCE_KEY = "exploria";
const BASE_URL = "https://www.exploriavacations.com";

// Exploria moved its preview packages to Shopify-style product pages on
// exploriavacations.com (rediscovered 2026-07-09; the old
// /book-<city>-resortpreview URLs 404). All three offers are a $49 refundable
// reservation deposit for 3 days / 2 nights with a 60-minute "Owner Update".
// The catalog below is the fallback when the product page yields no price.
const PRODUCTS = [
  {
    path: "/products/orlando-magical",
    title: "Orlando Magical Getaway — 3 Day / 2 Night Resort Preview",
    city: "Orlando",
    state: "FL",
    resort: "Summer Bay Orlando",
    fallbackPrice: 49,
    inclusions: ["1BR condo sleeps 4", "60-minute Owner Update presentation", "$49 refundable reservation deposit"],
  },
  {
    path: "/products/daytona-beach",
    title: "Grand Seas Daytona Beach — 3 Day / 2 Night Resort Preview",
    city: "Daytona Beach",
    state: "FL",
    resort: "Grand Seas by Exploria",
    fallbackPrice: 49,
    inclusions: ["1BR condo sleeps 4", "60-minute Owner Update presentation", "$49 refundable reservation deposit"],
  },
  {
    path: "/products/pocono-mountain",
    title: "Pocono Mountain Getaway — 3 Day / 2 Night Resort Preview",
    city: "Pocono Mountains",
    state: "PA",
    resort: "Pocono Mountain Villas",
    fallbackPrice: 49,
    inclusions: ["1BR condo sleeps 4", "60-minute Owner Update presentation", "$50 prepaid Mastercard bonus"],
  },
];

export async function runExploriaCrawler() {
  const crawler = new CheerioCrawler({
    maxRequestsPerCrawl: 10,
    maxRequestRetries: 2,
    requestHandlerTimeoutSecs: 30,
    async requestHandler({ request, $, log }) {
      const product = PRODUCTS.find((p) => request.url.includes(p.path));
      if (!product) return;

      // Shopify product pages carry the price in meta tags and body text.
      // Prefer the live figure; fall back to the known $49 deposit.
      let price: number | null = null;
      const metaPrice =
        $("meta[property='og:price:amount']").attr("content") ||
        $("meta[itemprop='price']").attr("content") ||
        "";
      const metaParsed = parseFloat(metaPrice.replace(/[^0-9.]/g, ""));
      if (Number.isFinite(metaParsed) && metaParsed >= 25 && metaParsed <= 500) {
        price = Math.round(metaParsed);
      }
      if (!price) {
        const bodyMatch = $("body")
          .text()
          .match(/\$\s?(\d{2,3})(?:\.\d{2})?\s*(?:refundable|deposit|per)/i);
        if (bodyMatch) {
          const p = parseInt(bodyMatch[1], 10);
          if (p >= 25 && p <= 500) price = p;
        }
      }
      if (!price) {
        log.info(`No live price on ${request.url}, using catalog $${product.fallbackPrice}`);
        price = product.fallbackPrice;
      }

      storeDeal(
        {
          title: product.title,
          price,
          durationNights: 2,
          durationDays: 3,
          city: product.city,
          state: product.state,
          brandSlug: SOURCE_KEY,
          url: `${BASE_URL}${product.path}`,
          resortName: product.resort,
          inclusions: product.inclusions,
          presentationMinutes: 60,
        },
        SOURCE_KEY,
      );
      log.info(`Stored ${product.title} @ $${price}`);
    },
  });
  await crawler.run(PRODUCTS.map((p) => `${BASE_URL}${p.path}`));
}

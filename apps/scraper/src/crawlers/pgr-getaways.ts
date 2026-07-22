import { CheerioCrawler } from "crawlee";
import { storeDeal } from "../storage/deal-store";

const SOURCE_KEY = "pgr-getaways";
const BASE_URL = "https://pgrgetaways.com";
const PRODUCTS_JSON = `${BASE_URL}/products.json?limit=250`;

// PGR Getaways is a Shopify store (verified 2026-07-20: /products.json returns
// 122 products). Real vacpack inventory is the "N day N night <destination>
// FAM Trip from $X" products (product_type FAM-TRIP / Destination / ""). The
// catalog also contains ~66 single-"Hotel" entries at a flat $369 with
// mismatched copy-handles, cruises, bundles, and "Test Hotel" rows — all
// excluded by requiring the day/night title pattern. DOM(JSON)-verified only.
const DURATION_RE = /^(\d+)\s*day\s*(\d+)\s*night[s]?\s*/i;
// Trailing marketing boilerplate to strip after the destination.
const TAIL_RE = /\s*[-–*]*\s*(?:\*?\s*ALL\s*INCLUSIVE\s*)?(?:FAM[- ]?TRIP|Familiarization\s+Trip|Resort\s+Preview\s+Trip|from\s*\$[\d,]+).*$/i;

// Region text after the comma in titles → state code or country.
const REGIONS: Record<string, { state?: string; country?: string }> = {
  florida: { state: "FL" },
  "south carolina": { state: "SC" },
  virginia: { state: "VA" },
  arizona: { state: "AZ" },
  missouri: { state: "MO" },
  tennessee: { state: "TN" },
  tenneesee: { state: "TN" }, // site's own typo ("Gatlinburg, ... Tenneesee")
  "smoky mountains": { state: "TN" },
  mexico: { country: "MX" },
  "dominican republic": { country: "DO" },
};

// Comma-less titles whose destination we can still place.
const CITIES: Record<string, { city: string; state?: string; country?: string }> = {
  orlando: { city: "Orlando", state: "FL" },
  "las vegas": { city: "Las Vegas", state: "NV" },
  "miami beach": { city: "Miami Beach", state: "FL" },
  "destin beach": { city: "Destin", state: "FL" },
  "cayman islands": { city: "Cayman Islands", country: "KY" },
  "grand bahamas island": { city: "Grand Bahama Island", country: "BS" },
  "poconos mountain": { city: "Pocono Mountains", state: "PA" },
  "cabo san lucas": { city: "Cabo San Lucas", country: "MX" },
};

interface ShopifyProduct {
  title: string;
  handle: string;
  product_type: string;
  variants?: { price?: string; compare_at_price?: string | null }[];
  images?: { src?: string }[];
}

function parseDestination(rest: string): { city: string; state?: string; country?: string } | null {
  const cleaned = rest.replace(TAIL_RE, "").replace(/\s+/g, " ").trim().replace(/[,–-]+$/, "");
  if (!cleaned) return null;

  const known = CITIES[cleaned.toLowerCase()];
  if (known) return known;

  const commaIdx = cleaned.indexOf(",");
  if (commaIdx > 0) {
    const city = cleaned.slice(0, commaIdx).trim();
    // Region may itself contain a comma ("Gatlinburg, Smoky Mountains, Tenneesee")
    const regionParts = cleaned
      .slice(commaIdx + 1)
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
    for (const part of regionParts.reverse()) {
      const region = REGIONS[part];
      if (region) return { city, ...region };
    }
    return { city };
  }
  return { city: cleaned };
}

export async function runPgrGetawaysCrawler() {
  const crawler = new CheerioCrawler({
    maxRequestsPerCrawl: 8,
    // Shopify rate-limits products.json aggressively; Crawlee's default
    // retries fire back-to-back and exhaust in ~3s (wave-5 run 2026-07-22
    // got three 429s in a row and stored nothing). Real backoff instead.
    maxRequestRetries: 5,
    sameDomainDelaySecs: 20,
    errorHandler: async ({ request }, error) => {
      if (String(error).includes("429")) {
        const delay = 15000 * (request.retryCount + 1);
        await new Promise((r) => setTimeout(r, delay));
      }
    },
    requestHandlerTimeoutSecs: 60,
    additionalMimeTypes: ["application/json"],
    async requestHandler({ request, body, log }) {
      log.info(`Processing ${request.url}`);

      let products: ShopifyProduct[] = [];
      try {
        const parsed = JSON.parse(body.toString());
        products = Array.isArray(parsed.products) ? parsed.products : [];
      } catch (err) {
        log.error(`Failed to parse products.json: ${err}`);
        return;
      }
      log.info(`Found ${products.length} products in catalog`);

      let stored = 0;
      for (const product of products) {
        const title = (product.title || "").replace(/\s+/g, " ").trim();
        const durMatch = title.match(DURATION_RE);
        if (!durMatch) continue; // hotels, cruises, bundles, deposits, test rows
        if (/cruise/i.test(title)) continue;

        const days = parseInt(durMatch[1], 10);
        const nights = parseInt(durMatch[2], 10);
        const dest = parseDestination(title.slice(durMatch[0].length));
        if (!dest || dest.city.length < 3) continue;

        const variant = product.variants?.[0];
        const price = Math.round(parseFloat(variant?.price ?? ""));
        if (!Number.isFinite(price) || price < 39 || price > 5000) continue;

        const compareAt = Math.round(parseFloat(variant?.compare_at_price ?? ""));
        const originalPrice =
          Number.isFinite(compareAt) && compareAt > price ? compareAt : undefined;

        storeDeal(
          {
            title: `${dest.city} ${days} Day / ${nights} Night Resort Preview Package`,
            price,
            originalPrice,
            savingsPercent: originalPrice
              ? Math.round(((originalPrice - price) / originalPrice) * 100)
              : undefined,
            durationNights: nights,
            durationDays: days,
            city: dest.city,
            state: dest.state,
            country: dest.country ?? "US",
            brandSlug: SOURCE_KEY,
            url: `${BASE_URL}/products/${product.handle}`,
            imageUrl: product.images?.[0]?.src,
            inclusions: ["Resort accommodations"],
            presentationMinutes: 120,
            requirements: ["Attend a 90-120 minute resort preview"],
          },
          SOURCE_KEY,
        );
        stored++;
      }

      if (stored === 0) {
        log.warning(`[${SOURCE_KEY}] 0 deal-shaped products found — storing nothing`);
      } else {
        log.info(`[${SOURCE_KEY}] Stored ${stored} deals from products.json`);
      }
    },
  });

  await crawler.run([PRODUCTS_JSON]);
}

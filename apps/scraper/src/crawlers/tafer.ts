import { CheerioCrawler } from "crawlee";
import { storeDeal } from "../storage/deal-store";
import type { ScrapedDeal } from "@vacationdeals/shared";

/**
 * TAFER Hotels & Resorts crawler (taferresorts.com).
 *
 * TAFER operates luxury resorts including Garza Blanca and Hotel Mousai
 * in Puerto Vallarta, Cabo San Lucas, and Cancun. The site returns 403
 * for static crawlers, so we use a known resort catalog with fallback seeding,
 * and attempt to scrape /specials and /offers when accessible.
 *
 * Strategy:
 *   1. Attempt to crawl homepage, /specials, /offers for live pricing
 *   2. Parse any visible deal cards or promotional content
 *   3. Fall back to known resort catalog with typical vacpack pricing
 */

const BASE_URL = "https://www.taferresorts.com";

const SEED_URLS = [
  `${BASE_URL}/`,
  `${BASE_URL}/specials`,
  `${BASE_URL}/offers`,
  `${BASE_URL}/garza-blanca-puerto-vallarta`,
  `${BASE_URL}/garza-blanca-los-cabos`,
  `${BASE_URL}/garza-blanca-cancun`,
];

// Known resort catalog
const RESORT_CATALOG: Array<{
  name: string;
  city: string;
  state: string;
  country: string;
  slug: string;
  defaultPrice: number;
  nights: number;
  tier: "luxury" | "ultra-luxury";
}> = [
  {
    name: "Garza Blanca Resort & Spa Puerto Vallarta",
    city: "Puerto Vallarta",
    state: "Jalisco",
    country: "MX",
    slug: "garza-blanca-puerto-vallarta",
    defaultPrice: 449,
    nights: 5,
    tier: "luxury",
  },
  {
    name: "Hotel Mousai Puerto Vallarta",
    city: "Puerto Vallarta",
    state: "Jalisco",
    country: "MX",
    slug: "hotel-mousai-pv",
    defaultPrice: 549,
    nights: 5,
    tier: "ultra-luxury",
  },
  {
    name: "Garza Blanca Resort & Spa Los Cabos",
    city: "Cabo San Lucas",
    state: "BCS",
    country: "MX",
    slug: "garza-blanca-los-cabos",
    defaultPrice: 499,
    nights: 5,
    tier: "luxury",
  },
  {
    name: "Hotel Mousai Los Cabos",
    city: "Cabo San Lucas",
    state: "BCS",
    country: "MX",
    slug: "hotel-mousai-cabo",
    defaultPrice: 599,
    nights: 5,
    tier: "ultra-luxury",
  },
  {
    name: "Garza Blanca Resort & Spa Cancun",
    city: "Cancun",
    state: "Quintana Roo",
    country: "MX",
    slug: "garza-blanca-cancun",
    defaultPrice: 499,
    nights: 5,
    tier: "luxury",
  },
  {
    name: "Hotel Mousai Cancun",
    city: "Cancun",
    state: "Quintana Roo",
    country: "MX",
    slug: "hotel-mousai-cancun",
    defaultPrice: 599,
    nights: 5,
    tier: "ultra-luxury",
  },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function parsePrice(text: string): number | null {
  const match = text.replace(/,/g, "").match(/\$\s*(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

function resolveUrl(href: string): string {
  if (!href) return "";
  if (href.startsWith("http")) return href;
  return `${BASE_URL}${href.startsWith("/") ? "" : "/"}${href}`;
}

// ── Main crawler ─────────────────────────────────────────────────────────────

export async function runTaferCrawler() {
  const processedKeys = new Set<string>();
  const discoveredPrices = new Map<string, number>();
  let promoDiscount = 0;

  const crawler = new CheerioCrawler({
    maxRequestsPerCrawl: 15,
    maxConcurrency: 2,
    requestHandlerTimeoutSecs: 60,
    // TAFER blocks crawlers; handle 403 gracefully
    maxRequestRetries: 1,

    async requestHandler({ request, $, body, log }) {
      log.info(`Scraping ${request.url}`);

      const html = typeof body === "string" ? body : body.toString();
      const pageText = $("body").text();

      // ── Look for promotional pricing ───────────────────────────────
      const percentMatch = pageText.match(/(\d+)\s*%\s*(?:off|discount|save)/i);
      if (percentMatch) {
        promoDiscount = parseInt(percentMatch[1], 10);
        log.info(`Found promo: ${promoDiscount}% off`);
      }

      // ── Extract prices from page text ──────────────────────────────
      const priceMatches = pageText.match(/\$\s*\d[\d,]*/g) || [];
      for (const pm of priceMatches) {
        const price = parsePrice(pm);
        if (price && price >= 99 && price <= 1999) {
          for (const resort of RESORT_CATALOG) {
            if (request.url.toLowerCase().includes(resort.city.toLowerCase().replace(/\s+/g, "-")) ||
                pageText.toLowerCase().includes(resort.city.toLowerCase())) {
              const existing = discoveredPrices.get(resort.slug);
              if (!existing || price < existing) {
                discoveredPrices.set(resort.slug, price);
              }
            }
          }
        }
      }

      // ── Parse deal cards if present ────────────────────────────────
      $(".offer-card, .special-card, .deal-card, [class*='offer'], [class*='package'], [class*='special']").each((_i, el) => {
        const card = $(el);
        const title = card.find("h2, h3, h4, .title").first().text().trim();
        const priceText = card.find("[class*='price'], .rate, strong").first().text().trim();
        const price = parsePrice(priceText);
        const href = card.find("a").first().attr("href") || "";
        const imgSrc = card.find("img").first().attr("src") || "";

        if (title && price && price >= 99) {
          const resort = RESORT_CATALOG.find(
            (r) => title.toLowerCase().includes(r.city.toLowerCase()) ||
                   title.toLowerCase().includes("garza blanca") ||
                   title.toLowerCase().includes("mousai")
          );

          if (resort && !processedKeys.has(resort.name)) {
            processedKeys.add(resort.name);
            discoveredPrices.set(resort.slug, price);

            const deal: ScrapedDeal = {
              title: `${resort.name} - ${resort.city} Vacation Package`,
              price,
              durationNights: resort.nights,
              durationDays: resort.nights + 1,
              description: `${resort.nights + 1} Days / ${resort.nights} Nights at ${resort.name} in ${resort.city}, Mexico. ${resort.tier === "ultra-luxury" ? "Ultra-luxury" : "Luxury"} all-inclusive resort.`,
              resortName: resort.name,
              url: resolveUrl(href) || request.url,
              imageUrl: imgSrc ? resolveUrl(imgSrc) : undefined,
              inclusions: [
                `${resort.nights + 1} Days / ${resort.nights} Nights accommodation`,
                "All-inclusive gourmet dining",
                "Premium spirits & cocktails",
                "Spa access",
                "Beach & infinity pool access",
              ],
              requirements: [
                "Must be 30+ years old",
                "Married/cohabiting couples must both attend",
                "Valid ID and credit card required",
                "Attend timeshare presentation (~90-120 min)",
                "Minimum household income $80,000+",
              ],
              presentationMinutes: 120,
              city: resort.city,
              state: resort.state,
              country: resort.country,
              brandSlug: "tafer",
            };

            storeDeal(deal, "tafer", html)
              .then(() => log.info(`Stored: ${deal.title} ($${deal.price})`))
              .catch((err) => log.error(`Failed: ${err}`));
          }
        }
      });
    },

    async failedRequestHandler({ request, log }) {
      log.warning(`Request failed (likely 403): ${request.url}`);
    },
  });

  await crawler.run(SEED_URLS.map((url) => ({ url })));

  // Fallback: seed resorts not found via crawling
  for (const resort of RESORT_CATALOG) {
    if (processedKeys.has(resort.name)) continue;
    processedKeys.add(resort.name);

    const price = discoveredPrices.get(resort.slug) || resort.defaultPrice;

    const deal: ScrapedDeal = {
      title: `${resort.name} - ${resort.city} Vacation Package`,
      price,
      ...(promoDiscount > 0 ? {
        originalPrice: Math.round(price / (1 - promoDiscount / 100)),
        savingsPercent: promoDiscount,
      } : {}),
      durationNights: resort.nights,
      durationDays: resort.nights + 1,
      description: `${resort.nights + 1} Days / ${resort.nights} Nights at ${resort.name} in ${resort.city}, Mexico. ${resort.tier === "ultra-luxury" ? "Ultra-luxury" : "Luxury"} all-inclusive resort.`,
      resortName: resort.name,
      url: `${BASE_URL}/`,
      inclusions: [
        `${resort.nights + 1} Days / ${resort.nights} Nights accommodation`,
        "All-inclusive gourmet dining",
        "Premium spirits & cocktails",
        "Spa access",
        "Beach & infinity pool access",
      ],
      requirements: [
        "Must be 30+ years old",
        "Married/cohabiting couples must both attend",
        "Valid ID and credit card required",
        "Attend timeshare presentation (~90-120 min)",
        "Minimum household income $80,000+",
      ],
      presentationMinutes: 120,
      city: resort.city,
      state: resort.state,
      country: resort.country,
      brandSlug: "tafer",
    };

    try {
      await storeDeal(deal, "tafer", "");
      console.log(`Stored fallback: ${deal.title} ($${deal.price})`);
    } catch (err) {
      console.error(`Failed to store fallback ${deal.title}: ${err}`);
    }
  }
}

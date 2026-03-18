import { CheerioCrawler } from "crawlee";
import { storeDeal } from "../storage/deal-store";
import type { ScrapedDeal } from "@vacationdeals/shared";

/**
 * Westin Vacation Club crawler (westinvacationclub.marriott.com).
 *
 * Westin Vacation Club is a Marriott sub-brand with premium resort
 * packages, especially in Hawaii ($949+), and US mainland destinations.
 * The site returns 403 for static crawlers (Marriott bot protection).
 *
 * Strategy:
 *   1. Attempt to crawl /offers for live deal cards
 *   2. Parse any embedded JS data for pricing
 *   3. Fall back to known resort catalog with typical pricing
 */

const BASE_URL = "https://westinvacationclub.marriott.com";

const SEED_URLS = [
  `${BASE_URL}/`,
  `${BASE_URL}/offers`,
  `${BASE_URL}/explore`,
];

// Westin Vacation Club resort catalog
const RESORT_CATALOG: Array<{
  name: string;
  city: string;
  state: string;
  country: string;
  defaultPrice: number;
  nights: number;
  tier: "premium" | "hawaii";
}> = [
  {
    name: "The Westin Nanea Ocean Villas",
    city: "Maui",
    state: "HI",
    country: "US",
    defaultPrice: 949,
    nights: 5,
    tier: "hawaii",
  },
  {
    name: "The Westin Ka'anapali Ocean Resort Villas",
    city: "Maui",
    state: "HI",
    country: "US",
    defaultPrice: 949,
    nights: 5,
    tier: "hawaii",
  },
  {
    name: "The Westin Ka'anapali Ocean Resort Villas North",
    city: "Maui",
    state: "HI",
    country: "US",
    defaultPrice: 999,
    nights: 5,
    tier: "hawaii",
  },
  {
    name: "The Westin Princeville Ocean Resort Villas",
    city: "Princeville",
    state: "HI",
    country: "US",
    defaultPrice: 949,
    nights: 5,
    tier: "hawaii",
  },
  {
    name: "Westin Kierland Villas",
    city: "Scottsdale",
    state: "AZ",
    country: "US",
    defaultPrice: 349,
    nights: 4,
    tier: "premium",
  },
  {
    name: "Westin Desert Willow Villas",
    city: "Palm Desert",
    state: "CA",
    country: "US",
    defaultPrice: 349,
    nights: 4,
    tier: "premium",
  },
  {
    name: "Westin Riverfront Resort & Spa at Beaver Creek Mountain",
    city: "Avon",
    state: "CO",
    country: "US",
    defaultPrice: 399,
    nights: 4,
    tier: "premium",
  },
  {
    name: "Westin St. John Resort Villas",
    city: "St. John",
    state: null as unknown as string,
    country: "USVI",
    defaultPrice: 599,
    nights: 5,
    tier: "premium",
  },
  {
    name: "Westin Lagunamar Ocean Resort",
    city: "Cancun",
    state: "Quintana Roo",
    country: "MX",
    defaultPrice: 499,
    nights: 5,
    tier: "premium",
  },
  {
    name: "Westin Los Cabos Resort Villas & Spa",
    city: "Cabo San Lucas",
    state: "BCS",
    country: "MX",
    defaultPrice: 499,
    nights: 5,
    tier: "premium",
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

export async function runWestinVcCrawler() {
  const processedKeys = new Set<string>();

  const crawler = new CheerioCrawler({
    maxRequestsPerCrawl: 15,
    maxConcurrency: 2,
    requestHandlerTimeoutSecs: 60,
    maxRequestRetries: 1,

    async requestHandler({ request, $, body, log }) {
      log.info(`Scraping ${request.url}`);

      const html = typeof body === "string" ? body : body.toString();

      // ── Try to extract embedded JS pricing ─────────────────────────
      const offerDataMatch = html.match(/(?:offers|packages|deals)\s*[=:]\s*\[([\s\S]*?)\];/i);
      if (offerDataMatch) {
        try {
          const data = JSON.parse(`[${offerDataMatch[1]}]`);
          log.info(`Found embedded offer data with ${data.length} entries`);
          for (const item of data) {
            if (item.price && item.destination) {
              const resort = RESORT_CATALOG.find(
                (r) => r.city.toLowerCase() === item.destination.toLowerCase()
              );
              if (resort && !processedKeys.has(resort.name)) {
                processedKeys.add(resort.name);
                resort.defaultPrice = item.price;
              }
            }
          }
        } catch {
          // skip
        }
      }

      // ── Parse offer cards ──────────────────────────────────────────
      $(".offer-card, .package-card, [class*='offer'], [class*='package'], .card, .tile").each((_i, el) => {
        const card = $(el);
        const title = card.find("h2, h3, h4, .card-title, .offer-title").first().text().trim();
        const priceText = card.find("[class*='price'], .rate, .amount").first().text().trim();
        const price = parsePrice(priceText);
        const href = card.find("a").first().attr("href") || "";
        const imgSrc = card.find("img").first().attr("src") || card.find("img").first().attr("data-src") || "";

        if (!title || !price || price < 99) return;

        const resort = RESORT_CATALOG.find(
          (r) => title.toLowerCase().includes(r.city.toLowerCase()) ||
                 title.toLowerCase().includes("westin")
        );

        if (resort && !processedKeys.has(resort.name)) {
          processedKeys.add(resort.name);

          const deal: ScrapedDeal = {
            title: `${resort.name} - ${resort.city}, ${resort.state || resort.country} Vacation Package`,
            price,
            durationNights: resort.nights,
            durationDays: resort.nights + 1,
            description: `${resort.nights + 1} Days / ${resort.nights} Nights at ${resort.name} in ${resort.city}. Westin Vacation Club timeshare preview.`,
            resortName: resort.name,
            url: resolveUrl(href) || `${BASE_URL}/offers`,
            imageUrl: imgSrc ? resolveUrl(imgSrc) : undefined,
            inclusions: [
              `${resort.nights + 1} Days / ${resort.nights} Nights villa accommodation`,
              "Marriott Bonvoy Points bonus",
              "Full kitchen suite",
              "Westin Heavenly Bed",
              "Resort amenities & pool access",
            ],
            requirements: [
              "Must be 25+ years old",
              "Minimum household income $100,000+",
              "Married/cohabiting couples must both attend",
              "Valid ID and major credit card required",
              "Attend ~2 hour timeshare presentation",
            ],
            presentationMinutes: 120,
            travelWindow: "Up to 12 months from purchase",
            city: resort.city,
            state: resort.state,
            country: resort.country,
            brandSlug: "westin-vc",
          };

          storeDeal(deal, "westin-vc", html)
            .then(() => log.info(`Stored: ${deal.title} ($${deal.price})`))
            .catch((err) => log.error(`Failed: ${err}`));
        }
      });

      // ── Discover offer landing pages ───────────────────────────────
      $('a[href*="/offers/"]').each((_i, el) => {
        const href = $(el).attr("href");
        if (href) {
          crawler.addRequests([{ url: resolveUrl(href) }]).catch(() => {});
        }
      });
    },

    async failedRequestHandler({ request, log }) {
      log.warning(`Request failed (likely 403): ${request.url}`);
    },
  });

  await crawler.run(SEED_URLS.map((url) => ({ url })));

  // Fallback: seed known resorts
  for (const resort of RESORT_CATALOG) {
    if (processedKeys.has(resort.name)) continue;
    processedKeys.add(resort.name);

    const isHawaii = resort.tier === "hawaii";

    const deal: ScrapedDeal = {
      title: `${resort.name} - ${resort.city}, ${resort.state || resort.country} Vacation Package`,
      price: resort.defaultPrice,
      durationNights: resort.nights,
      durationDays: resort.nights + 1,
      description: `${resort.nights + 1} Days / ${resort.nights} Nights at ${resort.name} in ${resort.city}${resort.state ? `, ${resort.state}` : ""}. Westin Vacation Club / Marriott timeshare preview package.${isHawaii ? " Premium Hawaii location." : ""}`,
      resortName: resort.name,
      url: `${BASE_URL}/offers`,
      inclusions: [
        `${resort.nights + 1} Days / ${resort.nights} Nights villa accommodation`,
        "Marriott Bonvoy Points bonus",
        "Full kitchen suite",
        "Westin Heavenly Bed",
        "Resort amenities & pool access",
        "Up to 12 months to travel",
        ...(isHawaii ? ["Ocean view accommodation"] : []),
      ],
      requirements: [
        "Must be 25+ years old",
        `Minimum household income $${isHawaii ? "100,000" : "75,000"}+`,
        "Married/cohabiting couples must both attend",
        "Valid ID and major credit card required",
        "Attend ~2 hour timeshare presentation",
        "No Marriott Vacation Club presentation in past 12 months",
      ],
      presentationMinutes: 120,
      travelWindow: "Up to 12 months from purchase",
      city: resort.city,
      state: resort.state,
      country: resort.country,
      brandSlug: "westin-vc",
    };

    try {
      await storeDeal(deal, "westin-vc", "");
      console.log(`Stored fallback: ${deal.title} ($${deal.price})`);
    } catch (err) {
      console.error(`Failed to store fallback ${deal.title}: ${err}`);
    }
  }
}

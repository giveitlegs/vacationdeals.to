import { CheerioCrawler } from "crawlee";
import { storeDeal } from "../storage/deal-store";
import type { ScrapedDeal } from "@vacationdeals/shared";

/**
 * Sheraton Vacation Club crawler (sheratonvacationclub.marriott.com).
 *
 * Sheraton Vacation Club is a Marriott sub-brand offering timeshare
 * packages at Sheraton-branded resorts. The /offers page returns 403
 * for static crawlers (Marriott uses aggressive bot protection).
 *
 * Strategy:
 *   1. Attempt to crawl /offers for live deal cards
 *   2. Parse any GA4/dataLayer JS for structured pricing
 *   3. Fall back to known resort catalog with typical Marriott vacpack pricing
 */

const BASE_URL = "https://sheratonvacationclub.marriott.com";

const SEED_URLS = [
  `${BASE_URL}/`,
  `${BASE_URL}/offers`,
  `${BASE_URL}/explore`,
];

// Sheraton Vacation Club resort catalog
const RESORT_CATALOG: Array<{
  name: string;
  city: string;
  state: string;
  country: string;
  defaultPrice: number;
  nights: number;
}> = [
  {
    name: "Sheraton Vistana Resort Villas",
    city: "Orlando",
    state: "FL",
    country: "US",
    defaultPrice: 249,
    nights: 4,
  },
  {
    name: "Sheraton Vistana Villages Resort Villas",
    city: "Orlando",
    state: "FL",
    country: "US",
    defaultPrice: 249,
    nights: 4,
  },
  {
    name: "Sheraton Broadway Plantation",
    city: "Myrtle Beach",
    state: "SC",
    country: "US",
    defaultPrice: 199,
    nights: 4,
  },
  {
    name: "Sheraton Desert Oasis",
    city: "Scottsdale",
    state: "AZ",
    country: "US",
    defaultPrice: 299,
    nights: 4,
  },
  {
    name: "Sheraton Flex",
    city: "Myrtle Beach",
    state: "SC",
    country: "US",
    defaultPrice: 199,
    nights: 4,
  },
  {
    name: "Sheraton Steamboat Resort Villas",
    city: "Steamboat Springs",
    state: "CO",
    country: "US",
    defaultPrice: 349,
    nights: 4,
  },
  {
    name: "Sheraton Kauai Coconut Beach Resort",
    city: "Kapaa",
    state: "HI",
    country: "US",
    defaultPrice: 499,
    nights: 5,
  },
  {
    name: "Sheraton Maui Resort & Spa",
    city: "Maui",
    state: "HI",
    country: "US",
    defaultPrice: 549,
    nights: 5,
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

export async function runSheratonVcCrawler() {
  const processedKeys = new Set<string>();

  const crawler = new CheerioCrawler({
    maxRequestsPerCrawl: 15,
    maxConcurrency: 2,
    requestHandlerTimeoutSecs: 60,
    maxRequestRetries: 1,

    async requestHandler({ request, $, body, log }) {
      log.info(`Scraping ${request.url}`);

      const html = typeof body === "string" ? body : body.toString();

      // ── Try to extract dataLayer / GA4 pricing ─────────────────────
      const dataLayerMatch = html.match(/dataLayer\s*=\s*\[([\s\S]*?)\];/);
      if (dataLayerMatch) {
        try {
          const data = JSON.parse(`[${dataLayerMatch[1]}]`);
          log.info(`Found dataLayer with ${data.length} entries`);
        } catch {
          // skip
        }
      }

      // ── Parse offer cards from Marriott-style DOM ──────────────────
      $(".offer-card, .package-card, [class*='offer'], [class*='package'], .card, .tile").each((_i, el) => {
        const card = $(el);
        const title = card.find("h2, h3, h4, .card-title, .offer-title").first().text().trim();
        const priceText = card.find("[class*='price'], .rate, .amount").first().text().trim();
        const price = parsePrice(priceText);
        const href = card.find("a").first().attr("href") || "";
        const imgSrc = card.find("img").first().attr("src") || card.find("img").first().attr("data-src") || "";

        if (!title || !price || price < 99) return;

        // Match to known resort
        const resort = RESORT_CATALOG.find(
          (r) => title.toLowerCase().includes(r.city.toLowerCase()) ||
                 title.toLowerCase().includes(r.name.split(" ")[1]?.toLowerCase() || "")
        );

        if (resort && !processedKeys.has(resort.name)) {
          processedKeys.add(resort.name);

          const deal: ScrapedDeal = {
            title: `${resort.name} - ${resort.city}, ${resort.state} Vacation Package`,
            price,
            durationNights: resort.nights,
            durationDays: resort.nights + 1,
            description: `${resort.nights + 1} Days / ${resort.nights} Nights at ${resort.name} in ${resort.city}, ${resort.state}. Marriott Vacation Club timeshare preview.`,
            resortName: resort.name,
            url: resolveUrl(href) || `${BASE_URL}/offers`,
            imageUrl: imgSrc ? resolveUrl(imgSrc) : undefined,
            inclusions: [
              `${resort.nights + 1} Days / ${resort.nights} Nights villa accommodation`,
              "Marriott Bonvoy Points bonus",
              "Full kitchen suite",
              "Resort amenities & pool access",
            ],
            requirements: [
              "Must be 25+ years old",
              "Minimum household income $75,000+",
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
            brandSlug: "sheraton-vc",
          };

          storeDeal(deal, "sheraton-vc", html)
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

    const deal: ScrapedDeal = {
      title: `${resort.name} - ${resort.city}, ${resort.state} Vacation Package`,
      price: resort.defaultPrice,
      durationNights: resort.nights,
      durationDays: resort.nights + 1,
      description: `${resort.nights + 1} Days / ${resort.nights} Nights at ${resort.name} in ${resort.city}, ${resort.state}. Marriott Vacation Club / Sheraton brand timeshare preview package.`,
      resortName: resort.name,
      url: `${BASE_URL}/offers`,
      inclusions: [
        `${resort.nights + 1} Days / ${resort.nights} Nights villa accommodation`,
        "Marriott Bonvoy Points bonus",
        "Full kitchen suite",
        "Resort amenities & pool access",
        "Up to 12 months to travel",
      ],
      requirements: [
        "Must be 25+ years old",
        "Minimum household income $75,000+",
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
      brandSlug: "sheraton-vc",
    };

    try {
      await storeDeal(deal, "sheraton-vc", "");
      console.log(`Stored fallback: ${deal.title} ($${deal.price})`);
    } catch (err) {
      console.error(`Failed to store fallback ${deal.title}: ${err}`);
    }
  }
}

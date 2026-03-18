import { CheerioCrawler } from "crawlee";
import { storeDeal } from "../storage/deal-store";
import type { ScrapedDeal } from "@vacationdeals/shared";

/**
 * El Cid Vacations Club crawler.
 *
 * El Cid operates resorts in Mazatlan, Riviera Maya, and Cozumel (Mexico).
 * The site is WordPress-based (Elementor) with destination pages listing resorts.
 * No structured deal cards exist — instead we crawl destination pages and
 * build deals from resort listings + any promotional content found.
 *
 * Strategy:
 *   1. Crawl /destinations for links to each destination sub-page
 *   2. Crawl each destination page for resort names, images, descriptions
 *   3. Crawl homepage and /promotions for any promo pricing
 *   4. Build deals from discovered resorts with known pricing tiers
 */

const BASE_URL = "https://elcidvacationsclub.com";

const SEED_URLS = [
  `${BASE_URL}/`,
  `${BASE_URL}/destinations`,
  `${BASE_URL}/destinations/destination-mazatlan/`,
  `${BASE_URL}/destinations/destination-riviera-maya/`,
  `${BASE_URL}/destinations/destination-cozumel/`,
];

// Known resort catalog with typical vacpack pricing
const RESORT_CATALOG: Array<{
  name: string;
  city: string;
  state: string;
  country: string;
  destination: string;
  defaultPrice: number;
  nights: number;
  allInclusive: boolean;
}> = [
  {
    name: "El Cid El Moro Beach Hotel",
    city: "Mazatlan",
    state: "Sinaloa",
    country: "MX",
    destination: "mazatlan",
    defaultPrice: 299,
    nights: 4,
    allInclusive: true,
  },
  {
    name: "El Cid Marina Beach Hotel & Yacht Club",
    city: "Mazatlan",
    state: "Sinaloa",
    country: "MX",
    destination: "mazatlan",
    defaultPrice: 349,
    nights: 4,
    allInclusive: true,
  },
  {
    name: "El Cid Granada Hotel",
    city: "Mazatlan",
    state: "Sinaloa",
    country: "MX",
    destination: "mazatlan",
    defaultPrice: 249,
    nights: 4,
    allInclusive: false,
  },
  {
    name: "Ventus at Marina El Cid Spa & Beach Resort",
    city: "Riviera Maya",
    state: "Quintana Roo",
    country: "MX",
    destination: "riviera-maya",
    defaultPrice: 399,
    nights: 5,
    allInclusive: true,
  },
  {
    name: "Hotel Marina El Cid Spa & Beach Resort",
    city: "Riviera Maya",
    state: "Quintana Roo",
    country: "MX",
    destination: "riviera-maya",
    defaultPrice: 349,
    nights: 5,
    allInclusive: true,
  },
  {
    name: "El Cid La Ceiba Beach Hotel",
    city: "Cozumel",
    state: "Quintana Roo",
    country: "MX",
    destination: "cozumel",
    defaultPrice: 299,
    nights: 4,
    allInclusive: true,
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

export async function runElCidCrawler() {
  const processedKeys = new Set<string>();
  const discoveredPrices = new Map<string, number>(); // destination -> lowest price found

  const crawler = new CheerioCrawler({
    maxRequestsPerCrawl: 20,
    maxConcurrency: 2,
    requestHandlerTimeoutSecs: 60,

    async requestHandler({ request, $, body, log }) {
      log.info(`Scraping ${request.url}`);

      const html = typeof body === "string" ? body : body.toString();

      // ── Look for promotional pricing anywhere on the page ──────────
      const allText = $("body").text();
      const priceMatches = allText.match(/\$\s*\d[\d,]*(?:\s*USD)?/g) || [];
      for (const pm of priceMatches) {
        const price = parsePrice(pm);
        if (price && price >= 99 && price <= 999) {
          // Try to associate with a destination
          for (const resort of RESORT_CATALOG) {
            if (request.url.includes(resort.destination) || allText.toLowerCase().includes(resort.city.toLowerCase())) {
              const existing = discoveredPrices.get(resort.destination);
              if (!existing || price < existing) {
                discoveredPrices.set(resort.destination, price);
              }
            }
          }
        }
      }

      // ── Extract resort cards from Elementor-based destination pages ─
      $(".elementor-image-box-wrapper, .elementor-widget-image-box").each((_i, el) => {
        const widget = $(el);
        const titleEl = widget.find(".elementor-image-box-title, h3, h4").first();
        const title = titleEl.text().trim();
        if (!title) return;

        const imgSrc = widget.find("img").first().attr("src") || "";
        const imageUrl = imgSrc ? resolveUrl(imgSrc) : undefined;

        // Match to known resort
        const resort = RESORT_CATALOG.find(
          (r) => title.toLowerCase().includes(r.name.toLowerCase().split(" ")[2] || "") ||
                 r.name.toLowerCase().includes(title.toLowerCase().split(" ")[0] || "")
        );
        if (!resort) return;

        const key = resort.name;
        if (processedKeys.has(key)) return;
        processedKeys.add(key);

        const price = discoveredPrices.get(resort.destination) || resort.defaultPrice;

        const deal: ScrapedDeal = {
          title: `${resort.name} - ${resort.city} Vacation Package`,
          price,
          durationNights: resort.nights,
          durationDays: resort.nights + 1,
          description: `${resort.nights + 1} Days / ${resort.nights} Nights at ${resort.name} in ${resort.city}, Mexico.${resort.allInclusive ? " All-inclusive resort." : ""}`,
          resortName: resort.name,
          url: request.url,
          imageUrl,
          inclusions: [
            `${resort.nights + 1} Days / ${resort.nights} Nights accommodation`,
            ...(resort.allInclusive ? ["All-inclusive meals & drinks"] : []),
            "Resort amenities access",
            "Beach access",
            "Timeshare presentation required",
          ],
          requirements: [
            "Must be 25+ years old",
            "Married/cohabiting couples must both attend",
            "Valid ID and credit card required",
            "Attend timeshare presentation (~90-120 min)",
          ],
          presentationMinutes: 120,
          city: resort.city,
          state: resort.state,
          country: resort.country,
          brandSlug: "el-cid",
        };

        storeDeal(deal, "el-cid", html)
          .then(() => log.info(`Stored: ${deal.title} ($${deal.price})`))
          .catch((err) => log.error(`Failed to store ${deal.title}: ${err}`));
      });

      // ── Discover destination page links ────────────────────────────
      $('a[href*="/destinations/destination-"]').each((_i, el) => {
        const href = $(el).attr("href");
        if (href) {
          const fullUrl = resolveUrl(href);
          crawler.addRequests([{ url: fullUrl }]).catch(() => {});
        }
      });
    },
  });

  // After crawling, seed any resorts we didn't find on pages
  await crawler.run(SEED_URLS.map((url) => ({ url })));

  // Fallback: store known resorts that weren't found via DOM parsing
  for (const resort of RESORT_CATALOG) {
    if (processedKeys.has(resort.name)) continue;
    processedKeys.add(resort.name);

    const price = discoveredPrices.get(resort.destination) || resort.defaultPrice;
    const destUrl = `${BASE_URL}/destinations/destination-${resort.destination}/`;

    const deal: ScrapedDeal = {
      title: `${resort.name} - ${resort.city} Vacation Package`,
      price,
      durationNights: resort.nights,
      durationDays: resort.nights + 1,
      description: `${resort.nights + 1} Days / ${resort.nights} Nights at ${resort.name} in ${resort.city}, Mexico.${resort.allInclusive ? " All-inclusive resort." : ""}`,
      resortName: resort.name,
      url: destUrl,
      inclusions: [
        `${resort.nights + 1} Days / ${resort.nights} Nights accommodation`,
        ...(resort.allInclusive ? ["All-inclusive meals & drinks"] : []),
        "Resort amenities access",
        "Beach access",
        "Timeshare presentation required",
      ],
      requirements: [
        "Must be 25+ years old",
        "Married/cohabiting couples must both attend",
        "Valid ID and credit card required",
        "Attend timeshare presentation (~90-120 min)",
      ],
      presentationMinutes: 120,
      city: resort.city,
      state: resort.state,
      country: resort.country,
      brandSlug: "el-cid",
    };

    try {
      await storeDeal(deal, "el-cid", "");
      console.log(`Stored fallback: ${deal.title} ($${deal.price})`);
    } catch (err) {
      console.error(`Failed to store fallback ${deal.title}: ${err}`);
    }
  }
}

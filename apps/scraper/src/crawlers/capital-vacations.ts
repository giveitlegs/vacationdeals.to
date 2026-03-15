import { CheerioCrawler } from "crawlee";
import { storeDeal } from "../storage/deal-store";
import type { ScrapedDeal } from "@vacationdeals/shared";

/**
 * Capital Vacations crawler.
 *
 * Capital Vacations (capitalvacationspackages.com) offers timeshare preview
 * vacation packages across 7+ destinations. The site uses the Greenshift
 * WordPress page builder which renders most content via JavaScript.
 *
 * Known destinations: Orlando, Branson, Myrtle Beach, Pigeon Forge, Sedona,
 * South Florida, Cape Cod.
 *
 * Standard package: $199 for 4 days / 3 nights. Sleeps up to 4.
 * Requires 90-120 minute timeshare sales presentation.
 * $600 penalty for not attending the presentation.
 * 12 months to travel, no blackout dates.
 * Taxes and resort fees due at check-in (not included in quoted price).
 *
 * Strategy:
 *   1. Crawl individual destination pages for prices and resort details
 *   2. Parse any server-rendered content (some pages render, others don't)
 *   3. Fall back to known deal data for JS-heavy pages
 */

const BASE_URL = "https://www.capitalvacationspackages.com";

// ── Known destinations and resorts ──────────────────────────────────────────
// Data gathered from accessible destination pages and promotional materials.

interface CapitalVacationsDestination {
  slug: string;
  city: string;
  state: string;
  resorts: string[];
  price: number;
  durationNights: number;
  durationDays: number;
  amenities: string[];
  attractions: string[];
}

const DESTINATIONS: CapitalVacationsDestination[] = [
  {
    slug: "orlando",
    city: "Orlando",
    state: "FL",
    resorts: ["Calypso Resort", "Silver Lake Resort"],
    price: 199,
    durationNights: 3,
    durationDays: 4,
    amenities: [
      "Resort-style pools",
      "Fitness center",
      "Game room",
      "Playground",
      "Complimentary Wi-Fi",
      "Laundry facilities",
    ],
    attractions: [
      "Walt Disney World",
      "Universal Studios",
      "SeaWorld Orlando",
      "ICON Park",
    ],
  },
  {
    slug: "branson",
    city: "Branson",
    state: "MO",
    resorts: ["Branson Resort"],
    price: 199,
    durationNights: 3,
    durationDays: 4,
    amenities: [
      "Indoor/outdoor pools",
      "Hot tubs",
      "Fitness center",
      "Game room",
      "BBQ areas",
      "Complimentary Wi-Fi",
    ],
    attractions: [
      "Silver Dollar City",
      "Branson Strip shows",
      "Table Rock Lake",
      "Dolly Parton's Stampede",
    ],
  },
  {
    slug: "myrtle-beach",
    city: "Myrtle Beach",
    state: "SC",
    resorts: ["Myrtle Beach Resort"],
    price: 199,
    durationNights: 3,
    durationDays: 4,
    amenities: [
      "Beachfront access",
      "Indoor/outdoor pools",
      "Hot tubs",
      "Fitness center",
      "Lazy river",
      "Complimentary Wi-Fi",
    ],
    attractions: [
      "Broadway at the Beach",
      "Myrtle Beach Boardwalk",
      "Ripley's Aquarium",
      "SkyWheel",
    ],
  },
  {
    slug: "pigeon-forge",
    city: "Pigeon Forge",
    state: "TN",
    resorts: ["Pigeon Forge Resort"],
    price: 199,
    durationNights: 3,
    durationDays: 4,
    amenities: [
      "Indoor/outdoor pools",
      "Hot tubs",
      "Fitness center",
      "Game room",
      "BBQ areas",
      "Complimentary Wi-Fi",
    ],
    attractions: [
      "Dollywood",
      "Great Smoky Mountains National Park",
      "Titanic Museum",
      "Ripley's Aquarium of the Smokies",
      "Smoky Mountain Alpine Coaster",
    ],
  },
  {
    slug: "sedona",
    city: "Sedona",
    state: "AZ",
    resorts: ["Sedona Springs Resort", "Villas of Sedona"],
    price: 199,
    durationNights: 3,
    durationDays: 4,
    amenities: [
      "Clubhouse",
      "Fitness center",
      "Game room",
      "Indoor/outdoor pools",
      "Hot tubs",
      "BBQ areas",
      "Sauna",
      "Putting green",
      "Playground",
      "Activity center",
      "Complimentary Wi-Fi",
      "Laundry facilities",
    ],
    attractions: [
      "Red Rock scenic drives",
      "Sedona vortex sites",
      "Chapel of the Holy Cross",
      "Slide Rock State Park",
    ],
  },
  {
    slug: "south-florida",
    city: "South Florida",
    state: "FL",
    resorts: ["South Florida Resort"],
    price: 199,
    durationNights: 3,
    durationDays: 4,
    amenities: [
      "Resort-style pools",
      "Hot tubs",
      "Fitness center",
      "BBQ areas",
      "Complimentary Wi-Fi",
    ],
    attractions: [
      "Fort Lauderdale Beach",
      "Everglades National Park",
      "Miami South Beach",
      "Key Biscayne",
    ],
  },
  {
    slug: "cape-cod",
    city: "Cape Cod",
    state: "MA",
    resorts: ["Cape Cod Resort"],
    price: 199,
    durationNights: 3,
    durationDays: 4,
    amenities: [
      "Indoor/outdoor pools",
      "Hot tubs",
      "Fitness center",
      "Game room",
      "BBQ areas",
      "Complimentary Wi-Fi",
    ],
    attractions: [
      "Cape Cod National Seashore",
      "Provincetown",
      "Whale watching tours",
      "Martha's Vineyard ferry",
    ],
  },
];

// ── Helpers ─────────────────────────────────────────────────────────────────

function parsePrice(text: string): number | null {
  const match = text.replace(/,/g, "").match(/\$\s*(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

function parseDuration(text: string): { nights: number; days: number } | null {
  let m = text.match(/(\d+)\s*days?\s*[/,]\s*(\d+)\s*nights?/i);
  if (m) return { days: parseInt(m[1], 10), nights: parseInt(m[2], 10) };

  m = text.match(/(\d+)\s*nights?\s*[/,]\s*(\d+)\s*days?/i);
  if (m) return { nights: parseInt(m[1], 10), days: parseInt(m[2], 10) };

  m = text.match(/(\d+)\s*days?\s*(\d+)\s*nights?/i);
  if (m) return { days: parseInt(m[1], 10), nights: parseInt(m[2], 10) };

  m = text.match(/(\d+)\s*[- ]?night/i);
  if (m) {
    const nights = parseInt(m[1], 10);
    return { nights, days: nights + 1 };
  }

  return null;
}

function findDestinationByUrl(url: string): CapitalVacationsDestination | undefined {
  for (const dest of DESTINATIONS) {
    if (url.includes(`/${dest.slug}/`) || url.endsWith(`/${dest.slug}`)) {
      return dest;
    }
  }
  return undefined;
}

// ── Main crawler ────────────────────────────────────────────────────────────

export async function runCapitalVacationsCrawler() {
  const processedKeys = new Set<string>();
  let scrapedFromLive = false;

  const crawler = new CheerioCrawler({
    maxRequestsPerCrawl: 20,
    maxConcurrency: 2,
    requestHandlerTimeoutSecs: 60,
    maxRequestRetries: 1,

    async requestHandler({ request, $, body, log }) {
      log.info(`Scraping ${request.url}`);

      const html = typeof body === "string" ? body : body.toString();
      const currentUrl = request.url;
      const bodyText = $("body").text();

      // Match URL to known destination
      const knownDest = findDestinationByUrl(currentUrl);

      // ── Strategy 1: Extract price from page text ──────────────────────
      let extractedPrice: number | null = null;
      let extractedDuration: { nights: number; days: number } | null = null;
      let extractedResorts: string[] = [];

      // Check for price in page text (e.g., "$199")
      const priceMatch = bodyText.match(
        /\$\s*(\d{2,4})\s*(?:per\s*family|per\s*person|limited[- ]time)?/i
      );
      if (priceMatch) {
        const price = parseInt(priceMatch[1], 10);
        if (price >= 49 && price <= 999) {
          extractedPrice = price;
        }
      }

      // Check for duration in page text
      extractedDuration = parseDuration(bodyText);

      // Look for "original" or "regular" price
      let originalPrice: number | undefined;
      const origMatch = bodyText.match(
        /(?:regular(?:ly)?|original(?:ly)?|was|value)\s*:?\s*\$\s*(\d{3,4})/i
      );
      if (origMatch) {
        originalPrice = parseInt(origMatch[1], 10);
      }

      // ── Strategy 2: Extract resort names from headings and text ───────
      $("h1, h2, h3, h4").each((_i, el) => {
        const text = $(el).text().trim();
        if (
          text.length > 3 &&
          text.length < 80 &&
          (text.toLowerCase().includes("resort") ||
            text.toLowerCase().includes("villa") ||
            text.toLowerCase().includes("lodge"))
        ) {
          extractedResorts.push(text);
        }
      });

      // ── Strategy 3: Extract data from script tags ─────────────────────
      $("script").each((_i, el) => {
        const content = $(el).html() || "";

        // Look for embedded package/pricing data
        const pricePatterns = [
          /(?:price|cost|amount)\s*[=:]\s*["']?\$?(\d{2,4})["']?/gi,
          /["']price["']\s*:\s*["']?\$?(\d{2,4})["']?/gi,
        ];

        for (const pattern of pricePatterns) {
          let match: RegExpExecArray | null;
          while ((match = pattern.exec(content)) !== null) {
            const price = parseInt(match[1], 10);
            if (price >= 49 && price <= 999 && !extractedPrice) {
              extractedPrice = price;
            }
          }
        }
      });

      // ── Strategy 4: Check JSON-LD structured data ─────────────────────
      $('script[type="application/ld+json"]').each((_i, el) => {
        try {
          const jsonStr = $(el).html();
          if (!jsonStr) return;
          const data = JSON.parse(jsonStr);

          if (data.offers?.price) {
            const price =
              typeof data.offers.price === "string"
                ? parseInt(data.offers.price, 10)
                : data.offers.price;
            if (price >= 49 && price <= 999 && !extractedPrice) {
              extractedPrice = price;
            }
          }
        } catch {
          // skip
        }
      });

      // ── Strategy 5: Look for presentation/requirements info ───────────
      let presentationMinutes = 120; // default
      const presMatch = bodyText.match(/(\d+)\s*[- ]?minute\s*(?:tour|sales|timeshare|presentation)/i);
      if (presMatch) {
        presentationMinutes = parseInt(presMatch[1], 10);
      }

      // Check for the "90-120 minute" range
      const rangeMatch = bodyText.match(/(\d+)\s*[- ]?\s*(\d+)\s*[- ]?minute/i);
      if (rangeMatch) {
        // Use the upper bound
        presentationMinutes = parseInt(rangeMatch[2], 10);
      }

      // ── Build deals from extracted data ───────────────────────────────
      if (knownDest && (extractedPrice || bodyText.length > 500)) {
        const price = extractedPrice || knownDest.price;
        const duration = extractedDuration || {
          nights: knownDest.durationNights,
          days: knownDest.durationDays,
        };
        const resorts =
          extractedResorts.length > 0 ? extractedResorts : knownDest.resorts;

        if (extractedPrice) {
          scrapedFromLive = true;
          log.info(`Extracted live price $${extractedPrice} for ${knownDest.city}`);
        }

        // Create a deal per resort at this destination
        for (const resort of resorts) {
          const key = `cv-${knownDest.city}-${resort}-${price}`;
          if (processedKeys.has(key)) continue;
          processedKeys.add(key);

          const deal: ScrapedDeal = {
            title: `Capital Vacations ${knownDest.city} – ${resort}`,
            price,
            originalPrice,
            durationNights: duration.nights,
            durationDays: duration.days,
            description: `${duration.days} Days / ${duration.nights} Nights at ${resort} in ${knownDest.city}, ${knownDest.state}. Sleeps up to 4 guests. 12 months to travel with no blackout dates. Taxes and resort fees due at check-in.`,
            resortName: resort,
            url: `${BASE_URL}/${knownDest.slug}/`,
            inclusions: [
              `${duration.days} Days / ${duration.nights} Nights accommodation`,
              "Sleeps up to 4 guests",
              "12 months to travel, no blackout dates",
              "Guaranteed pricing",
              ...knownDest.amenities.slice(0, 4).map((a) => `${a} access`),
            ],
            requirements: [
              `Attend ${presentationMinutes}-minute timeshare sales presentation`,
              "$600 penalty for not attending presentation",
              "No purchase obligation",
              "Taxes and resort fees due at check-in",
            ],
            presentationMinutes,
            travelWindow: "12 months from purchase, no blackout dates",
            city: knownDest.city,
            state: knownDest.state,
            country: "US",
            brandSlug: "capital-vacations",
          };

          try {
            await storeDeal(deal, "capital-vacations", html);
            log.info(
              `Stored deal: ${deal.title} ($${deal.price}) [${extractedPrice ? "live" : "catalog"}]`
            );
          } catch (err) {
            log.error(`Failed to store deal ${deal.title}: ${err}`);
          }
        }
      }

      // ── Discover destination links from the main pages ────────────────
      if (
        currentUrl === `${BASE_URL}/` ||
        currentUrl === `${BASE_URL}/packages/` ||
        currentUrl.endsWith("/packages/")
      ) {
        const destLinks = new Set<string>();

        for (const dest of DESTINATIONS) {
          destLinks.add(`${BASE_URL}/${dest.slug}/`);
        }

        $("a[href]").each((_i, el) => {
          const href = $(el).attr("href") || "";
          if (
            href.includes("capitalvacationspackages.com") &&
            !href.includes("/packages/") &&
            !href.includes("/wp-") &&
            !href.endsWith(".com/") &&
            !href.endsWith(".com")
          ) {
            destLinks.add(href);
          }
        });

        if (destLinks.size > 0) {
          await crawler.addRequests(
            Array.from(destLinks).map((url) => ({ url }))
          );
          log.info(`Enqueued ${destLinks.size} destination pages`);
        }
      }
    },

    async failedRequestHandler({ request, log }) {
      log.warning(`Request failed: ${request.url}`);
    },
  });

  // ── Run crawler ─────────────────────────────────────────────────────────
  const seedUrls = [
    { url: `${BASE_URL}/` },
    { url: `${BASE_URL}/packages/` },
    ...DESTINATIONS.map((dest) => ({ url: `${BASE_URL}/${dest.slug}/` })),
  ];

  await crawler.run(seedUrls);

  // ── Fallback: Seed destinations not found during live scraping ─────────
  // Capital Vacations uses Greenshift page builder (JS-heavy). Some pages
  // render server-side, others don't. Seed remaining from known catalog.

  let seededCount = 0;
  for (const dest of DESTINATIONS) {
    for (const resort of dest.resorts) {
      const key = `cv-${dest.city}-${resort}-${dest.price}`;
      if (processedKeys.has(key)) continue;

      processedKeys.add(key);
      seededCount++;

      const deal: ScrapedDeal = {
        title: `Capital Vacations ${dest.city} – ${resort}`,
        price: dest.price,
        durationNights: dest.durationNights,
        durationDays: dest.durationDays,
        description: `${dest.durationDays} Days / ${dest.durationNights} Nights at ${resort} in ${dest.city}, ${dest.state}. Sleeps up to 4 guests. 12 months to travel with no blackout dates. Taxes and resort fees due at check-in.`,
        resortName: resort,
        url: `${BASE_URL}/${dest.slug}/`,
        inclusions: [
          `${dest.durationDays} Days / ${dest.durationNights} Nights accommodation`,
          "Sleeps up to 4 guests",
          "12 months to travel, no blackout dates",
          "Guaranteed pricing",
          ...dest.amenities.slice(0, 4).map((a) => `${a} access`),
        ],
        requirements: [
          "Attend 90-120 minute timeshare sales presentation",
          "$600 penalty for not attending presentation",
          "No purchase obligation",
          "Taxes and resort fees due at check-in",
        ],
        presentationMinutes: 120,
        travelWindow: "12 months from purchase, no blackout dates",
        city: dest.city,
        state: dest.state,
        country: "US",
        brandSlug: "capital-vacations",
      };

      try {
        await storeDeal(deal, "capital-vacations");
        console.log(
          `[capital-vacations] Seeded: ${deal.title} ($${deal.price})`
        );
      } catch (err) {
        console.error(
          `[capital-vacations] Failed to seed ${deal.title}: ${err}`
        );
      }
    }
  }

  if (seededCount > 0) {
    console.log(
      `[capital-vacations] Seeded ${seededCount} deal(s) from catalog. ` +
        `Site uses Greenshift page builder (JS-heavy); consider PlaywrightCrawler for full scraping.`
    );
  }

  if (scrapedFromLive) {
    console.log(
      "[capital-vacations] Some prices were extracted from live pages."
    );
  }
}

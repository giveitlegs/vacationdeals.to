import { CheerioCrawler } from "crawlee";
import { storeDeal } from "../storage/deal-store";
import type { ScrapedDeal } from "@vacationdeals/shared";

/**
 * Hyatt Vacation Club crawler.
 *
 * Hyatt Vacation Club (hyattvacationclub.com) lists 9 resort vacation offers
 * on their /vacation-offers page. Each links to an individual offer detail page.
 *
 * The listing page shows resort names, destinations, and TripAdvisor ratings
 * but NOT prices. Prices are on the individual offer pages, rendered via JS.
 *
 * Strategy:
 *   1. Crawl /vacation-offers to discover all offer detail page URLs
 *   2. Crawl each detail page for price, duration, inclusions, and requirements
 *   3. Parse embedded JS/JSON data, meta tags, and DOM elements for pricing
 *   4. Fall back to known deal data when prices are JS-rendered and not extractable
 *
 * All offers require a 120-minute timeshare sales presentation.
 * Prices include tax and resort fee. Surcharges of $100-$200 may apply
 * for high-demand seasons.
 */

const BASE_URL = "https://www.hyattvacationclub.com";

// ── Known offer detail page paths ───────────────────────────────────────────
// These are the 9 resorts currently listed on the /vacation-offers page.

const OFFER_PATHS = [
  "/vacation-offer/sanantonio/wild_oak_ranch/wowb",
  "/vacation-offer/sandiegoarea/the_welk/welk",
  "/vacation-offer/sedona/pinon_pointe/ppwb",
  "/vacation-offer/laketahoearea-ca/northstar_lodge/nslt",
  "/vacation-offer/keywest/windward_pointe/wpwb",
  "/vacation-offer/cabosanlucas/sirena_del_mar/cabo",
  "/vacation-offer/branson/timber_ridge/bran",
  "/vacation-offer/bonitasprings/coconut_cove/cpwb",
  "/vacation-offer/maui/kaanapali_beach/kbwb",
];

// ── Known resort data ───────────────────────────────────────────────────────
// Prices gathered from live offer pages. Hyatt renders prices via JS, so
// static scraping may not capture them. This catalog serves as a reliable
// fallback and is updated when new prices are confirmed.

interface HyattResort {
  name: string;
  city: string;
  state?: string;
  country: string;
  address: string;
  path: string;
  price: number;
  durationNights: number;
  durationDays: number;
  program: "Portfolio" | "Platinum" | "Club to Club Exchange";
  surcharge: number; // max surcharge for high-demand seasons
  inclusions: string[];
  resortAmenities: string[];
}

const RESORTS: HyattResort[] = [
  {
    name: "Hyatt Vacation Club at Wild Oak Ranch",
    city: "San Antonio",
    state: "TX",
    country: "US",
    address: "9700 West Military Drive, San Antonio, TX 78251",
    path: "/vacation-offer/sanantonio/wild_oak_ranch/wowb",
    price: 517,
    durationNights: 3,
    durationDays: 4,
    program: "Portfolio",
    surcharge: 200,
    inclusions: [
      "4 Days / 3 Nights studio accommodations with kitchenette",
      "$50 Resort Certificate or 5,000 World of Hyatt Points",
      "Access to heated pools, lazy river, and putting green",
      "On-site dining privileges",
      "Up to 12 months to travel",
    ],
    resortAmenities: [
      "Heated pools",
      "Lazy river",
      "Putting green",
      "Nature trails",
      "Private patio",
    ],
  },
  {
    name: "Hyatt Vacation Club at The Welk",
    city: "San Diego",
    state: "CA",
    country: "US",
    address: "8860 Lawrence Welk Drive, Escondido, CA 92026",
    path: "/vacation-offer/sandiegoarea/the_welk/welk",
    price: 549,
    durationNights: 3,
    durationDays: 4,
    program: "Platinum",
    surcharge: 100,
    inclusions: [
      "4 Days / 3 Nights one-bedroom villa with full kitchen",
      "Private patio with washer & dryer",
      "Pool, spa, and fitness center access",
      "On-site dining",
      "Up to 12 months to travel",
    ],
    resortAmenities: [
      "Full kitchen",
      "Private patio",
      "Washer & dryer",
      "Pool and spa",
      "Fitness center",
    ],
  },
  {
    name: "Hyatt Vacation Club at Piñon Pointe",
    city: "Sedona",
    state: "AZ",
    country: "US",
    address: "1 North AZ-89A, Sedona, AZ 86336",
    path: "/vacation-offer/sedona/pinon_pointe/ppwb",
    price: 800,
    durationNights: 3,
    durationDays: 4,
    program: "Portfolio",
    surcharge: 200,
    inclusions: [
      "4 Days / 3 Nights studio accommodations with kitchenette",
      "5,000 World of Hyatt Bonus Points",
      "$50 Resort Certificate",
      "Pool access and kid-friendly amenities",
      "Up to 12 months to travel",
    ],
    resortAmenities: [
      "Kitchenette",
      "Private patio",
      "Pool",
      "Kid-friendly amenities",
    ],
  },
  {
    name: "Hyatt Vacation Club at Northstar Lodge",
    city: "Lake Tahoe",
    state: "CA",
    country: "US",
    address: "970 Northstar Drive, Truckee, CA 96161",
    path: "/vacation-offer/laketahoearea-ca/northstar_lodge/nslt",
    price: 599,
    durationNights: 3,
    durationDays: 4,
    program: "Platinum",
    surcharge: 100,
    inclusions: [
      "4 Days / 3 Nights at Hyatt Regency Resort, Spa, and Casino",
      "Preview at Hyatt Vacation Club, Northstar Lodge",
      "Pool, hot tub, movie theater, and fire pit access",
      "Lake Tahoe area activities and experiences",
      "Up to 12 months to travel",
    ],
    resortAmenities: [
      "Pool and hot tub",
      "Movie theater",
      "Fire pit",
      "Spa",
    ],
  },
  {
    name: "Hyatt Vacation Club at Windward Pointe",
    city: "Key West",
    state: "FL",
    country: "US",
    address: "3675 South Roosevelt Boulevard, Key West, FL 33040",
    path: "/vacation-offer/keywest/windward_pointe/wpwb",
    price: 699,
    durationNights: 3,
    durationDays: 4,
    program: "Portfolio",
    surcharge: 200,
    inclusions: [
      "4 Days / 3 Nights studio accommodations with kitchenette",
      "$50 Resort Certificate or 5,000 World of Hyatt Points",
      "Resort amenities access",
      "Up to 12 months to travel",
    ],
    resortAmenities: [
      "Kitchenette",
      "Pool",
      "Screened lanai",
    ],
  },
  {
    name: "Hyatt Vacation Club at Sirena del Mar",
    city: "Cabo San Lucas",
    state: undefined,
    country: "MX",
    address: "Km 4.5 Corredor Turistico, Cabo Bello, Cabo San Lucas, BS, MX 23410",
    path: "/vacation-offer/cabosanlucas/sirena_del_mar/cabo",
    price: 899,
    durationNights: 3,
    durationDays: 4,
    program: "Platinum",
    surcharge: 100,
    inclusions: [
      "4 Days / 3 Nights one-bedroom villa with full kitchen",
      "Private patio with washer & dryer",
      "Pool, on-site dining, and spa services",
      "Up to 12 months to travel",
    ],
    resortAmenities: [
      "Full kitchen",
      "Private patio",
      "Washer & dryer",
      "Pool",
      "Spa",
      "On-site dining",
    ],
  },
  {
    name: "Hyatt Vacation Club at The Lodges at Timber Ridge",
    city: "Branson",
    state: "MO",
    country: "US",
    address: "147 Welk Resort Circle, Branson, MO 65616",
    path: "/vacation-offer/branson/timber_ridge/bran",
    price: 399,
    durationNights: 3,
    durationDays: 4,
    program: "Platinum",
    surcharge: 100,
    inclusions: [
      "4 Days / 3 Nights one-bedroom villa with full kitchen",
      "$50 Branson Show Credit",
      "Fireplace, private patio, washer & dryer",
      "Fitness center and guided activities",
      "Up to 12 months to travel",
    ],
    resortAmenities: [
      "Full kitchen",
      "Fireplace",
      "Private patio",
      "Washer & dryer",
      "Fitness center",
    ],
  },
  {
    name: "Hyatt Vacation Club at Coconut Cove",
    city: "Bonita Springs",
    state: "FL",
    country: "US",
    address: "11800 Coconut Cove Drive, Bonita Springs, FL 34134",
    path: "/vacation-offer/bonitasprings/coconut_cove/cpwb",
    price: 599,
    durationNights: 3,
    durationDays: 4,
    program: "Portfolio",
    surcharge: 200,
    inclusions: [
      "4 Days / 3 Nights studio with kitchenette and screened lanai",
      "$50 Resort Certificate or 5,000 World of Hyatt Points",
      "Lazy river, pools, spa, steam room, and sauna",
      "Up to 12 months to travel",
    ],
    resortAmenities: [
      "Kitchenette",
      "Screened lanai",
      "Lazy river",
      "Pools",
      "Spa",
      "Steam room",
      "Sauna",
    ],
  },
  {
    name: "Hyatt Vacation Club at Ka'anapali Beach",
    city: "Maui",
    state: "HI",
    country: "US",
    address: "180 Nohea Kai Drive, Lahaina, Maui, HI 96761",
    path: "/vacation-offer/maui/kaanapali_beach/kbwb",
    price: 999,
    durationNights: 3,
    durationDays: 4,
    program: "Club to Club Exchange",
    surcharge: 200,
    inclusions: [
      "4 Days / 3 Nights accommodations",
      "$50 Resort Certificate or 5,000 World of Hyatt Points",
      "Beachfront resort amenities",
      "Up to 12 months to travel",
    ],
    resortAmenities: [
      "Beachfront location",
      "Pool",
      "On-site dining",
    ],
  },
];

// ── Helpers ─────────────────────────────────────────────────────────────────

function parsePrice(text: string): number | null {
  const match = text.replace(/,/g, "").match(/\$\s*(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

function parseDuration(text: string): { nights: number; days: number } | null {
  let m = text.match(/(\d+)\s*Days?\s*[/,]\s*(\d+)\s*Nights?/i);
  if (m) return { days: parseInt(m[1], 10), nights: parseInt(m[2], 10) };

  m = text.match(/(\d+)\s*Nights?\s*[/,]\s*(\d+)\s*Days?/i);
  if (m) return { nights: parseInt(m[1], 10), days: parseInt(m[2], 10) };

  m = text.match(/(\d+)\s*[- ]?night/i);
  if (m) {
    const nights = parseInt(m[1], 10);
    return { nights, days: nights + 1 };
  }

  return null;
}

function resolveUrl(href: string): string {
  if (!href) return "";
  if (href.startsWith("http")) return href;
  return `${BASE_URL}${href.startsWith("/") ? "" : "/"}${href}`;
}

function findResortByPath(path: string): HyattResort | undefined {
  return RESORTS.find((r) => path.includes(r.path) || r.path.includes(path));
}

// ── Main crawler ────────────────────────────────────────────────────────────

export async function runHyattCrawler() {
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

      // ── Strategy 1: Extract price from JS/data attributes ─────────────
      // Hyatt renders prices via JavaScript. Look for price data in:
      // - data attributes on DOM elements
      // - Inline script variables
      // - JSON-LD structured data
      // - Meta tags

      let extractedPrice: number | null = null;
      let extractedDuration: { nights: number; days: number } | null = null;

      // Check for price in data attributes
      $("[data-price], [data-offer-price]").each((_i, el) => {
        const priceAttr =
          $(el).attr("data-price") || $(el).attr("data-offer-price") || "";
        const price = parsePrice(priceAttr);
        if (price && price >= 100 && price <= 2000) {
          extractedPrice = price;
        }
      });

      // Check for price in inline scripts
      const scriptTexts: string[] = [];
      $("script").each((_i, el) => {
        const content = $(el).html() || "";
        if (content.length > 0) scriptTexts.push(content);
      });

      for (const scriptContent of scriptTexts) {
        // Look for price variables: price = 517, offerPrice: 517, etc.
        const pricePatterns = [
          /(?:price|offerPrice|packagePrice|amount)\s*[=:]\s*["']?\$?(\d{2,4})["']?/gi,
          /\$(\d{3,4})/g,
        ];

        for (const pattern of pricePatterns) {
          let match: RegExpExecArray | null;
          while ((match = pattern.exec(scriptContent)) !== null) {
            const price = parseInt(match[1], 10);
            if (price >= 100 && price <= 2000 && !extractedPrice) {
              extractedPrice = price;
            }
          }
        }

        // Look for duration in scripts
        const durMatch = scriptContent.match(
          /(\d+)\s*(?:days?|nights?)[\s/,]*(\d+)\s*(?:days?|nights?)/i
        );
        if (durMatch && !extractedDuration) {
          extractedDuration = parseDuration(durMatch[0]);
        }
      }

      // Check JSON-LD for pricing
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
            if (price >= 100 && price <= 2000) {
              extractedPrice = price;
            }
          }
          if (data.price) {
            const price =
              typeof data.price === "string"
                ? parseInt(data.price, 10)
                : data.price;
            if (price >= 100 && price <= 2000) {
              extractedPrice = price;
            }
          }
        } catch {
          // skip
        }
      });

      // Check meta tags for pricing
      const ogPrice =
        $('meta[property="og:price:amount"]').attr("content") ||
        $('meta[property="product:price:amount"]').attr("content") ||
        "";
      if (ogPrice) {
        const price = parseInt(ogPrice, 10);
        if (price >= 100 && price <= 2000) {
          extractedPrice = price;
        }
      }

      // ── Strategy 2: Parse DOM content for price ───────────────────────
      // Look for price displayed in text (may be "$" placeholder if JS-rendered)
      const priceElements = $(
        '[class*="price"], [class*="cost"], [class*="amount"], .offer-price'
      );
      priceElements.each((_i, el) => {
        const text = $(el).text().trim();
        const price = parsePrice(text);
        if (price && price >= 100 && price <= 2000 && !extractedPrice) {
          extractedPrice = price;
        }
      });

      // Also check for price in the general page text (pattern: "$517 per family")
      const bodyText = $("body").text();
      const bodyPriceMatch = bodyText.match(
        /\$\s*(\d{3,4})\s*(?:per\s*family|per\s*couple)?/i
      );
      if (bodyPriceMatch && !extractedPrice) {
        const price = parseInt(bodyPriceMatch[1], 10);
        if (price >= 100 && price <= 2000) {
          extractedPrice = price;
        }
      }

      // Parse duration from page text
      if (!extractedDuration) {
        extractedDuration = parseDuration(bodyText);
      }

      // ── Strategy 3: Extract resort name and details ───────────────────
      const resortNameEl = $("h1, [class*='resort-name'], [class*='property-name']").first();
      const pageResortName = resortNameEl.text().trim() || "";

      // Match to known resort for enrichment
      const knownResort = findResortByPath(currentUrl);

      if (knownResort) {
        const price = extractedPrice || knownResort.price;
        const key = `hyatt-${knownResort.city}-${price}`;

        if (!processedKeys.has(key)) {
          processedKeys.add(key);

          if (extractedPrice) {
            scrapedFromLive = true;
            log.info(
              `Extracted live price $${extractedPrice} for ${knownResort.name}`
            );
          }

          const deal: ScrapedDeal = {
            title: `${knownResort.name} Getaway`,
            price,
            durationNights:
              extractedDuration?.nights || knownResort.durationNights,
            durationDays: extractedDuration?.days || knownResort.durationDays,
            description: `${knownResort.durationDays} Days / ${knownResort.durationNights} Nights at ${knownResort.name} in ${knownResort.city}${knownResort.state ? `, ${knownResort.state}` : ""}. Price includes tax and resort fee. Surcharge of up to $${knownResort.surcharge} may apply for high-demand seasons.`,
            resortName: knownResort.name,
            url: `${BASE_URL}${knownResort.path}`,
            inclusions: knownResort.inclusions,
            requirements: [
              "Attend 120-minute timeshare sales presentation",
              `${knownResort.program} Program presentation`,
              "Both spouses/partners must attend if applicable",
              "Valid ID and major credit card required",
            ],
            presentationMinutes: 120,
            travelWindow: "Up to 12 months from purchase",
            city: knownResort.city,
            state: knownResort.state,
            country: knownResort.country,
            brandSlug: "hyatt",
          };

          try {
            await storeDeal(deal, "hyatt", html);
            log.info(
              `Stored deal: ${deal.title} ($${deal.price}) [${extractedPrice ? "live" : "catalog"}]`
            );
          } catch (err) {
            log.error(`Failed to store deal ${deal.title}: ${err}`);
          }
        }
      }

      // ── Discover offer pages from the listing page ────────────────────
      if (
        currentUrl.includes("/vacation-offers") &&
        !currentUrl.includes("/vacation-offer/")
      ) {
        const offerLinks = new Set<string>();

        $('a[href*="/vacation-offer/"]').each((_i, el) => {
          const href = $(el).attr("href");
          if (!href) return;
          const fullUrl = resolveUrl(href);
          if (!offerLinks.has(fullUrl)) {
            offerLinks.add(fullUrl);
          }
        });

        if (offerLinks.size > 0) {
          const urls = Array.from(offerLinks).map((url) => ({ url }));
          await crawler.addRequests(urls);
          log.info(`Enqueued ${offerLinks.size} offer detail pages`);
        }
      }
    },

    async failedRequestHandler({ request, log }) {
      log.warning(`Request failed: ${request.url}`);
    },
  });

  // ── Run crawler ─────────────────────────────────────────────────────────
  // Start from the listing page and all known offer detail pages
  const seedUrls = [
    { url: `${BASE_URL}/vacation-offers` },
    ...OFFER_PATHS.map((path) => ({ url: `${BASE_URL}${path}` })),
  ];

  await crawler.run(seedUrls);

  // ── Fallback: Seed any resorts not found during live scraping ──────────
  // Hyatt renders prices via JavaScript, so CheerioCrawler often cannot
  // extract them. Seed remaining resorts from the known catalog.

  let seededCount = 0;
  for (const resort of RESORTS) {
    const key = `hyatt-${resort.city}-${resort.price}`;
    if (processedKeys.has(key)) continue;

    processedKeys.add(key);
    seededCount++;

    const deal: ScrapedDeal = {
      title: `${resort.name} Getaway`,
      price: resort.price,
      durationNights: resort.durationNights,
      durationDays: resort.durationDays,
      description: `${resort.durationDays} Days / ${resort.durationNights} Nights at ${resort.name} in ${resort.city}${resort.state ? `, ${resort.state}` : ""}. Price includes tax and resort fee. Surcharge of up to $${resort.surcharge} may apply for high-demand seasons.`,
      resortName: resort.name,
      url: `${BASE_URL}${resort.path}`,
      inclusions: resort.inclusions,
      requirements: [
        "Attend 120-minute timeshare sales presentation",
        `${resort.program} Program presentation`,
        "Both spouses/partners must attend if applicable",
        "Valid ID and major credit card required",
      ],
      presentationMinutes: 120,
      travelWindow: "Up to 12 months from purchase",
      city: resort.city,
      state: resort.state,
      country: resort.country,
      brandSlug: "hyatt",
    };

    try {
      await storeDeal(deal, "hyatt");
      console.log(`[hyatt] Seeded: ${deal.title} ($${deal.price})`);
    } catch (err) {
      console.error(`[hyatt] Failed to seed ${deal.title}: ${err}`);
    }
  }

  if (seededCount > 0) {
    console.log(
      `[hyatt] Seeded ${seededCount} resort(s) from catalog. ` +
        `Hyatt renders prices via JS; consider PlaywrightCrawler for full live scraping.`
    );
  }

  if (scrapedFromLive) {
    console.log("[hyatt] Some prices were extracted from live pages.");
  }
}

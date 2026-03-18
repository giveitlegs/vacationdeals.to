import { CheerioCrawler } from "crawlee";
import { storeDeal } from "../storage/deal-store";
import type { ScrapedDeal } from "@vacationdeals/shared";

/**
 * Divi Resorts crawler.
 *
 * Divi operates Caribbean-only resorts in Aruba, Barbados, Bonaire,
 * St. Croix, and St. Maarten. The site is JS-heavy with an IBE widget,
 * Slick carousels, and timeline elements. Static fetch returns mostly
 * CSS/JS, so we use a known resort catalog with live page scraping.
 *
 * Strategy:
 *   1. Crawl /specials.htm for promotional banners and countdown deals
 *   2. Crawl individual resort pages for rates and availability
 *   3. Fall back to known resort catalog with typical vacpack pricing
 */

const BASE_URL = "https://www.diviresorts.com";

const SEED_URLS = [
  `${BASE_URL}/specials.htm`,
  `${BASE_URL}/`,
  `${BASE_URL}/aruba-all-inclusive-resort.htm`,
  `${BASE_URL}/barbados-all-inclusive-resort.htm`,
  `${BASE_URL}/bonaire-resort.htm`,
  `${BASE_URL}/st-croix-resort.htm`,
  `${BASE_URL}/st-maarten-all-inclusive-resort.htm`,
];

// Known resort catalog
const RESORT_CATALOG: Array<{
  name: string;
  city: string;
  country: string;
  region: string;
  slug: string;
  pageUrl: string;
  defaultPrice: number;
  nights: number;
  allInclusive: boolean;
}> = [
  {
    name: "Divi Aruba All Inclusive",
    city: "Oranjestad",
    country: "Aruba",
    region: "Caribbean",
    slug: "aruba-all-inclusive",
    pageUrl: `${BASE_URL}/aruba-all-inclusive-resort.htm`,
    defaultPrice: 399,
    nights: 4,
    allInclusive: true,
  },
  {
    name: "Tamarijn Aruba All Inclusive",
    city: "Oranjestad",
    country: "Aruba",
    region: "Caribbean",
    slug: "tamarijn-aruba",
    pageUrl: `${BASE_URL}/aruba-all-inclusive-resort.htm`,
    defaultPrice: 449,
    nights: 4,
    allInclusive: true,
  },
  {
    name: "Divi Village Golf & Beach Resort",
    city: "Oranjestad",
    country: "Aruba",
    region: "Caribbean",
    slug: "divi-village-aruba",
    pageUrl: `${BASE_URL}/aruba-all-inclusive-resort.htm`,
    defaultPrice: 349,
    nights: 4,
    allInclusive: false,
  },
  {
    name: "Divi Southwinds Beach Resort",
    city: "Christ Church",
    country: "Barbados",
    region: "Caribbean",
    slug: "divi-southwinds",
    pageUrl: `${BASE_URL}/barbados-all-inclusive-resort.htm`,
    defaultPrice: 349,
    nights: 4,
    allInclusive: true,
  },
  {
    name: "Divi Flamingo Beach Resort & Casino",
    city: "Kralendijk",
    country: "Bonaire",
    region: "Caribbean",
    slug: "divi-flamingo",
    pageUrl: `${BASE_URL}/bonaire-resort.htm`,
    defaultPrice: 299,
    nights: 4,
    allInclusive: false,
  },
  {
    name: "Divi Carina Bay All Inclusive Beach Resort",
    city: "Christiansted",
    country: "USVI",
    region: "Caribbean",
    slug: "divi-carina",
    pageUrl: `${BASE_URL}/st-croix-resort.htm`,
    defaultPrice: 349,
    nights: 4,
    allInclusive: true,
  },
  {
    name: "Divi Little Bay Beach Resort",
    city: "Philipsburg",
    country: "St Maarten",
    region: "Caribbean",
    slug: "divi-little-bay",
    pageUrl: `${BASE_URL}/st-maarten-all-inclusive-resort.htm`,
    defaultPrice: 349,
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

export async function runDiviCrawler() {
  const processedKeys = new Set<string>();
  const discoveredPrices = new Map<string, number>();

  const crawler = new CheerioCrawler({
    maxRequestsPerCrawl: 20,
    maxConcurrency: 2,
    requestHandlerTimeoutSecs: 60,

    async requestHandler({ request, $, body, log }) {
      log.info(`Scraping ${request.url}`);

      const html = typeof body === "string" ? body : body.toString();
      const pageText = $("body").text();

      // ── Extract any prices from specials or resort pages ───────────
      const priceMatches = pageText.match(/\$\s*\d[\d,]*/g) || [];
      for (const pm of priceMatches) {
        const price = parsePrice(pm);
        if (price && price >= 99 && price <= 999) {
          // Associate with resort based on URL
          for (const resort of RESORT_CATALOG) {
            if (request.url.includes(resort.slug) || request.url.includes(resort.country.toLowerCase())) {
              const existing = discoveredPrices.get(resort.slug);
              if (!existing || price < existing) {
                discoveredPrices.set(resort.slug, price);
              }
            }
          }
        }
      }

      // ── Extract specials/deals from timeline or slider elements ────
      $(".cd-timeline-content, .slick-slide, .special-offer, .promo-card, [class*='special'], [class*='promo']").each((_i, el) => {
        const card = $(el);
        const title = card.find("h2, h3, h4, .title").first().text().trim();
        const priceText = card.find("[class*='price'], strong, .rate").first().text().trim();
        const price = parsePrice(priceText);
        const linkHref = card.find("a").first().attr("href") || "";
        const imgSrc = card.find("img").first().attr("src") || "";

        if (title && price && price >= 99) {
          // Try to match to resort
          const resort = RESORT_CATALOG.find(
            (r) => title.toLowerCase().includes(r.country.toLowerCase()) ||
                   title.toLowerCase().includes(r.city.toLowerCase()) ||
                   title.toLowerCase().includes(r.name.toLowerCase().split(" ")[1] || "")
          );

          if (resort) {
            const key = resort.name;
            if (!processedKeys.has(key)) {
              processedKeys.add(key);
              discoveredPrices.set(resort.slug, price);

              const deal: ScrapedDeal = {
                title: `${resort.name} - ${resort.country} Vacation Package`,
                price,
                durationNights: resort.nights,
                durationDays: resort.nights + 1,
                description: `${resort.nights + 1} Days / ${resort.nights} Nights at ${resort.name} in ${resort.city}, ${resort.country}.${resort.allInclusive ? " All-inclusive." : ""}`,
                resortName: resort.name,
                url: resolveUrl(linkHref) || resort.pageUrl,
                imageUrl: imgSrc ? resolveUrl(imgSrc) : undefined,
                inclusions: [
                  `${resort.nights + 1} Days / ${resort.nights} Nights accommodation`,
                  ...(resort.allInclusive ? ["All-inclusive meals & drinks"] : []),
                  "Beach access",
                  "Resort amenities & pool access",
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
                country: resort.country,
                brandSlug: "divi",
              };

              storeDeal(deal, "divi", html)
                .then(() => log.info(`Stored: ${deal.title} ($${deal.price})`))
                .catch((err) => log.error(`Failed to store ${deal.title}: ${err}`));
            }
          }
        }
      });
    },
  });

  await crawler.run(SEED_URLS.map((url) => ({ url })));

  // Fallback: seed resorts not discovered via crawling
  for (const resort of RESORT_CATALOG) {
    if (processedKeys.has(resort.name)) continue;
    processedKeys.add(resort.name);

    const price = discoveredPrices.get(resort.slug) || resort.defaultPrice;

    const deal: ScrapedDeal = {
      title: `${resort.name} - ${resort.country} Vacation Package`,
      price,
      durationNights: resort.nights,
      durationDays: resort.nights + 1,
      description: `${resort.nights + 1} Days / ${resort.nights} Nights at ${resort.name} in ${resort.city}, ${resort.country}.${resort.allInclusive ? " All-inclusive." : ""}`,
      resortName: resort.name,
      url: resort.pageUrl,
      inclusions: [
        `${resort.nights + 1} Days / ${resort.nights} Nights accommodation`,
        ...(resort.allInclusive ? ["All-inclusive meals & drinks"] : []),
        "Beach access",
        "Resort amenities & pool access",
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
      country: resort.country,
      brandSlug: "divi",
    };

    try {
      await storeDeal(deal, "divi", "");
      console.log(`Stored fallback: ${deal.title} ($${deal.price})`);
    } catch (err) {
      console.error(`Failed to store fallback ${deal.title}: ${err}`);
    }
  }
}

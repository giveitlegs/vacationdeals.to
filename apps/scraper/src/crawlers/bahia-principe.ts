import { CheerioCrawler } from "crawlee";
import { storeDeal } from "../storage/deal-store";
import type { ScrapedDeal } from "@vacationdeals/shared";

/**
 * Bahia Principe Privilege Club crawler.
 *
 * Bahia Principe operates all-inclusive resorts in Dominican Republic,
 * Mexico (Riviera Maya), Jamaica, and Spain. The privilege club site
 * (bpprivilegeclub.com) has a blog/sales section and homepage slider
 * with promotions. The sales category page sometimes returns empty.
 *
 * Strategy:
 *   1. Crawl homepage for slider promos with images and offers
 *   2. Crawl /blog/ for recent promotional blog posts
 *   3. Build deals from known resort catalog with discovered promo info
 */

const BASE_URL = "https://bpprivilegeclub.com";

const SEED_URLS = [
  `${BASE_URL}/`,
  `${BASE_URL}/blog/`,
  `${BASE_URL}/blog/sales/`,
];

// Known resort catalog
const RESORT_CATALOG: Array<{
  name: string;
  city: string;
  state?: string;
  country: string;
  countryCode: string;
  slug: string;
  defaultPrice: number;
  nights: number;
}> = [
  {
    name: "Bahia Principe Grand Punta Cana",
    city: "Punta Cana",
    state: "La Altagracia",
    country: "Dominican Republic",
    countryCode: "DO",
    slug: "grand-punta-cana",
    defaultPrice: 399,
    nights: 5,
  },
  {
    name: "Bahia Principe Luxury Ambar",
    city: "Punta Cana",
    state: "La Altagracia",
    country: "Dominican Republic",
    countryCode: "DO",
    slug: "luxury-ambar",
    defaultPrice: 499,
    nights: 5,
  },
  {
    name: "Bahia Principe Grand La Romana",
    city: "La Romana",
    country: "Dominican Republic",
    countryCode: "DO",
    slug: "grand-la-romana",
    defaultPrice: 349,
    nights: 5,
  },
  {
    name: "Bahia Principe Grand Bavaro",
    city: "Punta Cana",
    state: "La Altagracia",
    country: "Dominican Republic",
    countryCode: "DO",
    slug: "grand-bavaro",
    defaultPrice: 379,
    nights: 5,
  },
  {
    name: "Bahia Principe Grand Tulum",
    city: "Riviera Maya",
    state: "Quintana Roo",
    country: "Mexico",
    countryCode: "MX",
    slug: "grand-tulum",
    defaultPrice: 449,
    nights: 5,
  },
  {
    name: "Bahia Principe Grand Tequila",
    city: "Riviera Maya",
    state: "Quintana Roo",
    country: "Mexico",
    countryCode: "MX",
    slug: "grand-tequila",
    defaultPrice: 479,
    nights: 5,
  },
  {
    name: "Bahia Principe Grand Jamaica",
    city: "Runaway Bay",
    country: "Jamaica",
    countryCode: "JM",
    slug: "grand-jamaica",
    defaultPrice: 449,
    nights: 5,
  },
  {
    name: "Bahia Principe Luxury Runaway Bay",
    city: "Runaway Bay",
    country: "Jamaica",
    countryCode: "JM",
    slug: "luxury-runaway-bay",
    defaultPrice: 549,
    nights: 5,
  },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function parsePrice(text: string): number | null {
  const match = text.replace(/,/g, "").match(/\$\s*(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

function parsePercent(text: string): number | null {
  const match = text.match(/(\d+)\s*%/);
  return match ? parseInt(match[1], 10) : null;
}

function resolveUrl(href: string): string {
  if (!href) return "";
  if (href.startsWith("http")) return href;
  return `${BASE_URL}${href.startsWith("/") ? "" : "/"}${href}`;
}

// ── Main crawler ─────────────────────────────────────────────────────────────

export async function runBahiaPrincipeCrawler() {
  const processedKeys = new Set<string>();
  let currentPromoDiscount = 0;
  let currentPromoName = "";

  const crawler = new CheerioCrawler({
    maxRequestsPerCrawl: 20,
    maxConcurrency: 2,
    requestHandlerTimeoutSecs: 60,

    async requestHandler({ request, $, body, log }) {
      log.info(`Scraping ${request.url}`);

      const html = typeof body === "string" ? body : body.toString();
      const pageText = $("body").text();

      // ── Extract promo info from slider/homepage ────────────────────
      $(".slider-item, .swiper-slide, [class*='slide'], [class*='promo'], [class*='offer']").each((_i, el) => {
        const slide = $(el);
        const text = slide.text().trim();
        const discount = parsePercent(text);
        if (discount && discount > currentPromoDiscount) {
          currentPromoDiscount = discount;
        }

        // Extract promo name (e.g., "Black Friday 2025")
        const heading = slide.find("h1, h2, h3").first().text().trim();
        if (heading && heading.length < 60) {
          currentPromoName = heading;
        }

        // Look for promo image
        const imgSrc = slide.find("img").first().attr("src") || "";
        if (imgSrc.includes("offers.bpprivilegeclub.com")) {
          log.info(`Found promo image: ${imgSrc}`);
        }
      });

      // ── Extract blog post links to sales pages ─────────────────────
      $('a[href*="/blog/"]').each((_i, el) => {
        const href = $(el).attr("href") || "";
        const text = $(el).text().trim().toLowerCase();

        if (text.includes("sale") || text.includes("promo") || text.includes("offer") || text.includes("deal")) {
          const fullUrl = resolveUrl(href);
          crawler.addRequests([{ url: fullUrl }]).catch(() => {});
        }
      });

      // ── Look for promotional pricing on any page ───────────────────
      const priceMatches = pageText.match(/\$\s*\d[\d,]*/g) || [];
      for (const pm of priceMatches) {
        const price = parsePrice(pm);
        if (price && price >= 99 && price <= 999) {
          // Try to find which resort it belongs to
          for (const resort of RESORT_CATALOG) {
            const resortWords = resort.name.toLowerCase();
            if (pageText.toLowerCase().includes(resort.city.toLowerCase()) &&
                (pageText.toLowerCase().includes("grand") || pageText.toLowerCase().includes("luxury"))) {
              const key = resort.name;
              if (!processedKeys.has(key) && price < resort.defaultPrice) {
                resort.defaultPrice = price; // Update with discovered price
              }
            }
          }
        }
      }

      // ── Parse blog entry cards ─────────────────────────────────────
      $(".main-post, .entry, article, .post").each((_i, el) => {
        const post = $(el);
        const title = post.find("h2, h3, .entry-title").first().text().trim();
        const href = post.find("a").first().attr("href") || "";
        const imgSrc = post.find("img").first().attr("src") || post.find(".entry-media img").first().attr("src") || "";

        if (title && href) {
          // Check if this blog post relates to a resort
          for (const resort of RESORT_CATALOG) {
            if (title.toLowerCase().includes(resort.city.toLowerCase()) ||
                title.toLowerCase().includes(resort.slug.replace(/-/g, " "))) {
              log.info(`Found blog post about ${resort.name}: ${title}`);
            }
          }
        }
      });
    },
  });

  await crawler.run(SEED_URLS.map((url) => ({ url })));

  // Seed all resorts with catalog data
  for (const resort of RESORT_CATALOG) {
    if (processedKeys.has(resort.name)) continue;
    processedKeys.add(resort.name);

    const inclusions = [
      `${resort.nights + 1} Days / ${resort.nights} Nights accommodation`,
      "All-inclusive meals & drinks",
      "Entertainment & activities",
      "Beach & pool access",
      ...(currentPromoName ? [`${currentPromoName} promotion`] : []),
    ];

    const deal: ScrapedDeal = {
      title: `${resort.name} - ${resort.city} All-Inclusive Package`,
      price: resort.defaultPrice,
      ...(currentPromoDiscount > 0 ? {
        originalPrice: Math.round(resort.defaultPrice / (1 - currentPromoDiscount / 100)),
        savingsPercent: currentPromoDiscount,
      } : {}),
      durationNights: resort.nights,
      durationDays: resort.nights + 1,
      description: `${resort.nights + 1} Days / ${resort.nights} Nights all-inclusive at ${resort.name} in ${resort.city}, ${resort.country}. Timeshare preview package.`,
      resortName: resort.name,
      url: `${BASE_URL}/`,
      inclusions,
      requirements: [
        "Must be 25+ years old",
        "Married/cohabiting couples must both attend",
        "Valid ID and credit card required",
        "Attend timeshare presentation (~90-120 min)",
      ],
      presentationMinutes: 120,
      city: resort.city,
      state: resort.state,
      country: resort.countryCode,
      brandSlug: "bahia-principe",
    };

    try {
      await storeDeal(deal, "bahia-principe", "");
      console.log(`Stored: ${deal.title} ($${deal.price})`);
    } catch (err) {
      console.error(`Failed to store ${deal.title}: ${err}`);
    }
  }
}

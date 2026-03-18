import { CheerioCrawler } from "crawlee";
import { storeDeal } from "../storage/deal-store";
import type { ScrapedDeal } from "@vacationdeals/shared";

/**
 * Pueblo Bonito Resorts crawler.
 *
 * Pueblo Bonito runs luxury all-inclusive resorts in Cabo, Mazatlan,
 * and San Miguel de Allende. The /save-big-2025 page features a single
 * promo with up to 55% off + spa credits, promo code BOOKEARLY25.
 *
 * Strategy:
 *   1. Crawl /save-big-2025 for the current promo (discount %, spa credits, travel window)
 *   2. Crawl /resorts to discover individual resort pages and build per-resort deals
 *   3. Build deals from known resort catalog with discovered promo pricing
 */

const BASE_URL = "https://www.pueblobonito.com";

const SEED_URLS = [
  `${BASE_URL}/save-big-2025`,
  `${BASE_URL}/resorts`,
  `${BASE_URL}/`,
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
  tier: "luxury" | "premium" | "standard";
}> = [
  {
    name: "Pueblo Bonito Pacifica Golf & Spa Resort",
    city: "Cabo San Lucas",
    state: "BCS",
    country: "MX",
    slug: "pacifica",
    defaultPrice: 499,
    nights: 5,
    tier: "luxury",
  },
  {
    name: "Pueblo Bonito Sunset Beach Golf & Spa Resort",
    city: "Cabo San Lucas",
    state: "BCS",
    country: "MX",
    slug: "sunset-beach",
    defaultPrice: 449,
    nights: 5,
    tier: "luxury",
  },
  {
    name: "Pueblo Bonito Los Cabos",
    city: "Cabo San Lucas",
    state: "BCS",
    country: "MX",
    slug: "los-cabos",
    defaultPrice: 349,
    nights: 5,
    tier: "premium",
  },
  {
    name: "Pueblo Bonito Rosé Resort & Spa",
    city: "Cabo San Lucas",
    state: "BCS",
    country: "MX",
    slug: "rose",
    defaultPrice: 399,
    nights: 5,
    tier: "premium",
  },
  {
    name: "Pueblo Bonito Montecristo Estates",
    city: "Cabo San Lucas",
    state: "BCS",
    country: "MX",
    slug: "montecristo",
    defaultPrice: 599,
    nights: 5,
    tier: "luxury",
  },
  {
    name: "Pueblo Bonito Mazatlan",
    city: "Mazatlan",
    state: "Sinaloa",
    country: "MX",
    slug: "mazatlan",
    defaultPrice: 299,
    nights: 4,
    tier: "standard",
  },
  {
    name: "Pueblo Bonito Emerald Bay Resort & Spa",
    city: "Mazatlan",
    state: "Sinaloa",
    country: "MX",
    slug: "emerald-bay",
    defaultPrice: 349,
    nights: 4,
    tier: "premium",
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

export async function runPuebloBtonitoCrawler() {
  const processedKeys = new Set<string>();
  let promoDiscount = 55; // "up to 55%" from save-big page
  let promoSpaCredit = 150;
  let promoCode = "BOOKEARLY25";
  let travelWindow = "October 15, 2025 – December 20, 2026";

  const crawler = new CheerioCrawler({
    maxRequestsPerCrawl: 20,
    maxConcurrency: 2,
    requestHandlerTimeoutSecs: 60,

    async requestHandler({ request, $, body, log }) {
      log.info(`Scraping ${request.url}`);

      const html = typeof body === "string" ? body : body.toString();
      const pageText = $("body").text();

      // ── Extract promo details from /save-big pages ─────────────────
      if (request.url.includes("save-big")) {
        const discountMatch = parsePercent(pageText);
        if (discountMatch) promoDiscount = discountMatch;

        const spaMatch = pageText.match(/\$(\d+)\s*(?:in\s+)?spa\s+credit/i);
        if (spaMatch) promoSpaCredit = parseInt(spaMatch[1], 10);

        const codeMatch = pageText.match(/(?:promo\s*code|code)\s*:?\s*(\w+)/i);
        if (codeMatch) promoCode = codeMatch[1];

        const windowMatch = pageText.match(/((?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}\s*[–-]\s*(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4})/i);
        if (windowMatch) travelWindow = windowMatch[1];

        log.info(`Promo: ${promoDiscount}% off, $${promoSpaCredit} spa credit, code: ${promoCode}`);
      }

      // ── Try to extract resort cards/links ──────────────────────────
      $('a[href*="/resorts/"], a[href*="pueblobonito.com"]').each((_i, el) => {
        const href = $(el).attr("href") || "";
        const text = $(el).text().trim();

        // Match to known resort
        const resort = RESORT_CATALOG.find(
          (r) => href.toLowerCase().includes(r.slug) ||
                 text.toLowerCase().includes(r.slug.replace(/-/g, " "))
        );
        if (!resort) return;

        const key = resort.name;
        if (processedKeys.has(key)) return;
        processedKeys.add(key);

        // Check for inline pricing
        const nearbyText = $(el).closest("div, section").text();
        const inlinePrice = parsePrice(nearbyText);
        const price = (inlinePrice && inlinePrice >= 99 && inlinePrice <= 999)
          ? inlinePrice
          : resort.defaultPrice;

        const imgSrc = $(el).closest("div, section").find("img").first().attr("src") || "";
        const imageUrl = imgSrc ? resolveUrl(imgSrc) : undefined;

        const deal: ScrapedDeal = {
          title: `${resort.name} - ${resort.city} Vacation Package`,
          price,
          originalPrice: Math.round(price / (1 - promoDiscount / 100)),
          durationNights: resort.nights,
          durationDays: resort.nights + 1,
          description: `${resort.nights + 1} Days / ${resort.nights} Nights at ${resort.name} in ${resort.city}, Mexico. Save up to ${promoDiscount}% with promo code ${promoCode}.`,
          resortName: resort.name,
          url: resolveUrl(href) || `${BASE_URL}/save-big-2025`,
          imageUrl,
          inclusions: [
            `${resort.nights + 1} Days / ${resort.nights} Nights accommodation`,
            "All-inclusive meals & drinks",
            `Up to $${promoSpaCredit} in spa credits`,
            `Promo code: ${promoCode}`,
            "Resort amenities & pool access",
          ],
          requirements: [
            "Must be 25+ years old",
            "Married/cohabiting couples must both attend",
            "Valid ID and credit card required",
            "Attend timeshare presentation (~90-120 min)",
          ],
          savingsPercent: promoDiscount,
          presentationMinutes: 120,
          travelWindow,
          city: resort.city,
          state: resort.state,
          country: resort.country,
          brandSlug: "pueblo-bonito",
        };

        storeDeal(deal, "pueblo-bonito", html)
          .then(() => log.info(`Stored: ${deal.title} ($${deal.price})`))
          .catch((err) => log.error(`Failed to store ${deal.title}: ${err}`));
      });

      // ── Discover additional pages ──────────────────────────────────
      $('a[href*="/resorts"]').each((_i, el) => {
        const href = $(el).attr("href");
        if (href) {
          crawler.addRequests([{ url: resolveUrl(href) }]).catch(() => {});
        }
      });
    },
  });

  await crawler.run(SEED_URLS.map((url) => ({ url })));

  // Fallback: seed resorts not found via crawling
  for (const resort of RESORT_CATALOG) {
    if (processedKeys.has(resort.name)) continue;
    processedKeys.add(resort.name);

    const deal: ScrapedDeal = {
      title: `${resort.name} - ${resort.city} Vacation Package`,
      price: resort.defaultPrice,
      originalPrice: Math.round(resort.defaultPrice / (1 - promoDiscount / 100)),
      durationNights: resort.nights,
      durationDays: resort.nights + 1,
      description: `${resort.nights + 1} Days / ${resort.nights} Nights at ${resort.name} in ${resort.city}, Mexico. Save up to ${promoDiscount}% with promo code ${promoCode}.`,
      resortName: resort.name,
      url: `${BASE_URL}/save-big-2025`,
      inclusions: [
        `${resort.nights + 1} Days / ${resort.nights} Nights accommodation`,
        "All-inclusive meals & drinks",
        `Up to $${promoSpaCredit} in spa credits`,
        `Promo code: ${promoCode}`,
        "Resort amenities & pool access",
      ],
      requirements: [
        "Must be 25+ years old",
        "Married/cohabiting couples must both attend",
        "Valid ID and credit card required",
        "Attend timeshare presentation (~90-120 min)",
      ],
      savingsPercent: promoDiscount,
      presentationMinutes: 120,
      travelWindow,
      city: resort.city,
      state: resort.state,
      country: resort.country,
      brandSlug: "pueblo-bonito",
    };

    try {
      await storeDeal(deal, "pueblo-bonito", "");
      console.log(`Stored fallback: ${deal.title} ($${deal.price})`);
    } catch (err) {
      console.error(`Failed to store fallback ${deal.title}: ${err}`);
    }
  }
}

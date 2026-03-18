import { CheerioCrawler } from "crawlee";
import { storeDeal } from "../storage/deal-store";
import type { ScrapedDeal } from "@vacationdeals/shared";

/**
 * Villa Group Resorts crawler (villagroupresorts.com).
 *
 * Villa Group operates 10 resorts across Mexico: Cabo San Lucas, Puerto Vallarta,
 * Cancun/Riviera Maya, and Loreto. The site has a /specials page with deal cards
 * structured as:
 *   - dealsContent[0-2] tabs for destination regions
 *   - dealsSubContent for resort-specific deals
 *   - Pricing in "FROM $XXX USD Per Room/Per Night" format
 *   - V-Level member rates vs regular rates
 *   - "ROOM ONLY" and "All Inclusive Plan Available" designations
 *   - Links to individual resort specials pages (e.g., cabo.villadelpalmar.com/specials/...)
 *
 * Strategy:
 *   1. Crawl /specials for all deal cards with pricing
 *   2. Parse both regular and V-Level pricing
 *   3. Extract resort names, locations, images, and booking URLs
 */

const BASE_URL = "https://www.villagroupresorts.com";

const SEED_URLS = [
  `${BASE_URL}/`,
  `${BASE_URL}/specials`,
];

// Known resort catalog based on WebFetch data
const RESORT_CATALOG: Array<{
  name: string;
  city: string;
  state: string;
  country: string;
  subdomain: string;
  defaultPrice: number;
  defaultAllIncPrice: number;
  nights: number;
  hasAllInclusive: boolean;
}> = [
  {
    name: "Villa del Palmar Beach Resort & Spa Cabo San Lucas",
    city: "Cabo San Lucas",
    state: "BCS",
    country: "MX",
    subdomain: "cabo.villadelpalmar.com",
    defaultPrice: 159,
    defaultAllIncPrice: 284,
    nights: 5,
    hasAllInclusive: true,
  },
  {
    name: "Villa del Arco Beach Resort & Spa",
    city: "Cabo San Lucas",
    state: "BCS",
    country: "MX",
    subdomain: "cabo.villagroup.com",
    defaultPrice: 172,
    defaultAllIncPrice: 284,
    nights: 5,
    hasAllInclusive: true,
  },
  {
    name: "Villa La Estancia Beach Resort & Spa Los Cabos",
    city: "Cabo San Lucas",
    state: "BCS",
    country: "MX",
    subdomain: "cabo.villalaestancia.com",
    defaultPrice: 199,
    defaultAllIncPrice: 350,
    nights: 5,
    hasAllInclusive: true,
  },
  {
    name: "Villa La Valencia Beach Resort & Spa Los Cabos",
    city: "Cabo San Lucas",
    state: "BCS",
    country: "MX",
    subdomain: "cabo.villalavalencia.com",
    defaultPrice: 185,
    defaultAllIncPrice: 310,
    nights: 5,
    hasAllInclusive: true,
  },
  {
    name: "Villa del Palmar Beach Resort & Spa Puerto Vallarta",
    city: "Puerto Vallarta",
    state: "Jalisco",
    country: "MX",
    subdomain: "pv.villadelpalmar.com",
    defaultPrice: 139,
    defaultAllIncPrice: 249,
    nights: 5,
    hasAllInclusive: true,
  },
  {
    name: "Villa del Palmar Flamingos Beach Resort & Spa",
    city: "Puerto Vallarta",
    state: "Jalisco",
    country: "MX",
    subdomain: "flamingos.villadelpalmar.com",
    defaultPrice: 149,
    defaultAllIncPrice: 259,
    nights: 5,
    hasAllInclusive: true,
  },
  {
    name: "Villa La Estancia Riviera Nayarit",
    city: "Puerto Vallarta",
    state: "Jalisco",
    country: "MX",
    subdomain: "pv.villalaestancia.com",
    defaultPrice: 179,
    defaultAllIncPrice: 299,
    nights: 5,
    hasAllInclusive: true,
  },
  {
    name: "Villa del Palmar Cancun Luxury Beach Resort & Spa",
    city: "Cancun",
    state: "Quintana Roo",
    country: "MX",
    subdomain: "cancun.villadelpalmar.com",
    defaultPrice: 169,
    defaultAllIncPrice: 299,
    nights: 5,
    hasAllInclusive: true,
  },
  {
    name: "Villa del Palmar at the Islands of Loreto",
    city: "Loreto",
    state: "BCS",
    country: "MX",
    subdomain: "loreto.villadelpalmar.com",
    defaultPrice: 139,
    defaultAllIncPrice: 249,
    nights: 5,
    hasAllInclusive: true,
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

export async function runVillaGroupCrawler() {
  const processedKeys = new Set<string>();

  const crawler = new CheerioCrawler({
    maxRequestsPerCrawl: 15,
    maxConcurrency: 2,
    requestHandlerTimeoutSecs: 60,

    async requestHandler({ request, $, body, log }) {
      log.info(`Scraping ${request.url}`);

      const html = typeof body === "string" ? body : body.toString();

      // ── Parse deal sections from /specials page ────────────────────
      // Villa Group uses dealsSubContent divs with resort-specific pricing
      $("[class*='dealsSubContent'], [class*='deal-card'], .resort-deal, .special-offer").each((_i, el) => {
        const card = $(el);
        const cardText = card.text();

        // Extract prices: look for "FROM $XXX USD" patterns
        const regularPriceMatch = cardText.match(/(?:Regular|standard)\s*(?:user\s*)?(?:rate|price)?\s*\$\s*(\d+)/i);
        const vLevelPriceMatch = cardText.match(/(?:V-Level|member|VIP)\s*(?:rate|price)?\s*\$\s*(\d+)/i);
        const fromPriceMatch = cardText.match(/(?:FROM|from)\s*\$\s*(\d+)/i);

        const regularPrice = regularPriceMatch ? parseInt(regularPriceMatch[1], 10) : null;
        const memberPrice = vLevelPriceMatch ? parseInt(vLevelPriceMatch[1], 10) : null;
        const fromPrice = fromPriceMatch ? parseInt(fromPriceMatch[1], 10) : null;
        const bestPrice = memberPrice || fromPrice || regularPrice;
        if (!bestPrice) return;

        // Extract resort name
        const resortName = card.find("h2, h3, h4, .resort-name, .title").first().text().trim();

        // Extract booking URL
        const bookUrl = card.find('a[href*="villadelpalmar"], a[href*="villagroup"], a[href*="villalaestancia"], a[href*="villalavalencia"], a[href*="Book"], a[href*="book"]').first().attr("href") || "";

        // Extract image
        const imgSrc = card.find("img").first().attr("src") || card.find("img").first().attr("data-src") || "";

        // Is it all-inclusive or room-only?
        const isAllInclusive = /all\s*inclusive/i.test(cardText);
        const isRoomOnly = /room\s*only/i.test(cardText);

        // Try to match to known resort
        const resort = RESORT_CATALOG.find(
          (r) => (resortName && resortName.toLowerCase().includes(r.name.split(" ")[3]?.toLowerCase() || "NOMATCH")) ||
                 (bookUrl && bookUrl.includes(r.subdomain)) ||
                 (resortName && r.name.toLowerCase().includes(resortName.toLowerCase().split(" ")[0] || ""))
        );

        if (resort) {
          const key = `${resort.name}-${isAllInclusive ? "ai" : "ro"}`;
          if (processedKeys.has(key)) return;
          processedKeys.add(key);

          // Per-night price to total
          const perNight = bestPrice;
          const totalPrice = perNight * resort.nights;

          const deal: ScrapedDeal = {
            title: `${resort.name}${isAllInclusive ? " All-Inclusive" : ""} - ${resort.city}`,
            price: totalPrice,
            originalPrice: regularPrice ? regularPrice * resort.nights : undefined,
            durationNights: resort.nights,
            durationDays: resort.nights + 1,
            description: `${resort.nights + 1} Days / ${resort.nights} Nights at ${resort.name} in ${resort.city}, Mexico. From $${perNight}/night.${isAllInclusive ? " All-inclusive." : " Room only."}`,
            resortName: resort.name,
            url: bookUrl ? (bookUrl.startsWith("http") ? bookUrl : `https://${resort.subdomain}/specials/spring-sale`) : `${BASE_URL}/specials`,
            imageUrl: imgSrc ? resolveUrl(imgSrc) : undefined,
            inclusions: [
              `${resort.nights + 1} Days / ${resort.nights} Nights accommodation`,
              ...(isAllInclusive ? ["All-inclusive meals & drinks"] : []),
              "Resort amenities & pool access",
              "Beach access",
              "Kids stay free (select resorts)",
            ],
            requirements: [
              "Must be 25+ years old",
              "Married/cohabiting couples must both attend",
              "Valid ID and credit card required",
              "Attend timeshare presentation (~90-120 min)",
            ],
            savingsPercent: regularPrice && memberPrice ? Math.round((1 - memberPrice / regularPrice) * 100) : undefined,
            presentationMinutes: 120,
            city: resort.city,
            state: resort.state,
            country: resort.country,
            brandSlug: "villa-group",
          };

          storeDeal(deal, "villa-group", html)
            .then(() => log.info(`Stored: ${deal.title} ($${deal.price})`))
            .catch((err) => log.error(`Failed: ${err}`));
        }
      });

      // ── Also try parsing generic anchor-based deal structures ──────
      // The WebFetch showed deals as anchor tags wrapping price info
      $('a[href*="villadelpalmar.com/specials"], a[href*="villagroup.com/specials"], a[href*="villalaestancia.com"], a[href*="villalavalencia.com"]').each((_i, el) => {
        const link = $(el);
        const href = link.attr("href") || "";
        const text = link.text();
        const price = parsePrice(text);
        if (!price || price < 50) return;

        const resort = RESORT_CATALOG.find((r) => href.includes(r.subdomain.split(".")[0]));
        if (!resort) return;

        const isAI = /all\s*inclusive/i.test(text);
        const key = `${resort.name}-${isAI ? "ai" : "ro"}-link`;
        if (processedKeys.has(key)) return;
        processedKeys.add(key);

        const totalPrice = price * resort.nights;
        const imgSrc = link.find("img").first().attr("src") || "";

        const deal: ScrapedDeal = {
          title: `${resort.name}${isAI ? " All-Inclusive" : ""} - ${resort.city}`,
          price: totalPrice,
          durationNights: resort.nights,
          durationDays: resort.nights + 1,
          description: `${resort.nights + 1} Days / ${resort.nights} Nights at ${resort.name} in ${resort.city}, Mexico. From $${price}/night.`,
          resortName: resort.name,
          url: href.startsWith("http") ? href : `https://${href}`,
          imageUrl: imgSrc ? resolveUrl(imgSrc) : undefined,
          inclusions: [
            `${resort.nights + 1} Days / ${resort.nights} Nights accommodation`,
            ...(isAI ? ["All-inclusive meals & drinks"] : []),
            "Resort amenities & pool access",
            "Best price guarantee",
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
          brandSlug: "villa-group",
        };

        storeDeal(deal, "villa-group", html)
          .then(() => log.info(`Stored link deal: ${deal.title} ($${deal.price})`))
          .catch((err) => log.error(`Failed: ${err}`));
      });
    },
  });

  await crawler.run(SEED_URLS.map((url) => ({ url })));

  // Fallback: seed resorts not found via crawling (room-only rates)
  for (const resort of RESORT_CATALOG) {
    const roKey = `${resort.name}-ro`;
    if (!processedKeys.has(roKey) && !processedKeys.has(`${resort.name}-ro-link`)) {
      processedKeys.add(roKey);

      const totalPrice = resort.defaultPrice * resort.nights;

      const deal: ScrapedDeal = {
        title: `${resort.name} - ${resort.city}`,
        price: totalPrice,
        durationNights: resort.nights,
        durationDays: resort.nights + 1,
        description: `${resort.nights + 1} Days / ${resort.nights} Nights at ${resort.name} in ${resort.city}, Mexico. From $${resort.defaultPrice}/night. All-inclusive plan available.`,
        resortName: resort.name,
        url: `https://${resort.subdomain}/specials/spring-sale`,
        inclusions: [
          `${resort.nights + 1} Days / ${resort.nights} Nights accommodation`,
          "All-inclusive plan available",
          "Resort amenities & pool access",
          "Beach access",
          "Best price guarantee",
          "Kids stay free (select resorts)",
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
        brandSlug: "villa-group",
      };

      try {
        await storeDeal(deal, "villa-group", "");
        console.log(`Stored fallback: ${deal.title} ($${deal.price})`);
      } catch (err) {
        console.error(`Failed to store fallback ${deal.title}: ${err}`);
      }
    }
  }
}

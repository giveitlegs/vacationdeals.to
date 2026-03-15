import { CheerioCrawler } from "crawlee";
import { storeDeal } from "../storage/deal-store";
import type { ScrapedDeal } from "@vacationdeals/shared";

/**
 * Departure Depot crawler (departuredepot.com).
 *
 * Departure Depot is a modern travel broker running WooCommerce.
 * They offer "Resort Preview Getaways" across 150+ destinations —
 * cruise packages, concert getaways, and resort stays.
 *
 * Site structure:
 *   - Homepage shows ~10 "Featured Getaways" with product links
 *   - /shop/ has the full WooCommerce product grid (paginated, 25/page)
 *   - Individual product pages at /product/{slug}/ with WooCommerce markup
 *   - Prices are variable (range), e.g. "$699.00 – $1,399.00"
 *   - Titles encode destination, dates, and duration
 *
 * Strategy:
 *   1. Crawl /shop/ to get paginated product listing
 *   2. Parse each product card for title, price range, image, URL
 *   3. Extract destination + duration from the title text
 */

const BASE_URL = "https://departuredepot.com";

// ── Helpers ──────────────────────────────────────────────────────────────────

function parsePrice(text: string): number | null {
  // Take the lowest price from a range like "$699.00 – $1,399.00"
  const matches = text.replace(/,/g, "").match(/\$(\d+(?:\.\d+)?)/g);
  if (!matches || matches.length === 0) return null;
  const prices = matches.map((m) => parseFloat(m.replace("$", "")));
  return Math.min(...prices);
}

function parseOriginalPrice(text: string): number | null {
  // Take the highest price from a range
  const matches = text.replace(/,/g, "").match(/\$(\d+(?:\.\d+)?)/g);
  if (!matches || matches.length < 2) return null;
  const prices = matches.map((m) => parseFloat(m.replace("$", "")));
  return Math.max(...prices);
}

function parseNights(text: string): { nights: number; days: number } | null {
  let m = text.match(/(\d+)\s*Days?\s*[\/&,]\s*(\d+)\s*Nights?/i);
  if (m) return { days: parseInt(m[1], 10), nights: parseInt(m[2], 10) };
  m = text.match(/(\d+)\s*Nights?\s*[\/&,]\s*(\d+)\s*Days?/i);
  if (m) return { nights: parseInt(m[1], 10), days: parseInt(m[2], 10) };
  m = text.match(/(\d+)\s*Nights?/i);
  if (m) {
    const nights = parseInt(m[1], 10);
    return { nights, days: nights + 1 };
  }
  m = text.match(/(\d+)\s*Days?/i);
  if (m) {
    const days = parseInt(m[1], 10);
    return { days, nights: days - 1 };
  }
  return null;
}

/**
 * Extract a destination city from a Departure Depot product title.
 * Titles look like:
 *   "Christmas in Savannah Riverfront Escape: December 14–16, 2026"
 *   "Island State of Mind — St. Thomas, U.S. Virgin Islands"
 *   "Two Sunsets at Ocean Cay — Bahamas Private Island Escape"
 *   "Nitty Gritty Dirt Band & The Myrtle Beach Classic PGA Golf Tournament"
 */
function extractDestination(title: string): {
  city: string;
  state?: string;
  country: string;
} {
  const known: Array<{
    pattern: RegExp;
    city: string;
    state?: string;
    country: string;
  }> = [
    { pattern: /savannah/i, city: "Savannah", state: "GA", country: "US" },
    { pattern: /myrtle\s*beach/i, city: "Myrtle Beach", state: "SC", country: "US" },
    { pattern: /st\.?\s*thomas/i, city: "St. Thomas", country: "USVI" },
    { pattern: /bahamas|ocean\s*cay/i, city: "Nassau", country: "Bahamas" },
    { pattern: /key\s*west/i, city: "Key West", state: "FL", country: "US" },
    { pattern: /orlando/i, city: "Orlando", state: "FL", country: "US" },
    { pattern: /cancun/i, city: "Cancun", country: "Mexico" },
    { pattern: /cabo/i, city: "Cabo San Lucas", country: "Mexico" },
    { pattern: /las\s*vegas/i, city: "Las Vegas", state: "NV", country: "US" },
    { pattern: /gatlinburg/i, city: "Gatlinburg", state: "TN", country: "US" },
    { pattern: /branson/i, city: "Branson", state: "MO", country: "US" },
    { pattern: /new\s*york/i, city: "New York City", state: "NY", country: "US" },
    { pattern: /miami/i, city: "Miami", state: "FL", country: "US" },
    { pattern: /fort\s*lauderdale|ft\.?\s*lauderdale/i, city: "Fort Lauderdale", state: "FL", country: "US" },
    { pattern: /san\s*juan|puerto\s*rico/i, city: "San Juan", country: "Puerto Rico" },
    { pattern: /punta\s*cana/i, city: "Punta Cana", country: "Dominican Republic" },
    { pattern: /jamaica|montego/i, city: "Montego Bay", country: "Jamaica" },
    { pattern: /costa\s*rica/i, city: "Costa Rica", country: "Costa Rica" },
    { pattern: /charleston/i, city: "Charleston", state: "SC", country: "US" },
    { pattern: /hilton\s*head/i, city: "Hilton Head", state: "SC", country: "US" },
    { pattern: /daytona/i, city: "Daytona Beach", state: "FL", country: "US" },
    { pattern: /margaritaville|sea\s*beachcomber/i, city: "Port Canaveral", state: "FL", country: "US" },
    { pattern: /villages/i, city: "The Villages", state: "FL", country: "US" },
  ];

  for (const dest of known) {
    if (dest.pattern.test(title)) {
      return { city: dest.city, state: dest.state, country: dest.country };
    }
  }

  return { city: "Various", country: "US" };
}

function resolveUrl(href: string): string {
  if (href.startsWith("http")) return href;
  return `${BASE_URL}${href.startsWith("/") ? "" : "/"}${href}`;
}

// ── Main crawler ─────────────────────────────────────────────────────────────

export async function runDepartureDepotCrawler() {
  const processedUrls = new Set<string>();

  const crawler = new CheerioCrawler({
    maxRequestsPerCrawl: 40,
    async requestHandler({ request, $, log }) {
      log.info(`Scraping ${request.url}`);

      // ── Shop page: WooCommerce product grid ───────────────────────────
      // WooCommerce uses ul.products > li.product with standard classes
      const products = $("li.product, .product-type-simple, .product-type-variable");

      if (products.length > 0) {
        log.info(`Found ${products.length} products on ${request.url}`);

        products.each((_i, el) => {
          const card = $(el);
          try {
            // Title from WooCommerce heading
            const titleEl = card.find(
              ".woocommerce-loop-product__title, h2, h3, .product-title"
            ).first();
            const title = titleEl.text().trim();
            if (!title) return;

            // URL
            const linkEl = card.find("a[href*='/product/']").first();
            const href = linkEl.attr("href") || "";
            const dealUrl = resolveUrl(href);
            if (!dealUrl || processedUrls.has(dealUrl)) return;

            // Price (WooCommerce .price contains <ins>/<del> or <span class="amount">)
            const priceText = card.find(".price").first().text().trim();
            const price = parsePrice(priceText);
            if (!price || price <= 0) return;

            const originalPrice = parseOriginalPrice(priceText);

            processedUrls.add(dealUrl);

            // Image
            const imgEl = card.find("img").first();
            const imgSrc =
              imgEl.attr("src") ||
              imgEl.attr("data-src") ||
              imgEl.attr("data-lazy-src") ||
              "";
            const imageUrl = imgSrc ? resolveUrl(imgSrc) : undefined;

            // Duration from title
            const duration = parseNights(title);

            // Destination from title
            const destination = extractDestination(title);

            const deal: ScrapedDeal = {
              title,
              price,
              originalPrice:
                originalPrice && originalPrice !== price
                  ? originalPrice
                  : undefined,
              durationNights: duration?.nights || 3,
              durationDays: duration?.days || 4,
              description: `Resort Preview Getaway from Departure Depot`,
              resortName: undefined,
              url: dealUrl,
              imageUrl,
              city: destination.city,
              state: destination.state,
              country: destination.country,
              brandSlug: "departure-depot",
            };

            storeDeal(deal, "departure-depot")
              .then(() => log.info(`Stored deal: ${deal.title} ($${deal.price})`))
              .catch((err) =>
                log.error(`Failed to store deal ${deal.title}: ${err}`)
              );
          } catch (err) {
            log.error(`Error parsing product card: ${err}`);
          }
        });
      }

      // ── Fallback: parse any product links with prices from any page ───
      if (products.length === 0) {
        $('a[href*="/product/"]').each((_i, el) => {
          const link = $(el);
          const href = link.attr("href") || "";
          const dealUrl = resolveUrl(href);
          if (processedUrls.has(dealUrl)) return;

          const parent = link.closest("div, li, article, section");
          const contextText = parent.length ? parent.text() : link.text();

          const title =
            parent.find("h2, h3, h4").first().text().trim() ||
            link.text().trim();
          if (!title || title.length < 10) return;

          const price = parsePrice(contextText);
          if (!price || price <= 0) return;

          processedUrls.add(dealUrl);

          const originalPrice = parseOriginalPrice(contextText);
          const duration = parseNights(contextText);
          const destination = extractDestination(title);

          const imgEl = parent.find("img").first();
          const imgSrc = imgEl.attr("src") || imgEl.attr("data-src") || "";
          const imageUrl = imgSrc ? resolveUrl(imgSrc) : undefined;

          const deal: ScrapedDeal = {
            title,
            price,
            originalPrice:
              originalPrice && originalPrice !== price
                ? originalPrice
                : undefined,
            durationNights: duration?.nights || 3,
            durationDays: duration?.days || 4,
            resortName: undefined,
            url: dealUrl,
            imageUrl,
            city: destination.city,
            state: destination.state,
            country: destination.country,
            brandSlug: "departure-depot",
          };

          storeDeal(deal, "departure-depot")
            .then(() => log.info(`Stored deal: ${deal.title} ($${deal.price})`))
            .catch((err) =>
              log.error(`Failed to store deal ${deal.title}: ${err}`)
            );
        });
      }

      // ── Pagination: enqueue next shop pages ───────────────────────────
      if (request.url.includes("/shop")) {
        const nextPage = $("a.next, .woocommerce-pagination a.next").attr("href");
        if (nextPage) {
          const nextUrl = resolveUrl(nextPage);
          if (!processedUrls.has(nextUrl)) {
            await crawler.addRequests([{ url: nextUrl }]);
            log.info(`Enqueued next page: ${nextUrl}`);
          }
        }
      }
    },
  });

  // Start from /shop/ which has the full paginated product grid
  await crawler.run([`${BASE_URL}/shop/`]);
}

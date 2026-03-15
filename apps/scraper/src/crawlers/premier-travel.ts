import { CheerioCrawler } from "crawlee";
import { storeDeal } from "../storage/deal-store";
import type { ScrapedDeal } from "@vacationdeals/shared";

/**
 * Premier Travel Resorts crawler (premiertravelresorts.com).
 *
 * Florida-based timeshare presentation broker. WordPress site with a
 * custom theme. Packages for FL, Vegas, Bahamas, Costa Rica, Cancun.
 *
 * Site structure:
 *   - /vacation-packages-deals-on-promotion/ — main listing (labeled "Hot Promovacs!")
 *   - /timeshare-presentation-deals/ — alternate listing page
 *   - /shop/ — possible WooCommerce shop page
 *   - /package/{slug}/ — individual package pages with table layout:
 *     DESTINATION | {city, state}
 *     TRAVEL TIME | {days and nights}
 *     PRICE       | ${amount}
 *   - Package cards: image + "Learn More" link + h4 heading + price + duration
 *
 * Strategy:
 *   1. Crawl both listing pages for package cards
 *   2. Parse cards for destination, price, duration, image
 *   3. Optionally crawl individual /package/ pages for extra detail
 */

const BASE_URL = "https://premiertravelresorts.com";

const LISTING_PAGES = [
  `${BASE_URL}/vacation-packages-deals-on-promotion/`,
  `${BASE_URL}/timeshare-presentation-deals/`,
  `${BASE_URL}/`,
];

// ── Known packages for enrichment ───────────────────────────────────────────

const DESTINATION_MAP: Record<string, { city: string; state?: string; country: string }> = {
  "orlando": { city: "Orlando", state: "FL", country: "US" },
  "daytona-beach": { city: "Daytona Beach", state: "FL", country: "US" },
  "ft-lauderdale": { city: "Fort Lauderdale", state: "FL", country: "US" },
  "bahamas": { city: "Nassau", country: "Bahamas" },
  "las-vegas": { city: "Las Vegas", state: "NV", country: "US" },
  "costa-rica": { city: "Costa Rica", country: "Costa Rica" },
  "cancun": { city: "Cancun", country: "Mexico" },
  "miami": { city: "Miami", state: "FL", country: "US" },
  "myrtle-beach": { city: "Myrtle Beach", state: "SC", country: "US" },
  "branson": { city: "Branson", state: "MO", country: "US" },
  "gatlinburg": { city: "Gatlinburg", state: "TN", country: "US" },
  "williamsburg": { city: "Williamsburg", state: "VA", country: "US" },
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function parsePrice(text: string): number | null {
  const match = text.replace(/,/g, "").match(/\$(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

function parseNights(text: string): { nights: number; days: number } | null {
  let m = text.match(/(\d+)\s*Days?\s*(?:And|,|\/|&)\s*(\d+)\s*Nights?/i);
  if (m) return { days: parseInt(m[1], 10), nights: parseInt(m[2], 10) };
  m = text.match(/(\d+)\s*Nights?\s*(?:And|,|\/|&)\s*(\d+)\s*Days?/i);
  if (m) return { nights: parseInt(m[1], 10), days: parseInt(m[2], 10) };
  m = text.match(/(\d+)\s*Nights?/i);
  if (m) {
    const nights = parseInt(m[1], 10);
    return { nights, days: nights + 1 };
  }
  return null;
}

function resolveUrl(href: string): string {
  if (href.startsWith("http")) return href;
  return `${BASE_URL}${href.startsWith("/") ? "" : "/"}${href}`;
}

function extractSlugFromUrl(url: string): string | null {
  const m = url.match(/\/package\/([^/]+)/);
  return m ? m[1].replace(/-fl$|-nv$|-sc$/, "") : null;
}

function detectDestinationFromText(text: string): {
  city: string;
  state?: string;
  country: string;
} {
  const lower = text.toLowerCase();
  for (const [key, dest] of Object.entries(DESTINATION_MAP)) {
    if (lower.includes(key.replace(/-/g, " ")) || lower.includes(key)) {
      return dest;
    }
  }
  // Try matching "City, State" pattern
  const m = text.match(/([\w\s.]+),\s*([A-Z]{2})\b/);
  if (m) {
    return { city: m[1].trim(), state: m[2], country: "US" };
  }
  return { city: text.trim() || "Unknown", country: "US" };
}

// ── Main crawler ─────────────────────────────────────────────────────────────

export async function runPremierTravelCrawler() {
  const processedUrls = new Set<string>();

  const crawler = new CheerioCrawler({
    maxRequestsPerCrawl: 30,
    async requestHandler({ request, $, log }) {
      log.info(`Scraping ${request.url}`);

      const isPackagePage = request.url.includes("/package/");

      if (isPackagePage) {
        // ── Individual package page ─────────────────────────────────────
        const dealUrl = request.url;
        if (processedUrls.has(dealUrl)) return;

        const pageText = $("body").text();
        const price = parsePrice(pageText);
        if (!price || price <= 0) return;

        processedUrls.add(dealUrl);

        // Parse destination from table or heading
        const heading = $("h1, h2, h3").first().text().trim();
        const slug = extractSlugFromUrl(dealUrl);
        const destination = slug && DESTINATION_MAP[slug]
          ? DESTINATION_MAP[slug]
          : detectDestinationFromText(heading);

        // Duration
        const duration = parseNights(pageText) || { nights: 3, days: 4 };

        // Image
        const imgEl = $(".entry-content img, .post-content img, article img, .wp-post-image").first();
        const imgSrc = imgEl.attr("src") || "";
        const imageUrl = imgSrc ? resolveUrl(imgSrc) : undefined;

        // Description
        const description = $("p").filter((_i, el) => {
          const text = $(el).text().trim();
          return text.length > 50 && !text.includes("$");
        }).first().text().trim() || undefined;

        // Inclusions from lists
        const inclusions: string[] = [];
        $("li, .inclusion, .amenity").each((_i, el) => {
          const text = $(el).text().trim();
          if (text && text.length > 5 && text.length < 200) inclusions.push(text);
        });

        const deal: ScrapedDeal = {
          title: `${destination.city} Vacation Package`,
          price,
          durationNights: duration.nights,
          durationDays: duration.days,
          description,
          url: dealUrl,
          imageUrl,
          inclusions: inclusions.length > 0 ? inclusions : undefined,
          city: destination.city,
          state: destination.state,
          country: destination.country,
          brandSlug: "premier-travel",
        };

        storeDeal(deal, "premier-travel")
          .then(() => log.info(`Stored package: ${deal.title} ($${deal.price})`))
          .catch((err) => log.error(`Failed to store package: ${err}`));
      } else {
        // ── Listing page: find package cards ────────────────────────────

        // Strategy 1: Find links to /package/ pages with surrounding context
        const packageLinks = $('a[href*="/package/"]');

        log.info(`Found ${packageLinks.length} package links on ${request.url}`);

        const seenPackageUrls = new Set<string>();

        packageLinks.each((_i, el) => {
          const link = $(el);
          const href = link.attr("href") || "";
          const dealUrl = resolveUrl(href);

          // Deduplicate within this page (multiple links to same package)
          if (seenPackageUrls.has(dealUrl)) return;
          seenPackageUrls.add(dealUrl);

          if (processedUrls.has(dealUrl)) return;

          // Find the card container (parent div/li that wraps image + title + price)
          const container =
            link.closest("div, li, article, .package-card, .destination-card") ||
            link.parent().parent();

          const containerText = container.text();

          // Title from heading
          const title =
            container.find("h2, h3, h4").first().text().trim() ||
            link.text().trim();

          // Price
          const price = parsePrice(containerText);
          if (!price || price <= 0) {
            // Enqueue the package page to get details there
            crawler.addRequests([{ url: dealUrl }]).catch(() => {});
            return;
          }

          processedUrls.add(dealUrl);

          // Duration
          const duration = parseNights(containerText) || { nights: 3, days: 4 };

          // Destination
          const slug = extractSlugFromUrl(dealUrl);
          const destination = slug && DESTINATION_MAP[slug]
            ? DESTINATION_MAP[slug]
            : detectDestinationFromText(title);

          // Image
          const imgEl = container.find("img").first();
          const imgSrc = imgEl.attr("src") || imgEl.attr("data-src") || "";
          const imageUrl = imgSrc ? resolveUrl(imgSrc) : undefined;

          const deal: ScrapedDeal = {
            title: `${destination.city} Vacation Package`,
            price,
            durationNights: duration.nights,
            durationDays: duration.days,
            description: `Timeshare presentation deal in ${destination.city}`,
            url: dealUrl,
            imageUrl,
            city: destination.city,
            state: destination.state,
            country: destination.country,
            brandSlug: "premier-travel",
          };

          storeDeal(deal, "premier-travel")
            .then(() => log.info(`Stored deal: ${deal.title} ($${deal.price})`))
            .catch((err) => log.error(`Failed to store deal: ${err}`));
        });

        // Strategy 2: Broad text-based parsing for cards without /package/ links
        if (packageLinks.length === 0) {
          log.info("No /package/ links found, trying broad card search");

          $("h2, h3, h4").each((_i, el) => {
            const heading = $(el);
            const headingText = heading.text().trim();
            const container = heading.closest("div, li, article");
            const contextText = container.text();

            const price = parsePrice(contextText);
            if (!price || price <= 0) return;

            const linkEl = container.find("a").first();
            const href = linkEl.attr("href") || "";
            if (!href) return;
            const dealUrl = resolveUrl(href);
            if (processedUrls.has(dealUrl)) return;

            processedUrls.add(dealUrl);

            const duration = parseNights(contextText) || { nights: 3, days: 4 };
            const destination = detectDestinationFromText(headingText);

            const imgEl = container.find("img").first();
            const imgSrc = imgEl.attr("src") || "";
            const imageUrl = imgSrc ? resolveUrl(imgSrc) : undefined;

            const deal: ScrapedDeal = {
              title: `${destination.city} Vacation Package`,
              price,
              durationNights: duration.nights,
              durationDays: duration.days,
              url: dealUrl,
              imageUrl,
              city: destination.city,
              state: destination.state,
              country: destination.country,
              brandSlug: "premier-travel",
            };

            storeDeal(deal, "premier-travel")
              .then(() => log.info(`Stored deal: ${deal.title} ($${deal.price})`))
              .catch((err) => log.error(`Failed to store deal: ${err}`));
          });
        }
      }
    },
  });

  await crawler.run(LISTING_PAGES);
}

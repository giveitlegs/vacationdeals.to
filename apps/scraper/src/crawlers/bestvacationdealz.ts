import { CheerioCrawler } from "crawlee";
import { storeDeal } from "../storage/deal-store";
import type { ScrapedDeal } from "@vacationdeals/shared";

/**
 * BestVacationDealz crawler (bestvacationdealz.com).
 *
 * BestVacationDealz is a broker site built on WordPress (Avada theme).
 * The site has destination and resort listing pages:
 *   - /destinations/ — lists all destination pages
 *   - /resorts/ — lists all resort deal pages
 *   - /interest/orlando-theme-park-tickets/ — theme park ticket deals
 *
 * The deal content is rendered server-side via Fusion Builder components.
 * Deal cards typically use Avada portfolio/post grid elements.
 *
 * Strategy:
 *   1. Crawl homepage for featured deals
 *   2. Crawl /destinations/ to discover destination pages
 *   3. Crawl /resorts/ for individual resort deal cards
 *   4. Crawl each destination page for destination-specific deals
 */

const BASE_URL = "https://www.bestvacationdealz.com";

// ── Known destination pages ─────────────────────────────────────────────────

const DESTINATION_PAGES: Array<{
  slug: string;
  city: string;
  state?: string;
  country: string;
}> = [
  { slug: "orlando", city: "Orlando", state: "FL", country: "US" },
  { slug: "las-vegas", city: "Las Vegas", state: "NV", country: "US" },
  { slug: "gatlinburg", city: "Gatlinburg", state: "TN", country: "US" },
  { slug: "myrtle-beach", city: "Myrtle Beach", state: "SC", country: "US" },
  { slug: "branson", city: "Branson", state: "MO", country: "US" },
  { slug: "williamsburg", city: "Williamsburg", state: "VA", country: "US" },
  { slug: "cancun", city: "Cancun", country: "Mexico" },
  { slug: "cabo-san-lucas", city: "Cabo San Lucas", country: "Mexico" },
  { slug: "punta-cana", city: "Punta Cana", country: "Dominican Republic" },
  { slug: "miami", city: "Miami", state: "FL", country: "US" },
  { slug: "daytona-beach", city: "Daytona Beach", state: "FL", country: "US" },
  { slug: "new-orleans", city: "New Orleans", state: "LA", country: "US" },
  { slug: "pigeon-forge", city: "Pigeon Forge", state: "TN", country: "US" },
  { slug: "lake-tahoe", city: "Lake Tahoe", state: "CA", country: "US" },
  { slug: "sedona", city: "Sedona", state: "AZ", country: "US" },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function parsePrice(text: string): number | null {
  const match = text.replace(/,/g, "").match(/\$(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

function parseNights(text: string): { nights: number; days: number } | null {
  let m = text.match(/(\d+)\s*-?\s*Days?\s*[\/&,]\s*(\d+)\s*-?\s*Nights?/i);
  if (m) {
    return { days: parseInt(m[1], 10), nights: parseInt(m[2], 10) };
  }
  m = text.match(/(\d+)\s*-?\s*Nights?\s*[\/&,]\s*(\d+)\s*-?\s*Days?/i);
  if (m) {
    return { nights: parseInt(m[1], 10), days: parseInt(m[2], 10) };
  }
  m = text.match(/(\d+)\s*Nights?/i);
  if (m) {
    const nights = parseInt(m[1], 10);
    return { nights, days: nights + 1 };
  }
  return null;
}

function parseSavingsPercent(text: string): number | null {
  const m = text.match(/(\d+)\s*%/);
  return m ? parseInt(m[1], 10) : null;
}

function resolveUrl(href: string): string {
  if (href.startsWith("http")) return href;
  return `${BASE_URL}${href.startsWith("/") ? "" : "/"}${href}`;
}

function detectDestination(
  url: string,
): { city: string; state?: string; country: string } | null {
  const lower = url.toLowerCase();
  for (const dest of DESTINATION_PAGES) {
    if (lower.includes(dest.slug)) {
      return { city: dest.city, state: dest.state, country: dest.country };
    }
  }
  return null;
}

// ── Main crawler ─────────────────────────────────────────────────────────────

export async function runBestvacationdealzCrawler() {
  const processedUrls = new Set<string>();

  const crawler = new CheerioCrawler({
    maxRequestsPerCrawl: 80,
    async requestHandler({ request, $, log }) {
      log.info(`Scraping ${request.url}`);

      const isListingPage =
        request.url.includes("/destinations") ||
        request.url.includes("/resorts");

      // ── Strategy 1: Parse deal/resort cards (Avada portfolio items) ─────
      const dealCards = $(
        '.fusion-portfolio-post, .fusion-post-grid, .post-card, article.post, ' +
        '.fusion-column-wrapper, .resort-card, .deal-card, ' +
        '[class*="package"], [class*="resort"], [class*="deal"]'
      ).filter((_i, el) => {
        // Must contain a price to be considered a deal card
        return /\$\d+/.test($(el).text());
      });

      if (dealCards.length > 0) {
        log.info(`Found ${dealCards.length} deal cards on ${request.url}`);

        dealCards.each((_i, el) => {
          const card = $(el);
          try {
            const cardText = card.text();

            // Resort/hotel name from headings
            let resortName = "";
            card.find("h1, h2, h3, h4, h5, .title, .entry-title").each((_i, el) => {
              const text = $(el).text().trim();
              if (text && text.length > 5 && !/\$/.test(text) && !/OFF/i.test(text)) {
                if (!resortName || text.length > resortName.length) {
                  resortName = text;
                }
              }
            });
            if (!resortName) return;

            // Deal URL
            const linkEl = card.find("a").first();
            const href = linkEl.attr("href") || card.find('a[href]').first().attr("href") || "";
            const dealUrl = href ? resolveUrl(href) : "";

            if (!dealUrl || processedUrls.has(dealUrl)) return;

            // Price
            const allPrices: number[] = [];
            const priceMatches = cardText.replace(/,/g, "").matchAll(/\$(\d+)/g);
            for (const pm of priceMatches) {
              allPrices.push(parseInt(pm[1], 10));
            }

            if (allPrices.length === 0) return;

            const price = Math.min(...allPrices);
            const originalPrice = allPrices.length > 1 ? Math.max(...allPrices) : undefined;

            if (price <= 0) return;

            processedUrls.add(dealUrl);

            // Duration
            const duration = parseNights(cardText) || { nights: 3, days: 4 };

            // Savings
            const savingsPercent = parseSavingsPercent(cardText);

            // Destination from URL, card text, or page context
            const destination =
              detectDestination(dealUrl) ||
              detectDestination(request.url) ||
              (request.userData as any)?.destination ||
              { city: "Unknown", country: "US" };

            // Image
            const imgEl = card.find("img").first();
            const imgSrc =
              imgEl.attr("src") || imgEl.attr("data-src") || imgEl.attr("data-lazy-src") || "";
            const imageUrl = imgSrc ? resolveUrl(imgSrc) : undefined;

            // Inclusions
            const inclusions: string[] = [];
            card.find("li, .inclusion, .amenity, .feature").each((_i, el) => {
              const text = $(el).text().trim();
              if (text && text.length > 3 && text.length < 100) inclusions.push(text);
            });
            const durationStr = `${duration.days} Days / ${duration.nights} Nights`;
            if (!inclusions.some((i) => /night/i.test(i))) {
              inclusions.unshift(durationStr);
            }

            const deal: ScrapedDeal = {
              title: `${resortName} - ${destination.city}`,
              price,
              originalPrice,
              durationNights: duration.nights,
              durationDays: duration.days,
              description: `Vacation preview package at ${resortName} in ${destination.city}`,
              resortName,
              url: dealUrl,
              imageUrl,
              inclusions: inclusions.length > 0 ? inclusions : undefined,
              savingsPercent: savingsPercent ?? undefined,
              city: destination.city,
              state: destination.state,
              country: destination.country,
              brandSlug: "bestvacationdealz",
            };

            storeDeal(deal, "bestvacationdealz")
              .then(() => log.info(`Stored deal: ${deal.title} ($${deal.price})`))
              .catch((err) => log.error(`Failed to store deal ${deal.title}: ${err}`));
          } catch (err) {
            log.error(`Error parsing deal card: ${err}`);
          }
        });
      }

      // ── Strategy 2: Parse links with price context ─────────────────────
      if (dealCards.length === 0) {
        log.info(`No card wrappers found, trying link-based extraction on ${request.url}`);

        $("a[href]").each((_i, el) => {
          const link = $(el);
          const href = link.attr("href") || "";
          if (!href || href === "#" || href.includes("mailto:") || href.includes("tel:")) return;

          const dealUrl = resolveUrl(href);
          if (processedUrls.has(dealUrl)) return;

          // Only process links that look like deal/resort pages
          if (
            !href.includes("/resort") &&
            !href.includes("/deal") &&
            !href.includes("/package") &&
            !href.includes("/destination") &&
            !href.includes("/interest/")
          ) return;

          const parent = link.closest("div, article, section, li");
          const contextText = parent.length > 0 ? parent.text() : link.text();
          const price = parsePrice(contextText);
          if (!price || price <= 0) return;

          processedUrls.add(dealUrl);

          const duration = parseNights(contextText) || { nights: 3, days: 4 };
          const savingsPercent = parseSavingsPercent(contextText);
          const destination =
            detectDestination(dealUrl) ||
            detectDestination(contextText) ||
            { city: "Unknown", country: "US" };

          const resortName =
            link.find("h2, h3, h4").first().text().trim() ||
            link.text().trim().substring(0, 80) ||
            "Vacation Package";

          const imgSrc = parent.find("img").first().attr("src") || "";
          const imageUrl = imgSrc ? resolveUrl(imgSrc) : undefined;

          const deal: ScrapedDeal = {
            title: `${resortName} - ${destination.city}`,
            price,
            durationNights: duration.nights,
            durationDays: duration.days,
            resortName,
            url: dealUrl,
            imageUrl,
            savingsPercent: savingsPercent ?? undefined,
            city: destination.city,
            state: destination.state,
            country: destination.country,
            brandSlug: "bestvacationdealz",
          };

          storeDeal(deal, "bestvacationdealz")
            .then(() => log.info(`Stored link deal: ${deal.title} ($${deal.price})`))
            .catch((err) => log.error(`Failed to store link deal: ${err}`));
        });
      }

      // ── Discover destination and resort pages ──────────────────────────
      if (
        request.url === BASE_URL ||
        request.url === `${BASE_URL}/` ||
        isListingPage
      ) {
        const pagesToEnqueue: string[] = [];

        // Enqueue /destinations/ and /resorts/ from homepage
        if (request.url === BASE_URL || request.url === `${BASE_URL}/`) {
          pagesToEnqueue.push(`${BASE_URL}/destinations/`);
          pagesToEnqueue.push(`${BASE_URL}/resorts/`);
        }

        // Discover destination-specific links
        $('a[href*="/destinations/"], a[href*="/interest/"], a[href*="/resorts/"]').each((_i, el) => {
          const href = $(el).attr("href");
          if (!href) return;
          const fullUrl = resolveUrl(href);
          if (
            !processedUrls.has(fullUrl) &&
            !pagesToEnqueue.includes(fullUrl) &&
            fullUrl.includes("bestvacationdealz.com")
          ) {
            pagesToEnqueue.push(fullUrl);
          }
        });

        // Also enqueue known destination pages
        for (const dest of DESTINATION_PAGES) {
          const possibleUrls = [
            `${BASE_URL}/destinations/${dest.slug}/`,
            `${BASE_URL}/interest/${dest.slug}/`,
          ];
          for (const url of possibleUrls) {
            if (!processedUrls.has(url) && !pagesToEnqueue.includes(url)) {
              pagesToEnqueue.push(url);
            }
          }
        }

        if (pagesToEnqueue.length > 0) {
          const requests = pagesToEnqueue.map((url) => ({ url }));
          await crawler.addRequests(requests);
          log.info(`Enqueued ${pagesToEnqueue.length} pages to crawl`);
        }
      }
    },
  });

  await crawler.run([BASE_URL]);
}

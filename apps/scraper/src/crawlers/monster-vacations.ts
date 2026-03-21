import { CheerioCrawler } from "crawlee";
import { storeDeal } from "../storage/deal-store";
import type { ScrapedDeal } from "@vacationdeals/shared";

/**
 * Monster Vacations crawler (monstervacations.com).
 *
 * NOTE: As of March 2026, monstervacations.com redirects to a GoDaddy
 * "domain for sale" page. The domain appears to be parked/expired.
 * This scraper is written to handle the site structure if/when it comes
 * back online. It will gracefully handle the redirect/error case.
 *
 * Monster Vacations (separate from MRG/Monster Reservations Group) was a
 * broker site selling timeshare preview vacation packages. The site
 * previously had a landing page at /lander with deal cards.
 *
 * Expected structure (based on similar broker sites):
 *   - Homepage redirects to /lander
 *   - Deal cards with resort name, destination, price, duration, image
 *   - Destination-specific pages
 *
 * Strategy:
 *   1. Attempt to crawl homepage and /lander
 *   2. Parse any deal cards found
 *   3. Gracefully handle if site is down/parked
 */

const BASE_URL = "https://www.monstervacations.com";

// ── Known destinations for mapping ──────────────────────────────────────────

const DESTINATION_MAP: Record<string, { city: string; state?: string; country: string }> = {
  orlando: { city: "Orlando", state: "FL", country: "US" },
  "las-vegas": { city: "Las Vegas", state: "NV", country: "US" },
  vegas: { city: "Las Vegas", state: "NV", country: "US" },
  gatlinburg: { city: "Gatlinburg", state: "TN", country: "US" },
  branson: { city: "Branson", state: "MO", country: "US" },
  "myrtle-beach": { city: "Myrtle Beach", state: "SC", country: "US" },
  williamsburg: { city: "Williamsburg", state: "VA", country: "US" },
  cancun: { city: "Cancun", country: "Mexico" },
  "cabo-san-lucas": { city: "Cabo San Lucas", country: "Mexico" },
  "punta-cana": { city: "Punta Cana", country: "Dominican Republic" },
  miami: { city: "Miami", state: "FL", country: "US" },
  "daytona-beach": { city: "Daytona Beach", state: "FL", country: "US" },
  "pigeon-forge": { city: "Pigeon Forge", state: "TN", country: "US" },
  "new-orleans": { city: "New Orleans", state: "LA", country: "US" },
  sedona: { city: "Sedona", state: "AZ", country: "US" },
};

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
  text: string,
): { city: string; state?: string; country: string } | null {
  const lower = text.toLowerCase();
  for (const [key, dest] of Object.entries(DESTINATION_MAP)) {
    if (lower.includes(key)) {
      return dest;
    }
  }
  return null;
}

// ── Main crawler ─────────────────────────────────────────────────────────────

export async function runMonsterVacationsCrawler() {
  const processedUrls = new Set<string>();

  const crawler = new CheerioCrawler({
    maxRequestsPerCrawl: 50,
    // Handle redirects to parked domain pages gracefully
    maxRequestRetries: 1,
    requestHandlerTimeoutSecs: 30,
    async requestHandler({ request, $, body, log }) {
      log.info(`Scraping ${request.url}`);

      const html = typeof body === "string" ? body : body.toString();

      // ── Detect parked/for-sale domain ──────────────────────────────────
      if (
        html.includes("forsale.godaddy.com") ||
        html.includes("domain is for sale") ||
        html.includes("This domain") ||
        html.includes("parkedpages") ||
        $("title").text().toLowerCase().includes("for sale")
      ) {
        log.warning(
          "monstervacations.com appears to be parked/for sale. " +
          "No deals to scrape. Will retry on next scheduled run."
        );
        return;
      }

      // ── Detect JS redirect to /lander ──────────────────────────────────
      if (html.includes('window.location.href="/lander"') || html.includes('location.href="/lander"')) {
        log.info("Detected redirect to /lander, enqueuing...");
        await crawler.addRequests([{ url: `${BASE_URL}/lander` }]);
        return;
      }

      // ── Strategy 1: Parse deal cards ───────────────────────────────────
      const dealCards = $(
        '.deal-card, .package-card, .resort-card, article, ' +
        '.card, [class*="deal"], [class*="package"], [class*="resort"]'
      ).filter((_i, el) => {
        return /\$\d+/.test($(el).text());
      });

      if (dealCards.length > 0) {
        log.info(`Found ${dealCards.length} deal cards on ${request.url}`);

        dealCards.each((_i, el) => {
          const card = $(el);
          try {
            const cardText = card.text();

            // Resort name
            let resortName = "";
            card.find("h1, h2, h3, h4, h5, .title, .resort-name").each((_i, el) => {
              const text = $(el).text().trim();
              if (text && text.length > 5 && !/\$/.test(text) && !/OFF/i.test(text)) {
                if (!resortName || text.length > resortName.length) {
                  resortName = text;
                }
              }
            });
            if (!resortName) return;

            // Deal URL
            const href = card.find("a").first().attr("href") || card.closest("a").attr("href") || "";
            const dealUrl = href ? resolveUrl(href) : `${BASE_URL}/#${encodeURIComponent(resortName)}`;

            if (processedUrls.has(dealUrl)) return;

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

            // Destination
            const destination =
              detectDestination(cardText) ||
              detectDestination(dealUrl) ||
              detectDestination(resortName) ||
              (request.userData as any)?.destination ||
              { city: "Unknown", country: "US" };

            // Image
            const imgEl = card.find("img").first();
            const imgSrc =
              imgEl.attr("src") || imgEl.attr("data-src") || imgEl.attr("data-lazy-src") || "";
            const imageUrl = imgSrc ? resolveUrl(imgSrc) : undefined;

            // Inclusions
            const inclusions: string[] = [];
            card.find("li, .inclusion, .amenity, .feature, .perk").each((_i, el) => {
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
              brandSlug: "monster-vacations",
            };

            storeDeal(deal, "monster-vacations")
              .then(() => log.info(`Stored deal: ${deal.title} ($${deal.price})`))
              .catch((err) => log.error(`Failed to store deal ${deal.title}: ${err}`));
          } catch (err) {
            log.error(`Error parsing deal card: ${err}`);
          }
        });
      }

      // ── Strategy 2: Parse any links with price context ─────────────────
      if (dealCards.length === 0) {
        $("a[href]").each((_i, el) => {
          const link = $(el);
          const href = link.attr("href") || "";
          if (!href || href === "#" || href.includes("mailto:") || href.includes("tel:")) return;
          if (href.includes("godaddy.com") || href.includes("forsale")) return;

          const dealUrl = resolveUrl(href);
          if (processedUrls.has(dealUrl)) return;

          const parent = link.closest("div, article, section, li");
          const contextText = parent.length > 0 ? parent.text() : link.text();
          const price = parsePrice(contextText);
          if (!price || price <= 0) return;

          processedUrls.add(dealUrl);

          const duration = parseNights(contextText) || { nights: 3, days: 4 };
          const destination =
            detectDestination(contextText) ||
            detectDestination(href) ||
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
            city: destination.city,
            state: destination.state,
            country: destination.country,
            brandSlug: "monster-vacations",
          };

          storeDeal(deal, "monster-vacations")
            .then(() => log.info(`Stored link deal: ${deal.title} ($${deal.price})`))
            .catch((err) => log.error(`Failed to store link deal: ${err}`));
        });
      }

      // ── Discover additional pages ──────────────────────────────────────
      $('a[href*="monstervacations.com"]').each((_i, el) => {
        const href = $(el).attr("href");
        if (!href) return;
        const fullUrl = resolveUrl(href);
        if (!processedUrls.has(fullUrl) && fullUrl.includes("monstervacations.com")) {
          crawler.addRequests([{ url: fullUrl }]).catch(() => {});
        }
      });
    },

    async failedRequestHandler({ request, log }) {
      log.warning(
        `Request to ${request.url} failed. ` +
        "monstervacations.com may be down or parked."
      );
    },
  });

  await crawler.run([BASE_URL]);
}

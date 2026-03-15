import { CheerioCrawler } from "crawlee";
import { storeDeal } from "../storage/deal-store";
import type { ScrapedDeal } from "@vacationdeals/shared";

/**
 * StayPromo crawler (staypromo.com).
 *
 * StayPromo is a FL-licensed broker (ST38926) offering timeshare preview
 * vacation packages at "up to 95% off" across 16+ destinations.
 *
 * Site structure:
 *   - Homepage has destination cards with starting price + nights
 *   - Each destination at /vacation-packages/cheap-deals/{slug}/ lists
 *     individual resort deal cards
 *   - Resort cards have: .resort-card wrapper, .discount-badge, .amenities-list,
 *     .pricing, .view-button
 *   - URL pattern: /vacation-packages/cheap-deals/hotels/{resort-slug}/
 *
 * Strategy:
 *   1. Crawl homepage to discover all destination pages
 *   2. Crawl each destination page to extract resort deal cards
 */

const BASE_URL = "https://www.staypromo.com";

// ── Known destination pages ─────────────────────────────────────────────────

const DESTINATION_PAGES: Array<{
  slug: string;
  city: string;
  state?: string;
  country: string;
}> = [
  { slug: "orlando-florida", city: "Orlando", state: "FL", country: "US" },
  { slug: "cancun-mexico", city: "Cancun", country: "Mexico" },
  { slug: "punta-cana-dominican-republic", city: "Punta Cana", country: "Dominican Republic" },
  { slug: "humacao-puerto-rico", city: "Humacao", country: "Puerto Rico" },
  { slug: "juan-dolio-dominican-republic", city: "Juan Dolio", country: "Dominican Republic" },
  { slug: "las-vegas-nevada", city: "Las Vegas", state: "NV", country: "US" },
  { slug: "puerto-plata-dominican-republic", city: "Puerto Plata", country: "Dominican Republic" },
  { slug: "guanacaste-costa-rica", city: "Guanacaste", country: "Costa Rica" },
  { slug: "daytona-beach-florida", city: "Daytona Beach", state: "FL", country: "US" },
  { slug: "myrtle-beach-south-carolina", city: "Myrtle Beach", state: "SC", country: "US" },
  { slug: "isla-verde-puerto-rico", city: "Isla Verde", country: "Puerto Rico" },
  { slug: "gatlinburg-tennessee", city: "Gatlinburg", state: "TN", country: "US" },
  { slug: "new-orleans-louisiana", city: "New Orleans", state: "LA", country: "US" },
  { slug: "branson-missouri", city: "Branson", state: "MO", country: "US" },
  { slug: "new-smyrna-beach-florida", city: "New Smyrna Beach", state: "FL", country: "US" },
  { slug: "charleston-south-carolina", city: "Charleston", state: "SC", country: "US" },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function parsePrice(text: string): number | null {
  const match = text.replace(/,/g, "").match(/\$(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

function parseNights(text: string): { nights: number; days: number } | null {
  let m = text.match(/(\d+)\s*nights?/i);
  if (m) {
    const nights = parseInt(m[1], 10);
    return { nights, days: nights + 1 };
  }
  m = text.match(/(\d+)\s*days?\s*(?:and|[\/&])\s*(\d+)\s*nights?/i);
  if (m) {
    return { days: parseInt(m[1], 10), nights: parseInt(m[2], 10) };
  }
  m = text.match(/(\d+)\s*nights?\s*(?:and|[\/&])\s*(\d+)\s*days?/i);
  if (m) {
    return { nights: parseInt(m[1], 10), days: parseInt(m[2], 10) };
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
  for (const dest of DESTINATION_PAGES) {
    if (url.includes(dest.slug)) {
      return { city: dest.city, state: dest.state, country: dest.country };
    }
  }
  return null;
}

// ── Main crawler ─────────────────────────────────────────────────────────────

export async function runStayPromoCrawler() {
  const processedUrls = new Set<string>();

  const crawler = new CheerioCrawler({
    maxRequestsPerCrawl: 80,
    async requestHandler({ request, $, log }) {
      log.info(`Scraping ${request.url}`);

      const isHomepage =
        request.url === BASE_URL ||
        request.url === `${BASE_URL}/` ||
        request.url === "https://staypromo.com" ||
        request.url === "https://staypromo.com/";

      // ── Homepage: discover destination pages ────────────────────────────
      if (isHomepage) {
        // Destination cards on homepage link to /vacation-packages/cheap-deals/{slug}/
        const destLinks: string[] = [];
        $('a[href*="/vacation-packages/cheap-deals/"]').each((_i, el) => {
          const href = $(el).attr("href");
          if (!href) return;
          const fullUrl = resolveUrl(href);
          // Only enqueue destination listing pages, not individual hotel pages
          if (
            fullUrl.includes("/hotels/") ||
            destLinks.includes(fullUrl) ||
            processedUrls.has(fullUrl)
          )
            return;
          destLinks.push(fullUrl);
        });

        // Also enqueue known destinations in case some are missing from homepage
        for (const dest of DESTINATION_PAGES) {
          const url = `${BASE_URL}/vacation-packages/cheap-deals/${dest.slug}/`;
          if (!destLinks.includes(url) && !processedUrls.has(url)) {
            destLinks.push(url);
          }
        }

        if (destLinks.length > 0) {
          const requests = destLinks.map((url) => ({ url }));
          await crawler.addRequests(requests);
          log.info(`Enqueued ${destLinks.length} destination pages`);
        }

        return;
      }

      // ── Destination pages: extract resort deal cards ────────────────────
      const destination = detectDestination(request.url) ||
        (request.userData as any)?.destination || { city: "Unknown", country: "US" };

      // Strategy 1: Look for .resort-card elements (class found on StayPromo)
      let dealCards = $(".resort-card");

      // Strategy 2: Fallback to broader card selectors
      if (dealCards.length === 0) {
        dealCards = $(
          'article, .card, .deal-card, [class*="resort"], [class*="package"]',
        ).filter((_i, el) => {
          // Must contain a price to be considered a deal card
          return /\$\d+/.test($(el).text());
        });
      }

      if (dealCards.length > 0) {
        log.info(`Found ${dealCards.length} deal cards on ${request.url}`);

        dealCards.each((_i, el) => {
          const card = $(el);
          try {
            // Resort name from h4 > a or h3 > a
            const titleEl = card.find("h4 a, h3 a, h2 a, .title a").first();
            const resortName =
              titleEl.text().trim() ||
              card.find("h4, h3, h2").first().text().trim();
            if (!resortName) return;

            // Deal URL from the title link or view-button
            const dealHref =
              titleEl.attr("href") ||
              card.find('.view-button, a[href*="/hotels/"]').first().attr("href") ||
              card.find("a").first().attr("href") ||
              "";
            const dealUrl = resolveUrl(dealHref);

            if (!dealUrl || processedUrls.has(dealUrl)) return;

            // Price from .pricing or any element containing $
            const pricingText =
              card.find(".pricing").text() ||
              card.find('[class*="price"]').text() ||
              card.text();
            const price = parsePrice(pricingText);
            if (!price || price <= 0) return;

            processedUrls.add(dealUrl);

            // Duration from amenities list or card text
            const amenitiesText = card.find(".amenities-list, ul").text() || card.text();
            const duration = parseNights(amenitiesText) || { nights: 3, days: 4 };

            // Discount percentage from .discount-badge
            const discountText =
              card.find(".discount-badge, [class*='discount']").text() || card.text();
            const savingsPercent = parseSavingsPercent(discountText);

            // Image
            const imgEl = card.find("img").first();
            const imgSrc =
              imgEl.attr("src") || imgEl.attr("data-src") || imgEl.attr("data-lazy-src") || "";
            const imageUrl = imgSrc ? resolveUrl(imgSrc) : undefined;

            // Inclusions from amenities list
            const inclusions: string[] = [];
            card.find(".amenities-list li, ul li").each((_i, el) => {
              const text = $(el).text().trim();
              if (text && text.length > 3) inclusions.push(text);
            });

            // Clean resort name: remove location suffix like ", Orlando"
            const cleanResortName = resortName.replace(/,\s*[A-Za-z\s]+$/, "").trim();

            const deal: ScrapedDeal = {
              title: `${cleanResortName} - ${destination.city}`,
              price,
              durationNights: duration.nights,
              durationDays: duration.days,
              description: `Resort preview rate at ${cleanResortName} in ${destination.city}`,
              resortName: cleanResortName,
              url: dealUrl,
              imageUrl,
              inclusions: inclusions.length > 0 ? inclusions : undefined,
              savingsPercent: savingsPercent ?? undefined,
              city: destination.city,
              state: destination.state,
              country: destination.country,
              brandSlug: "staypromo",
            };

            storeDeal(deal, "staypromo")
              .then(() => log.info(`Stored deal: ${deal.title} ($${deal.price})`))
              .catch((err) => log.error(`Failed to store deal ${deal.title}: ${err}`));
          } catch (err) {
            log.error(`Error parsing deal card: ${err}`);
          }
        });
      }

      // Strategy 3: Fallback - parse links + price from loose HTML structure
      // StayPromo sometimes uses non-classed card markup: <a><h4>name</h4></a> + price
      if (dealCards.length === 0) {
        log.info(`No card wrappers found, trying link-based extraction on ${request.url}`);

        $('a[href*="/hotels/"]').each((_i, el) => {
          const link = $(el);
          const href = link.attr("href") || "";
          const dealUrl = resolveUrl(href);
          if (processedUrls.has(dealUrl)) return;

          // Get text from surrounding context
          const parent = link.parent();
          const resortName = link.find("h4, h3, h2").text().trim() || link.text().trim();
          if (!resortName || resortName === "View Package" || resortName === "SEE HOTEL PROMOS")
            return;

          // Look for price in parent or siblings
          const contextText = parent.parent().text();
          const price = parsePrice(contextText);
          if (!price || price <= 0) return;

          processedUrls.add(dealUrl);

          const duration = parseNights(contextText) || { nights: 3, days: 4 };
          const savingsPercent = parseSavingsPercent(contextText);

          const imgSrc = parent.parent().find("img").first().attr("src") || "";
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
            brandSlug: "staypromo",
          };

          storeDeal(deal, "staypromo")
            .then(() => log.info(`Stored link deal: ${deal.title} ($${deal.price})`))
            .catch((err) => log.error(`Failed to store link deal: ${err}`));
        });
      }

      // ── Discover additional destination pages from links ────────────────
      $('a[href*="/vacation-packages/cheap-deals/"]').each((_i, el) => {
        const href = $(el).attr("href");
        if (!href || href.includes("/hotels/")) return;
        const fullUrl = resolveUrl(href);
        if (!processedUrls.has(fullUrl) && fullUrl.includes("staypromo.com")) {
          crawler.addRequests([{ url: fullUrl }]).catch(() => {});
        }
      });
    },
  });

  await crawler.run([BASE_URL]);
}

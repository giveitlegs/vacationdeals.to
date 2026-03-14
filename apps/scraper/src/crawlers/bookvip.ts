import { CheerioCrawler } from "crawlee";
import { storeDeal } from "../storage/deal-store";
import type { ScrapedDeal } from "@vacationdeals/shared";

/**
 * BookVIP crawler.
 *
 * BookVIP is server-rendered HTML with deal cards containing:
 *   - productObj JS variables with id, name, category, price
 *   - .packageDealBox containers with pricing, nights, images
 *   - Destination pages at /package_details/{slug}?destination={id}
 *   - Individual deal pages at /hotel_details/{slug}?id={id}&pid={pid}
 *
 * Strategy:
 *   1. Crawl homepage for featured deals + discover destination links
 *   2. Crawl /vacationspecials for the full deal listing
 *   3. Crawl each destination page for destination-specific deals
 */

// ── Known destinations to crawl ─────────────────────────────────────────────

const DESTINATION_PAGES = [
  { url: "/package_details/cancun-mexico?destination=1", city: "Cancun", state: undefined, country: "Mexico" },
  { url: "/package_details/cabo-san-lucas-mexico?destination=3", city: "Cabo San Lucas", state: undefined, country: "Mexico" },
  { url: "/package_details/punta-cana-dominican-republic?destination=17", city: "Punta Cana", state: undefined, country: "Dominican Republic" },
  { url: "/package_details/puerto-vallarta-mexico?destination=9", city: "Puerto Vallarta", state: undefined, country: "Mexico" },
  { url: "/package_details/riviera-maya-mexico?destination=7", city: "Riviera Maya", state: undefined, country: "Mexico" },
  { url: "/package_details/montego-bay-jamaica?destination=37", city: "Montego Bay", state: undefined, country: "Jamaica" },
  { url: "/package_details/orlando-florida?destination=6", city: "Orlando", state: "FL", country: "US" },
  { url: "/package_details/las-vegas-nevada?destination=20", city: "Las Vegas", state: "NV", country: "US" },
  { url: "/package_details/myrtle-beach-south-carolina?destination=24", city: "Myrtle Beach", state: "SC", country: "US" },
  { url: "/package_details/miami-florida?destination=56", city: "Miami", state: "FL", country: "US" },
  { url: "/package_details/branson-missouri?destination=33", city: "Branson", state: "MO", country: "US" },
  { url: "/package_details/lake-tahoe-california?destination=62", city: "Lake Tahoe", state: "CA", country: "US" },
  { url: "/package_details/williamsburg-virginia?destination=35", city: "Williamsburg", state: "VA", country: "US" },
  { url: "/package_details/new-york-city-new-york?destination=65", city: "New York City", state: "NY", country: "US" },
  { url: "/package_details/mazatlan-mexico?destination=13", city: "Mazatlan", state: undefined, country: "Mexico" },
  { url: "/package_details/nuevo-vallarta-mexico?destination=8", city: "Nuevo Vallarta", state: undefined, country: "Mexico" },
  { url: "/package_details/los-cabos-mexico?destination=55", city: "Los Cabos", state: undefined, country: "Mexico" },
  { url: "/package_details/costa-rica?destination=19", city: "Costa Rica", state: undefined, country: "Costa Rica" },
  { url: "/package_details/nassau-bahamas?destination=36", city: "Nassau", state: undefined, country: "Bahamas" },
];

const BASE_URL = "https://www.bookvip.com";

// ── Helpers ──────────────────────────────────────────────────────────────────

function parsePrice(text: string): number | null {
  const match = text.replace(/,/g, "").match(/\$(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

function parseNights(text: string): { nights: number; days: number } | null {
  // "5 Night Hotel Accommodation" or "5 Days / 4 Nights"
  // or "5 Nights Hotel Accommodations" or "4 Night Hotel Accommodation"
  let m = text.match(/(\d+)\s*Night/i);
  if (m) {
    const nights = parseInt(m[1], 10);
    return { nights, days: nights + 1 };
  }
  m = text.match(/(\d+)\s*Days?\s*\/\s*(\d+)\s*Nights?/i);
  if (m) {
    return { days: parseInt(m[1], 10), nights: parseInt(m[2], 10) };
  }
  m = text.match(/(\d+)\s*Nights?\s*\/\s*(\d+)\s*Days?/i);
  if (m) {
    return { nights: parseInt(m[1], 10), days: parseInt(m[2], 10) };
  }
  return null;
}

function parseCityCountry(category: string): {
  city: string;
  state?: string;
  country: string;
} {
  // "Cancun, Mexico" or "Orlando, Florida" or "Las Vegas, Nevada"
  const parts = category.split(",").map((s) => s.trim());
  const city = parts[0];
  const region = parts[1] || "";

  // US state mapping
  const stateMap: Record<string, string> = {
    Florida: "FL",
    Nevada: "NV",
    "South Carolina": "SC",
    Missouri: "MO",
    California: "CA",
    Virginia: "VA",
    "New York": "NY",
    Tennessee: "TN",
    Utah: "UT",
    Texas: "TX",
    Arizona: "AZ",
    Colorado: "CO",
    Hawaii: "HI",
  };

  if (stateMap[region]) {
    return { city, state: stateMap[region], country: "US" };
  }

  // If the region looks like a US state abbreviation
  if (/^[A-Z]{2}$/.test(region)) {
    return { city, state: region, country: "US" };
  }

  return { city, country: region || "Unknown" };
}

function parseSavingsPercent(text: string): number | null {
  const m = text.match(/(\d+)\s*%/);
  return m ? parseInt(m[1], 10) : null;
}

function resolveUrl(href: string): string {
  if (href.startsWith("http")) return href;
  return `${BASE_URL}${href.startsWith("/") ? "" : "/"}${href}`;
}

// ── Main crawler ─────────────────────────────────────────────────────────────

export async function runBookvipCrawler() {
  const processedUrls = new Set<string>();

  const crawler = new CheerioCrawler({
    maxRequestsPerCrawl: 100,
    async requestHandler({ request, $, body, log }) {
      log.info(`Scraping ${request.url}`);

      const html = typeof body === "string" ? body : body.toString();

      // ── Strategy 1: Extract productObj variables from JS ────────────────
      // These give us structured data: id, name, category, price
      const productObjRegex =
        /var\s+productObj_[a-f0-9]+\s*=\s*(\{[^}]+\})\s*;/g;
      let match: RegExpExecArray | null;
      const productObjs: Array<{
        id: number;
        name: string;
        category: string;
        price: number;
      }> = [];

      while ((match = productObjRegex.exec(html)) !== null) {
        try {
          const obj = JSON.parse(match[1]);
          if (obj.id && obj.name && obj.price) {
            productObjs.push(obj);
          }
        } catch {
          // skip malformed JSON
        }
      }

      // ── Strategy 2: Parse deal cards from DOM ──────────────────────────
      const dealCards = $(".packageDealBox, .hotel-deal-card, [class*='dealBox'], [class*='deal-card']");

      if (dealCards.length > 0) {
        dealCards.each((_i, el) => {
          const card = $(el);
          try {
            // Hotel name
            const hotelName =
              card.find(".inclDealTtl, h3, h4.inclDealTtl").first().text().trim() || "";

            // Deal URL
            const linkEl = card.find('a[href*="/hotel_details/"]').first();
            const href = linkEl.attr("href") || "";
            const dealUrl = resolveUrl(href);

            if (!dealUrl || processedUrls.has(dealUrl)) return;

            // Prices
            const salePriceText =
              card.find(".salePrice, .sale-price, [class*='salePrice']").first().text().trim() ||
              card.find("strong").first().text().trim();
            const originalPriceText =
              card.find(".originalPrice, .retail, [class*='originalPrice']").first().text().trim();

            const price = parsePrice(salePriceText);
            const originalPrice = parsePrice(originalPriceText);

            if (!price || price <= 0) return;
            if (!hotelName) return;

            processedUrls.add(dealUrl);

            // Duration
            const nightsText =
              card.find(".ttlnightTttl, h4.ttlnightTttl, [class*='night']").first().text() ||
              card.find("h4").filter((_i, el) => /night/i.test($(el).text())).first().text() ||
              card.text();
            const duration = parseNights(nightsText);

            // Image
            const imgEl = card.find("img").first();
            const imgSrc = imgEl.attr("src") || imgEl.attr("data-src") || "";
            const imageUrl = imgSrc ? resolveUrl(imgSrc) : undefined;

            // Savings
            const savingsText = card.text();
            const savingsPercent = parseSavingsPercent(savingsText);

            // Category/location - from metadata if available
            const categoryText =
              card.find("p, .category, [class*='category']").first().text().trim() || "";

            // Try to find the matching productObj for extra data
            const matchingProduct = productObjs.find(
              (p) => p.name === hotelName || p.id === parseInt(href.match(/id=(\d+)/)?.[1] || "0"),
            );

            const locationStr = categoryText || matchingProduct?.category || "";
            const location = locationStr
              ? parseCityCountry(locationStr)
              : (request.userData as any)?.location || { city: "Unknown", country: "Unknown" };

            // Inclusions
            const inclusions: string[] = [];
            card.find(".hotelDetails p, .inclusions p, .inclusions li").each((_i, el) => {
              const text = $(el).text().trim();
              if (text) inclusions.push(text);
            });
            if (duration) {
              const durationStr = `${duration.days} Days / ${duration.nights} Nights`;
              if (!inclusions.some((i) => i.includes("Night"))) {
                inclusions.unshift(durationStr);
              }
            }

            const deal: ScrapedDeal = {
              title: `${hotelName} - ${location.city}`,
              price,
              originalPrice: originalPrice || undefined,
              durationNights: duration?.nights || 5,
              durationDays: duration?.days || 6,
              description: undefined,
              resortName: hotelName,
              url: dealUrl,
              imageUrl,
              inclusions: inclusions.length > 0 ? inclusions : undefined,
              savingsPercent: savingsPercent ?? undefined,
              city: location.city,
              state: location.state,
              country: location.country,
              brandSlug: "bookvip",
            };

            storeDeal(deal, "bookvip")
              .then(() => log.info(`Stored deal: ${deal.title} ($${deal.price})`))
              .catch((err) => log.error(`Failed to store deal ${deal.title}: ${err}`));
          } catch (err) {
            log.error(`Error parsing deal card: ${err}`);
          }
        });
      }

      // ── Strategy 3: If no DOM cards found, build deals from productObjs
      if (dealCards.length === 0 && productObjs.length > 0) {
        for (const prod of productObjs) {
          const dealUrl = `${BASE_URL}/hotel_details/${prod.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")}?id=${prod.id}`;

          if (processedUrls.has(dealUrl)) continue;
          processedUrls.add(dealUrl);

          const location = parseCityCountry(prod.category);

          const deal: ScrapedDeal = {
            title: `${prod.name} - ${location.city}`,
            price: prod.price,
            durationNights: 5,
            durationDays: 6,
            resortName: prod.name,
            url: dealUrl,
            city: location.city,
            state: location.state,
            country: location.country,
            brandSlug: "bookvip",
          };

          try {
            await storeDeal(deal, "bookvip");
            log.info(`Stored productObj deal: ${deal.title} ($${deal.price})`);
          } catch (err) {
            log.error(`Failed to store productObj deal ${deal.title}: ${err}`);
          }
        }
      }

      // ── Strategy 4: Parse featured destination cards on homepage ────────
      // These have a simpler structure: link wrapping image + price + destination
      $('a[href*="/package_details/"]').each((_i, el) => {
        const link = $(el);
        const href = link.attr("href") || "";

        // Extract price from strong/span within the link
        const priceText = link.find("strong").first().text().trim();
        const price = parsePrice(priceText);
        if (!price || price <= 0) return;

        // Destination name from h3
        const destName = link.find("h3").first().text().trim();
        if (!destName) return;

        const location = parseCityCountry(destName);
        const dealUrl = resolveUrl(href);
        if (processedUrls.has(dealUrl)) return;
        processedUrls.add(dealUrl);

        // Nights
        const nightsText = link.find("h4").first().text() || link.text();
        const duration = parseNights(nightsText);

        // Savings
        const savings = parseSavingsPercent(link.text());

        // Image
        const imgSrc = link.find("img").first().attr("src") || "";
        const imageUrl = imgSrc ? resolveUrl(imgSrc) : undefined;

        // Inclusions
        const inclusions: string[] = [];
        link.find("h4").each((_i, el) => {
          const text = $(el).text().trim();
          if (text) inclusions.push(text);
        });

        const deal: ScrapedDeal = {
          title: `${destName} Vacation Package`,
          price,
          durationNights: duration?.nights || 5,
          durationDays: duration?.days || 6,
          url: dealUrl,
          imageUrl,
          inclusions: inclusions.length > 0 ? inclusions : undefined,
          savingsPercent: savings ?? undefined,
          city: location.city,
          state: location.state,
          country: location.country,
          brandSlug: "bookvip",
        };

        storeDeal(deal, "bookvip")
          .then(() => log.info(`Stored destination deal: ${deal.title} ($${deal.price})`))
          .catch((err) => log.error(`Failed to store destination deal: ${err}`));
      });

      // ── Discover and enqueue destination pages from homepage ────────────
      if (
        request.url === `${BASE_URL}/` ||
        request.url === `${BASE_URL}` ||
        request.url.includes("bookvip.com/vacationspecials")
      ) {
        // Enqueue known destination pages
        const enqueuedUrls: string[] = [];
        for (const dest of DESTINATION_PAGES) {
          const fullUrl = `${BASE_URL}${dest.url}`;
          if (!processedUrls.has(fullUrl)) {
            enqueuedUrls.push(fullUrl);
            await crawler.addRequests([
              {
                url: fullUrl,
                userData: {
                  location: {
                    city: dest.city,
                    state: dest.state,
                    country: dest.country,
                  },
                },
              },
            ]);
          }
        }
        if (enqueuedUrls.length > 0) {
          log.info(`Enqueued ${enqueuedUrls.length} destination pages`);
        }

        // Also enqueue /vacationspecials if we're on the homepage
        if (!request.url.includes("vacationspecials")) {
          await crawler.addRequests([{ url: `${BASE_URL}/vacationspecials` }]);
          log.info("Enqueued /vacationspecials page");
        }
      }

      // ── Discover additional destination pages from links on the page ────
      $('a[href*="/package_details/"]').each((_i, el) => {
        const href = $(el).attr("href");
        if (!href) return;
        const fullUrl = resolveUrl(href);

        // Extract destination info from URL pattern
        const slugMatch = href.match(/\/package_details\/([^?]+)/);
        if (!slugMatch) return;

        // Only enqueue if not already visited
        if (processedUrls.has(fullUrl)) return;

        // Try to parse city/country from the slug
        const slug = slugMatch[1];
        const parts = slug.split("-");
        // "cancun-mexico" -> city: "Cancun", country: "Mexico"
        // We'll let the page handler parse the actual cards
        const destMatch = DESTINATION_PAGES.find((d) =>
          d.url.includes(slug),
        );
        if (destMatch) return; // Already enqueued from the known list

        crawler.addRequests([{ url: fullUrl }]).catch(() => {});
      });
    },
  });

  await crawler.run([BASE_URL]);
}

import { CheerioCrawler } from "crawlee";
import { storeDeal } from "../storage/deal-store";
import type { ScrapedDeal } from "@vacationdeals/shared";

/**
 * Westgate Reservations crawler.
 *
 * The site is an Angular.js app but all resort/special data is embedded in a
 * JS constant:
 *   angular.module('appData', []).constant('APP_DATA', { ... })
 *
 * We extract that JSON blob with a regex, then parse resorts and specials
 * from it. No JS rendering is needed — CheerioCrawler is sufficient.
 *
 * Strategy (3 phases):
 *   Phase 1 — Homepage: extract APP_DATA containing ALL ~50 specials + resorts.
 *             Enqueue /specials/ hub, all /specials/{destination}/ pages,
 *             and all individual /specials/{deal-slug}/ pages discovered
 *             from APP_DATA url fields.
 *   Phase 2 — Destination pages (/specials/{destination}/): may surface
 *             additional specials not in the homepage APP_DATA.
 *   Phase 3 — Individual deal pages (/specials/{slug}/): extract richer
 *             descriptions, resort details, and inclusions from the DOM
 *             that aren't in the listing APP_DATA.
 *
 * IMPORTANT: We scrape ALL specials regardless of the `show` flag.
 * Many deals with show:false (38 of ~50) have valid landing pages and
 * real pricing — they're just not featured in the listing rotation.
 */

// ── Types for the embedded JSON ──────────────────────────────────────────────

interface WestgateResort {
  resort_id: number;
  title: string;
  destination: string;
  destination_id: number;
  thumbnails: { full: string; s: string; xxs: string };
  url: string;
  prices: { standard_price: number; price_from: number };
  excerpt: string;
  address: string;
  rating: string;
  city: string;
  state: string;
  zip: string;
  menu_order: number;
}

interface WestgateSpecial {
  special_id: number;
  title: string;
  resorts: number[];
  destinations: number[];
  thumbnails: { full: string; s: string; xxs: string };
  url: string;
  nights: number;
  days: number;
  excerpt: string;
  prices: { retail: number; discounted: number; savings: number };
  package_includes: Array<{ icon: string; item: string }>;
  show: boolean;
}

interface WestgateDestination {
  id: number;
  short: string;
  long: string;
  slug: string;
}

interface WestgateAppData {
  destinations: WestgateDestination[];
  resorts: WestgateResort[];
  specials?: WestgateSpecial[];
}

// ── Destination slug → state lookup ──────────────────────────────────────────

const DEST_STATE: Record<string, string> = {
  orlando: "FL",
  gatlinburg: "TN",
  "las-vegas": "NV",
  branson: "MO",
  "myrtle-beach": "SC",
  "cocoa-beach": "FL",
  "park-city": "UT",
  "river-ranch": "FL",
  williamsburg: "VA",
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function extractAppData(html: string): WestgateAppData | null {
  // Match the APP_DATA constant that Angular injects.
  // The pattern is: .constant('APP_DATA', { ... })
  // We grab everything between the opening { and the matching closing }.
  const marker = ".constant('APP_DATA',";
  const idx = html.indexOf(marker);
  if (idx === -1) return null;

  const start = html.indexOf("{", idx + marker.length);
  if (start === -1) return null;

  // Walk forward to find the matching closing brace.
  let depth = 0;
  let end = -1;
  for (let i = start; i < html.length; i++) {
    if (html[i] === "{") depth++;
    else if (html[i] === "}") {
      depth--;
      if (depth === 0) {
        end = i;
        break;
      }
    }
  }
  if (end === -1) return null;

  const jsonStr = html.substring(start, end + 1);
  try {
    return JSON.parse(jsonStr);
  } catch {
    // The JSON might contain single-quoted strings or trailing commas in rare
    // cases. Try a lenient parse by cleaning it up.
    try {
      const cleaned = jsonStr
        .replace(/'/g, '"')
        .replace(/,\s*([\]}])/g, "$1");
      return JSON.parse(cleaned);
    } catch {
      return null;
    }
  }
}

function destIdToInfo(
  destinations: WestgateDestination[],
  id: number,
): { city: string; state: string } | null {
  const d = destinations.find((dest) => dest.id === id);
  if (!d) return null;
  // d.long is like "Orlando, FL"
  const parts = d.long.split(", ");
  return { city: parts[0], state: parts[1] || DEST_STATE[d.slug] || "" };
}

function savingsPercent(retail: number, discounted: number): number {
  if (retail <= 0) return 0;
  return Math.round(((retail - discounted) / retail) * 100);
}

/** Normalize a special's url field to an absolute URL */
function specialToAbsoluteUrl(urlField: string): string {
  if (urlField.startsWith("http")) return urlField;
  // url field is sometimes just the slug, sometimes /specials/slug/
  const slug = urlField.replace(/^\/specials\//, "").replace(/\/$/, "");
  return `https://www.westgatereservations.com/specials/${slug}/`;
}

// ── Main crawler ─────────────────────────────────────────────────────────────

export async function runWestgateCrawler() {
  const enqueuedUrls = new Set<string>();
  const processedResortIds = new Set<number>();
  const processedSpecialIds = new Set<number>();
  const crawler = new CheerioCrawler({
    maxRequestsPerCrawl: 150,
    async requestHandler({ request, $, body, log }) {
      log.info(`Scraping ${request.url}`);

      const html = typeof body === "string" ? body : body.toString();
      const appData = extractAppData(html);
      const isDetailPage =
        request.url.includes("/specials/") &&
        !isDestinationPage(request.url) &&
        request.url !== "https://www.westgatereservations.com/specials/";

      if (!appData) {
        log.warning(`No APP_DATA found on ${request.url}`);
        return;
      }

      const { destinations, resorts, specials } = appData;

      // ── Process specials (vacation packages) ────────────────────────────
      // NOTE: We process ALL specials regardless of `show` flag.
      // Many deals with show:false have valid landing pages and real pricing.
      if (specials && specials.length > 0) {
        for (const special of specials) {
          // Skip only if price is 0 or missing (truly invalid deal)
          if (!special.prices?.discounted || special.prices.discounted <= 0)
            continue;
          if (processedSpecialIds.has(special.special_id)) continue;
          processedSpecialIds.add(special.special_id);

          // Enqueue the individual deal page for richer data
          const dealUrl = specialToAbsoluteUrl(special.url);
          if (!enqueuedUrls.has(dealUrl)) {
            enqueuedUrls.add(dealUrl);
            await crawler.addRequests([{ url: dealUrl }]);
            log.info(`Enqueued deal page: ${dealUrl}`);
          }

          // A special can span multiple destinations. Create a deal for
          // each destination it covers, or a single deal if it's generic.
          const destInfos =
            special.destinations.length > 0
              ? special.destinations
                  .map((did) => destIdToInfo(destinations, did))
                  .filter(Boolean)
              : [null];

          // If more than 3 destinations, treat as a multi-destination deal
          if (destInfos.length > 3) {
            const deal: ScrapedDeal = {
              title: special.title,
              price: special.prices.discounted,
              originalPrice: special.prices.retail,
              durationNights: special.nights,
              durationDays: special.days,
              description: special.excerpt || undefined,
              url: dealUrl,
              imageUrl: special.thumbnails?.s || special.thumbnails?.full,
              inclusions: special.package_includes?.map((p) => p.item),
              savingsPercent: savingsPercent(
                special.prices.retail,
                special.prices.discounted,
              ),
              travelWindow: "Book within 6 months",
              city: "Multiple Destinations",
              state: undefined,
              country: "US",
              brandSlug: "westgate",
            };
            try {
              await storeDeal(deal, "westgate", html);
              log.info(`Stored special: ${deal.title} ($${deal.price})`);
            } catch (err) {
              log.error(`Failed to store special ${deal.title}: ${err}`);
            }
          } else {
            for (const di of destInfos) {
              const city = di?.city || "Multiple Destinations";
              const state = di?.state;

              const deal: ScrapedDeal = {
                title: special.title,
                price: special.prices.discounted,
                originalPrice: special.prices.retail,
                durationNights: special.nights,
                durationDays: special.days,
                description: special.excerpt || undefined,
                url: dealUrl,
                imageUrl: special.thumbnails?.s || special.thumbnails?.full,
                inclusions: special.package_includes?.map((p) => p.item),
                savingsPercent: savingsPercent(
                  special.prices.retail,
                  special.prices.discounted,
                ),
                travelWindow: "Book within 6 months",
                city,
                state,
                country: "US",
                brandSlug: "westgate",
              };

              try {
                await storeDeal(deal, "westgate", html);
                log.info(
                  `Stored special: ${deal.title} - ${city} ($${deal.price})`,
                );
              } catch (err) {
                log.error(`Failed to store special ${deal.title}: ${err}`);
              }
            }
          }
        }
      }

      // ── Process resort listings (nightly rate deals) ────────────────────
      if (resorts && resorts.length > 0) {
        for (const resort of resorts) {
          if (processedResortIds.has(resort.resort_id)) continue;
          processedResortIds.add(resort.resort_id);

          const priceFrom = resort.prices?.price_from;
          const standardPrice = resort.prices?.standard_price;
          if (!priceFrom || priceFrom <= 0) continue;

          // Create a 3-night package deal from the nightly rate
          const nights = 3;
          const days = nights + 1;
          const totalPrice = priceFrom * nights;
          const originalTotal = standardPrice
            ? standardPrice * nights
            : undefined;

          const deal: ScrapedDeal = {
            title: `${resort.title} - ${resort.destination}`,
            price: totalPrice,
            originalPrice: originalTotal,
            durationNights: nights,
            durationDays: days,
            description: resort.excerpt || undefined,
            resortName: resort.title,
            url: resort.url,
            imageUrl: resort.thumbnails?.s || resort.thumbnails?.full,
            savingsPercent: originalTotal
              ? savingsPercent(originalTotal, totalPrice)
              : undefined,
            city: resort.city || resort.destination,
            state:
              resort.state ||
              DEST_STATE[resort.destination.toLowerCase()] ||
              undefined,
            country: "US",
            brandSlug: "westgate",
          };

          try {
            await storeDeal(deal, "westgate", html);
            log.info(
              `Stored resort: ${deal.title} ($${deal.price}/3 nights)`,
            );
          } catch (err) {
            log.error(`Failed to store resort ${deal.title}: ${err}`);
          }
        }
      }

      // ── Enqueue pages from the homepage / main specials page ───────────
      if (!isDetailPage) {
        // Enqueue the main /specials/ hub page
        const specialsHub =
          "https://www.westgatereservations.com/specials/";
        if (!enqueuedUrls.has(specialsHub)) {
          enqueuedUrls.add(specialsHub);
          await crawler.addRequests([{ url: specialsHub }]);
          log.info(`Enqueued specials hub: ${specialsHub}`);
        }

        // Enqueue all destination-specific specials pages
        for (const dest of destinations) {
          const destUrl = `https://www.westgatereservations.com/specials/${dest.slug}/`;
          if (!enqueuedUrls.has(destUrl)) {
            enqueuedUrls.add(destUrl);
            await crawler.addRequests([{ url: destUrl }]);
            log.info(`Enqueued destination page: ${destUrl}`);
          }
        }

        // Enqueue /vacation-deals/ category pages to catch any extras
        const categoryPages = [
          "https://www.westgatereservations.com/vacation-deals/",
          "https://www.westgatereservations.com/vacation-deals/couples/",
          "https://www.westgatereservations.com/vacation-deals/family/",
          "https://www.westgatereservations.com/vacation-deals/beach/",
          "https://www.westgatereservations.com/vacation-deals/spring/",
          "https://www.westgatereservations.com/vacation-deals/summer/",
          "https://www.westgatereservations.com/vacation-deals/fall/",
          "https://www.westgatereservations.com/vacation-deals/last-minute/",
          "https://www.westgatereservations.com/vacation-deals/cheap/",
          "https://www.westgatereservations.com/vacation-deals/orlando/",
          "https://www.westgatereservations.com/vacation-deals/gatlinburg/",
        ];
        for (const catUrl of categoryPages) {
          if (!enqueuedUrls.has(catUrl)) {
            enqueuedUrls.add(catUrl);
            await crawler.addRequests([{ url: catUrl }]);
            log.info(`Enqueued category page: ${catUrl}`);
          }
        }
      }

      // ── Also discover deal links from the DOM (not just APP_DATA) ──────
      $('a[href*="/specials/"]').each(function () {
        let href = $(this).attr("href");
        if (!href) return;
        // Make absolute
        if (href.startsWith("/")) {
          href = `https://www.westgatereservations.com${href}`;
        }
        // Only enqueue individual deal pages, not destination pages
        if (
          href.includes("/specials/") &&
          !isDestinationPage(href) &&
          href !== "https://www.westgatereservations.com/specials/" &&
          !enqueuedUrls.has(href)
        ) {
          enqueuedUrls.add(href);
          crawler.addRequests([{ url: href }]);
          log.info(`Enqueued DOM-discovered deal: ${href}`);
        }
      });
    },
  });

  await crawler.run(["https://www.westgatereservations.com"]);

  console.log(
    `[Westgate] Crawl complete. Processed ${processedSpecialIds.size} specials, ${processedResortIds.size} resorts, visited ${enqueuedUrls.size} URLs.`,
  );
}

/** The 9 known destination slugs — used to distinguish destination listing
 *  pages from individual deal pages under /specials/ */
const DESTINATION_SLUGS = new Set([
  "orlando",
  "gatlinburg",
  "las-vegas",
  "branson",
  "myrtle-beach",
  "cocoa-beach",
  "park-city",
  "river-ranch",
  "williamsburg",
]);

function isDestinationPage(url: string): boolean {
  // Extract slug from /specials/{slug}/
  const match = url.match(/\/specials\/([^/]+)\/?$/);
  if (!match) return false;
  return DESTINATION_SLUGS.has(match[1]);
}

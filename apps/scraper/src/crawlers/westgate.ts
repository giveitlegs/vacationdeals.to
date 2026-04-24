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

/**
 * URLs whose content rotates or doesn't match a specific deal.
 * Storing deals against these URLs is misleading because a user clicking
 * through may see something completely different from what we advertised.
 * Examples:
 *   - /specials/travel-deal-tuesday/  — weekly rotating promo
 *   - /specials/orlando-189/           — generic Orlando landing, no specific deal
 *   - /specials/exclusive-cyber-monday-discount/  — seasonal
 *   - /specials/sunshine-day-summer-sale/          — seasonal
 */
/**
 * Westgate detail pages have an H1 filled in by Angular (`{{data.special.title}}`)
 * that isn't in the raw HTML. The reliable source of truth for price + nights
 * is the server-rendered <meta description> / <meta og:description> tag, e.g.
 *   "3-day/2-night Orlando Resort stay at Westgate Lakes ... From $329."
 *   "4-Day Resort stay plus $200 VISA Gift Card ... From $519."
 */
function extractMetaDescription(html: string): string | null {
  const patterns = [
    /<meta\s+property=["']og:description["']\s+content=["']([^"']+)["']/i,
    /<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i,
  ];
  for (const p of patterns) {
    const m = html.match(p);
    if (m) return m[1].replace(/&amp;/g, "&").replace(/&#039;/g, "'").replace(/&quot;/g, '"');
  }
  return null;
}

function priceFromMeta(text: string): number | null {
  const patterns = [
    /(?:from|for(?:\s+just)?|only|starting\s+at)\s+\$\s*([\d,]+(?:\.\d{2})?)/i,
    /\$\s*([\d,]+(?:\.\d{2})?)\s*(?:per\s+package|package)/i,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) {
      const n = parseFloat(m[1].replace(/,/g, ""));
      if (Number.isFinite(n) && n >= 29 && n <= 5000) return n;
    }
  }
  return null;
}

function nightsFromMeta(text: string): { nights: number; days: number } | null {
  // "3-day/2-night", "4-Day/3-Night", "5-Day/4-Night"
  const p1 = text.match(/(\d+)[-\s]?day\s*[\/,\-\s]+\s*(\d+)[-\s]?night/i);
  if (p1) {
    const days = parseInt(p1[1], 10);
    const nights = parseInt(p1[2], 10);
    if (days >= 2 && days <= 10 && nights >= 1 && nights <= 9) return { days, nights };
  }
  const p2 = text.match(/(\d+)[-\s]?night\s*[\/,\-\s]+\s*(\d+)[-\s]?day/i);
  if (p2) {
    const nights = parseInt(p2[1], 10);
    const days = parseInt(p2[2], 10);
    if (days >= 2 && days <= 10 && nights >= 1 && nights <= 9) return { days, nights };
  }
  const p3 = text.match(/(\d+)\s+days?\s+(\d+)\s+nights?/i);
  if (p3) {
    const days = parseInt(p3[1], 10);
    const nights = parseInt(p3[2], 10);
    if (days >= 2 && days <= 10 && nights >= 1 && nights <= 9) return { days, nights };
  }
  const p4 = text.match(/(\d+)[-\s]?nights?/i);
  if (p4) {
    const n = parseInt(p4[1], 10);
    if (n >= 1 && n <= 9) return { nights: n, days: n + 1 };
  }
  return null;
}

function isRotatingOrGenericUrl(url: string): boolean {
  const lower = url.toLowerCase();
  const patterns = [
    /\/travel-deal-tuesday\//,
    /\/cyber-monday/,
    /\/black-friday/,
    /\/summer-sale/,
    /\/memorial-day/,
    /\/labor-day/,
    // Generic city-price patterns like /specials/orlando-189/, /specials/orlando-59/
    // (these are rotating/aggregate landers, not specific packages)
    /\/specials\/(orlando|branson|vegas|gatlinburg|myrtle-beach)-\d+\//,
    /\/view-exclusive-offer/,
  ];
  return patterns.some((p) => p.test(lower));
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

      // ── Detail-page DOM correction pass ─────────────────────────────────
      // When we're on a specific deal's detail page, parse the server-rendered
      // meta description and use its price + nights as truth. If APP_DATA
      // said something different, the corrected ScrapedDeal from this pass
      // overrides it (storeDeal upserts by URL). This handles cases where
      // APP_DATA has drifted from the marketer's current hero copy.
      if (isDetailPage) {
        const meta = extractMetaDescription(html);
        if (meta && specials) {
          const matching = specials.find((s) => specialToAbsoluteUrl(s.url) === request.url);
          if (matching) {
            const metaPrice = priceFromMeta(meta);
            const metaNights = nightsFromMeta(meta);
            const stalePrice = metaPrice != null && Math.abs(metaPrice - matching.prices.discounted) > 1;
            const staleNights = metaNights != null && metaNights.nights !== matching.nights;
            if (stalePrice || staleNights) {
              log.info(`DOM correction for ${request.url}: ${stalePrice ? `price ${matching.prices.discounted}→${metaPrice}` : ""} ${staleNights ? `nights ${matching.nights}→${metaNights!.nights}` : ""}`);
              const destInfo = matching.destinations.length > 0
                ? destIdToInfo(destinations, matching.destinations[0])
                : null;
              const corrected: ScrapedDeal = {
                title: matching.title,
                price: metaPrice ?? matching.prices.discounted,
                originalPrice: matching.prices.retail,
                durationNights: metaNights?.nights ?? matching.nights,
                durationDays: metaNights?.days ?? matching.days,
                description: matching.excerpt || meta,
                url: request.url,
                imageUrl: matching.thumbnails?.s || matching.thumbnails?.full,
                inclusions: matching.package_includes?.map((p) => p.item),
                savingsPercent: savingsPercent(matching.prices.retail, metaPrice ?? matching.prices.discounted),
                travelWindow: "Book within 6 months",
                city: destInfo?.city || "Multiple Destinations",
                state: destInfo?.state,
                country: "US",
                brandSlug: "westgate",
              };
              try {
                await storeDeal(corrected, "westgate", html);
              } catch (err) {
                log.error(`DOM correction store failed for ${request.url}: ${err}`);
              }
            }
          }
        }
      }

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

          // Skip rotating-promo URLs: their content doesn't match APP_DATA
          if (isRotatingOrGenericUrl(dealUrl)) {
            log.info(`Skip rotating/generic URL: ${dealUrl}`);
            continue;
          }
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
          !isRotatingOrGenericUrl(href) &&
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

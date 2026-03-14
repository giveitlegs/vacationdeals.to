import { PlaywrightCrawler, log as crawleeLog } from "crawlee";
import { storeDeal } from "../storage/deal-store";
import type { ScrapedDeal } from "@vacationdeals/shared";

const BASE_URL = "https://getawaydealz.com";

/**
 * Known location paths discovered from the site's navigation.
 * The crawler also discovers hotel sub-pages dynamically.
 */
const LOCATION_PATHS = [
  "locations/florida/orlando",
  "locations/florida/kissimmee",
  "locations/tennessee/gatlinburg",
  "locations/tennessee/pigeon-forge",
  "locations/south-carolina/myrtle-beach",
  "locations/south-carolina/north-myrtle-beach",
  "locations/south-carolina/hilton-head",
  "locations/virginia/massanutten",
  "locations/virginia/williamsburg",
  "locations/nevada/las-vegas",
  "locations/missouri/branson",
  "locations/mexico/cabo-san-lucas",
  "locations/mexico/cancun",
  "locations/mexico/cozumel",
  "locations/mexico/playa-del-carmen",
  "locations/mexico/puerto-morelos",
  "locations/mexico/riviera-maya",
  "locations/mexico/tulum",
  "locations/dominican-republic/punta-cana",
];

/** Map state slugs to proper state names */
const STATE_MAP: Record<string, string> = {
  florida: "Florida",
  tennessee: "Tennessee",
  "south-carolina": "South Carolina",
  virginia: "Virginia",
  nevada: "Nevada",
  missouri: "Missouri",
};

/** Map country slugs to proper country names */
const COUNTRY_MAP: Record<string, string> = {
  mexico: "MX",
  "dominican-republic": "DO",
};

interface ParsedLocation {
  city: string;
  state?: string;
  country: string;
}

/**
 * Parse location from a URL path like /locations/florida/orlando/hotels/...
 */
function parseLocationFromUrl(url: string): ParsedLocation {
  const match = url.match(/locations\/([^/]+)\/([^/]+)/);
  if (!match) return { city: "Unknown", country: "US" };

  const [, regionSlug, citySlug] = match;
  const city = citySlug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  const state = STATE_MAP[regionSlug];
  const country = COUNTRY_MAP[regionSlug] || "US";

  return { city, state, country };
}

/**
 * Unslugify a hotel name from URL.
 * e.g. "westgate-town-center" -> "Westgate Town Center"
 */
function unslugify(slug: string): string {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/**
 * GetawayDealz is a Next.js React SPA. The page renders resort deals with
 * pricing matrices via streamed hydration data (self.__next_f.push).
 *
 * Strategy:
 * 1. Start with location pages to discover hotel sub-pages.
 * 2. On hotel pages, wait for React to render pricing, then extract deal data
 *    from the rendered DOM.
 */
export async function runGetawaydealzCrawler() {
  const crawler = new PlaywrightCrawler({
    maxRequestsPerCrawl: 80,
    headless: true,
    navigationTimeoutSecs: 60,
    requestHandlerTimeoutSecs: 90,
    maxConcurrency: 3,

    async requestHandler({ request, page, log }) {
      const url = request.url;
      log.info(`Scraping ${url}`);

      // --- Location index pages (e.g. /locations/florida/orlando) ---
      // These list the hotels for a given city. We enqueue the hotel links.
      if (
        url.includes("/locations/") &&
        !url.includes("/hotels/")
      ) {
        log.info(`Location index page: ${url}`);

        // Wait for the page to render hotel cards
        await page.waitForLoadState("networkidle", { timeout: 30000 }).catch(() => {});
        await page.waitForTimeout(3000);

        // Discover hotel links
        const hotelLinks = await page.$$eval("a[href*='/hotels/']", (anchors) =>
          anchors
            .map((a) => (a as HTMLAnchorElement).href)
            .filter((href) => href.includes("/hotels/"))
        );

        const uniqueLinks = [...new Set(hotelLinks)];
        log.info(`Found ${uniqueLinks.length} hotel links on ${url}`);

        for (const link of uniqueLinks) {
          await crawler.addRequests([{ url: link, label: "hotel" }]);
        }
        return;
      }

      // --- Hotel detail pages ---
      if (url.includes("/hotels/")) {
        log.info(`Hotel detail page: ${url}`);

        // Wait for pricing to render
        await page.waitForLoadState("networkidle", { timeout: 30000 }).catch(() => {});
        await page.waitForTimeout(4000);

        const location = parseLocationFromUrl(url);

        // Extract hotel name from URL
        const hotelSlugMatch = url.match(/\/hotels\/([^/?#]+)/);
        const resortName = hotelSlugMatch
          ? unslugify(hotelSlugMatch[1])
          : undefined;

        // Try to get data from the rendered DOM
        const deals = await page.evaluate(() => {
          const results: Array<{
            roomType: string;
            price: number;
            originalPrice: number | null;
            savingsPercent: number | null;
            imageUrl: string | null;
            description: string | null;
            durationNights: number;
            durationDays: number;
            inclusions: string[];
            presentationMinutes: number | null;
            travelWindow: string | null;
            requirements: string[];
          }> = [];

          // Get page text content for duration parsing
          const bodyText = document.body.innerText || "";

          // Parse duration - look for "X Days / Y Nights" pattern
          const durationMatch = bodyText.match(
            /(\d+)\s*Days?\s*[/&]\s*(\d+)\s*Nights?/i
          );
          const durationDays = durationMatch ? parseInt(durationMatch[1]) : 4;
          const durationNights = durationMatch ? parseInt(durationMatch[2]) : 3;

          // Parse travel window
          const travelWindowMatch = bodyText.match(
            /(?:through|valid|expires?|book(?:ing)?.*?(?:by|through|until))\s+([A-Z][a-z]+\s+\d{1,2},?\s+\d{4})/i
          );
          const travelWindow = travelWindowMatch
            ? travelWindowMatch[1]
            : null;

          // Parse presentation requirement
          const presentationMatch = bodyText.match(
            /(\d+)[\s-]*(?:minute|min)\s+(?:vacation\s+ownership\s+)?(?:sales\s+)?presentation/i
          );
          const presentationMinutes = presentationMatch
            ? parseInt(presentationMatch[1])
            : null;

          // Collect inclusions from bullet points / amenities sections
          const inclusionEls = document.querySelectorAll(
            'ul li, [class*="amenit"] li, [class*="includ"] li, [class*="feature"] li'
          );
          const allInclusions: string[] = [];
          inclusionEls.forEach((el) => {
            const text = (el as HTMLElement).innerText?.trim();
            if (
              text &&
              text.length > 5 &&
              text.length < 200 &&
              !text.includes("$")
            ) {
              allInclusions.push(text);
            }
          });

          // Collect requirements
          const requirements: string[] = [];
          const reqPatterns = [
            /(?:married|cohabiting)\s+couple/i,
            /ages?\s+\d+[\s-]+\d+/i,
            /combined.*?income.*?\$[\d,]+/i,
            /(?:annual|minimum)\s+income.*?\$[\d,]+/i,
            /FICO.*?\d+/i,
            /credit\s+(?:card|score)/i,
            /cannot\s+reside\s+within\s+\d+\s+miles/i,
          ];
          const paragraphs = document.querySelectorAll("p, li, span, div");
          paragraphs.forEach((el) => {
            const text = (el as HTMLElement).innerText?.trim();
            if (!text) return;
            for (const pat of reqPatterns) {
              if (pat.test(text) && text.length < 300) {
                requirements.push(text);
                break;
              }
            }
          });

          // Find room type cards with pricing
          // GetawayDealz shows cards for each room type (Studio, 1-Bedroom, etc.)
          // Each card has a price, retail price, and room type name.
          // We look for dollar amounts associated with room type headings.

          // Strategy: find all price elements and their context
          const priceElements = document.querySelectorAll("*");
          const priceData: Array<{
            text: string;
            price: number;
            element: Element;
          }> = [];

          priceElements.forEach((el) => {
            const text = (el as HTMLElement).innerText?.trim();
            if (!text) return;
            // Match standalone prices like "$99" or "$149"
            const priceMatch = text.match(/^\$(\d{1,3}(?:,\d{3})*)$/);
            if (priceMatch) {
              priceData.push({
                text,
                price: parseInt(priceMatch[1].replace(",", "")),
                element: el,
              });
            }
          });

          // Look for room type sections with associated pricing
          // Room types: Studio Villa, 1 Bedroom Villa, 2 Bedroom Villa,
          //             Standard Guest Room, Junior Suite, etc.
          const roomTypePatterns = [
            /studio\s*(?:villa|suite|room)?/i,
            /(?:1|one)[\s-]*bed(?:room)?\s*(?:villa|suite)?/i,
            /(?:2|two)[\s-]*bed(?:room)?\s*(?:villa|suite)?/i,
            /(?:3|three)[\s-]*bed(?:room)?\s*(?:villa|suite)?/i,
            /standard\s*(?:guest)?\s*room/i,
            /oceanfront\s*(?:guest)?\s*room/i,
            /junior\s*suite/i,
            /deluxe\s*(?:suite|room)/i,
          ];

          // Try to find card-like containers for each room type
          const containers = document.querySelectorAll(
            '[class*="card"], [class*="package"], [class*="room"], [class*="price"], [class*="rate"], section, article'
          );

          const seenPrices = new Set<string>();

          containers.forEach((container) => {
            const containerText =
              (container as HTMLElement).innerText || "";
            if (containerText.length > 5000) return; // Skip too-large containers

            let roomType: string | null = null;
            for (const pat of roomTypePatterns) {
              const m = containerText.match(pat);
              if (m) {
                roomType = m[0];
                break;
              }
            }
            if (!roomType) return;

            // Find price in this container
            const priceMatch = containerText.match(
              /(?:from|price|total)?\s*\$(\d{1,3}(?:,\d{3})*)/i
            );
            if (!priceMatch) return;

            const price = parseInt(priceMatch[1].replace(",", ""));
            if (price < 30 || price > 2000) return;

            // Find original/retail price
            const retailMatch = containerText.match(
              /(?:retail|original|was|regular|value).*?\$(\d{1,3}(?:,\d{3})*)/i
            );
            const originalPrice = retailMatch
              ? parseInt(retailMatch[1].replace(",", ""))
              : null;

            const key = `${roomType}-${price}`;
            if (seenPrices.has(key)) return;
            seenPrices.add(key);

            // Calculate savings
            const savingsPercent =
              originalPrice && originalPrice > price
                ? Math.round(
                    ((originalPrice - price) / originalPrice) * 100
                  )
                : null;

            // Find image
            const img = container.querySelector("img");
            const imageUrl = img
              ? img.src || img.getAttribute("data-src")
              : null;

            results.push({
              roomType,
              price,
              originalPrice,
              savingsPercent,
              imageUrl,
              description: null,
              durationNights,
              durationDays,
              inclusions:
                allInclusions.length > 0
                  ? allInclusions.slice(0, 15)
                  : [],
              presentationMinutes,
              travelWindow,
              requirements: [...new Set(requirements)].slice(0, 10),
            });
          });

          // Fallback: if no room-type containers found, try to parse from
          // structured text patterns like "Studio Villa From $99"
          if (results.length === 0) {
            const allText = bodyText;
            const linePatterns =
              /(?:Studio|1[\s-]?Bed(?:room)?|2[\s-]?Bed(?:room)?|3[\s-]?Bed(?:room)?|Standard|Oceanfront|Junior|Deluxe)[^\n$]*?\$(\d{1,4})/gi;
            let m;
            while ((m = linePatterns.exec(allText)) !== null) {
              const fullMatch = m[0];
              const price = parseInt(m[1]);
              if (price < 30 || price > 2000) continue;

              const roomType = fullMatch.split(/\$|From|from/)[0].trim();
              const key = `${roomType}-${price}`;
              if (seenPrices.has(key)) continue;
              seenPrices.add(key);

              // Look for retail price nearby
              const afterMatch = allText
                .substring(m.index, m.index + 200);
              const retailMatch = afterMatch.match(
                /(?:retail|original|was|value).*?\$(\d{1,4})/i
              );
              const originalPrice = retailMatch
                ? parseInt(retailMatch[1])
                : null;
              const savingsPercent =
                originalPrice && originalPrice > price
                  ? Math.round(
                      ((originalPrice - price) / originalPrice) * 100
                    )
                  : null;

              results.push({
                roomType,
                price,
                originalPrice,
                savingsPercent,
                imageUrl: null,
                description: null,
                durationNights,
                durationDays,
                inclusions:
                  allInclusions.length > 0
                    ? allInclusions.slice(0, 15)
                    : [],
                presentationMinutes,
                travelWindow,
                requirements: [...new Set(requirements)].slice(0, 10),
              });
            }
          }

          return results;
        });

        if (!deals || deals.length === 0) {
          log.warning(`No deals extracted from ${url}`);

          // Fallback: try to get at least one deal from page text
          const fallbackDeal = await page.evaluate(() => {
            const text = document.body.innerText || "";
            const priceMatch = text.match(
              /(?:from|starting\s+at|for)\s+\$(\d{1,4})/i
            );
            if (!priceMatch) return null;
            const price = parseInt(priceMatch[1]);
            if (price < 30 || price > 2000) return null;

            const durationMatch = text.match(
              /(\d+)\s*Days?\s*[/&]\s*(\d+)\s*Nights?/i
            );
            const presentationMatch = text.match(
              /(\d+)[\s-]*(?:minute|min)\s+(?:vacation\s+ownership\s+)?(?:sales\s+)?presentation/i
            );

            return {
              price,
              durationDays: durationMatch ? parseInt(durationMatch[1]) : 4,
              durationNights: durationMatch ? parseInt(durationMatch[2]) : 3,
              presentationMinutes: presentationMatch
                ? parseInt(presentationMatch[1])
                : null,
            };
          });

          if (fallbackDeal) {
            const deal: ScrapedDeal = {
              title: `${resortName || location.city} - ${fallbackDeal.durationDays} Days / ${fallbackDeal.durationNights} Nights`,
              price: fallbackDeal.price,
              durationNights: fallbackDeal.durationNights,
              durationDays: fallbackDeal.durationDays,
              resortName,
              url,
              city: location.city,
              state: location.state,
              country: location.country,
              brandSlug: "getawaydealz",
              presentationMinutes: fallbackDeal.presentationMinutes ?? 120,
            };

            log.info(
              `Storing fallback deal: ${deal.title} @ $${deal.price}`
            );
            await storeDeal(deal, "getawaydealz");
          }
          return;
        }

        // Store each room type as a separate deal
        for (const d of deals) {
          const deal: ScrapedDeal = {
            title: `${resortName || location.city} - ${d.roomType} - ${d.durationDays} Days / ${d.durationNights} Nights`,
            price: d.price,
            originalPrice: d.originalPrice ?? undefined,
            durationNights: d.durationNights,
            durationDays: d.durationDays,
            description: d.description ?? undefined,
            resortName,
            url,
            imageUrl: d.imageUrl ?? undefined,
            inclusions:
              d.inclusions.length > 0 ? d.inclusions : undefined,
            requirements:
              d.requirements.length > 0 ? d.requirements : undefined,
            presentationMinutes: d.presentationMinutes ?? 120,
            travelWindow: d.travelWindow ?? undefined,
            savingsPercent: d.savingsPercent ?? undefined,
            city: location.city,
            state: location.state,
            country: location.country,
            brandSlug: "getawaydealz",
          };

          log.info(
            `Storing deal: ${deal.title} @ $${deal.price} (was $${deal.originalPrice ?? "N/A"})`
          );
          await storeDeal(deal, "getawaydealz");
        }

        return;
      }

      // --- Homepage: discover location links ---
      log.info("Homepage or other page, discovering links...");
      await page.waitForLoadState("networkidle", { timeout: 30000 }).catch(() => {});
      await page.waitForTimeout(3000);

      const locationLinks = await page.$$eval(
        "a[href*='/locations/']",
        (anchors) =>
          anchors
            .map((a) => (a as HTMLAnchorElement).href)
            .filter((href) => href.includes("/locations/"))
      );

      const uniqueLocationLinks = [...new Set(locationLinks)];
      log.info(
        `Found ${uniqueLocationLinks.length} location links on homepage`
      );

      for (const link of uniqueLocationLinks) {
        await crawler.addRequests([{ url: link }]);
      }
    },

    failedRequestHandler({ request, log }) {
      log.warning(`Request failed: ${request.url}`);
    },
  });

  // Seed URLs: homepage + all known location pages
  const seedUrls = [
    BASE_URL,
    ...LOCATION_PATHS.map((p) => `${BASE_URL}/${p}`),
  ];

  crawleeLog.info(
    `GetawayDealz crawler starting with ${seedUrls.length} seed URLs`
  );
  await crawler.run(seedUrls);
  crawleeLog.info("GetawayDealz crawler finished");
}

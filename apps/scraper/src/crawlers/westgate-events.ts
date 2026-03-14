import { PlaywrightCrawler } from "crawlee";
import { storeDeal } from "../storage/deal-store";
import type { ScrapedDeal } from "@vacationdeals/shared";

/**
 * Westgate Events crawler.
 *
 * westgateevents.com is a WordPress site that sells concert/sports/show
 * vacation packages bundled with Westgate resort stays.
 *
 * Homepage structure:
 *   - Event cards in Bootstrap grid (.col-lg-3 / .col-lg-4)
 *   - #event-results container with AJAX-loaded content
 *   - AJAX endpoint: /wp-admin/admin-ajax.php?action=filter_events
 *   - Pagination via .ajax-paging a[data-page]
 *   - Filter by: category, location, month, sort
 *
 * Event card structure (from AJAX HTML):
 *   <a href="/events/{slug}/">
 *     <img src="...322x190.jpg" alt="Event Name">
 *     <span class="event-label">MULTI DATE</span>
 *     <h3>Event Name</h3>
 *     <p>City, State</p>
 *     <p>From$XXXPer Couple</p>
 *     <span>View Event</span>
 *   </a>
 *
 * Individual event pages contain:
 *   - .experience-includes — list of inclusions
 *   - Price with original price and savings %
 *   - Resort name and address
 *   - Event dates
 *   - Schema.org MusicEvent / SportsEvent markup
 *   - Image in slick slider
 *
 * Known destinations: Orlando FL, Las Vegas NV, Gatlinburg TN,
 *   Branson MO, Myrtle Beach SC, Williamsburg VA
 */

const BASE_URL = "https://westgateevents.com";

// Map location strings to structured data
const LOCATION_MAP: Record<string, { city: string; state: string }> = {
  "orlando, fl": { city: "Orlando", state: "FL" },
  "kissimmee, fl": { city: "Kissimmee", state: "FL" },
  "las vegas, nv": { city: "Las Vegas", state: "NV" },
  "gatlinburg, tn": { city: "Gatlinburg", state: "TN" },
  "branson, mo": { city: "Branson", state: "MO" },
  "myrtle beach, sc": { city: "Myrtle Beach", state: "SC" },
  "williamsburg, va": { city: "Williamsburg", state: "VA" },
  "cocoa beach, fl": { city: "Cocoa Beach", state: "FL" },
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function parsePrice(text: string): number | null {
  // "From$199Per Couple" or "From $199 per couple" or "$199"
  const cleaned = text.replace(/\s+/g, " ").replace(/,/g, "");
  const match = cleaned.match(/\$(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

function parseOriginalPrice(text: string): number | null {
  // Look for strikethrough / original price pattern: "$799" before the sale price
  const match = text.replace(/,/g, "").match(/\$(\d{3,})/g);
  if (match && match.length >= 2) {
    // Highest price is likely the original
    const prices = match.map((p) => parseInt(p.replace("$", ""), 10));
    prices.sort((a, b) => b - a);
    return prices[0];
  }
  return null;
}

function parseSavings(text: string): number | null {
  const m = text.match(/(\d+)\s*%\s*(?:savings?|off|discount)/i);
  if (m) return parseInt(m[1], 10);
  const m2 = text.match(/save\s+(\d+)\s*%/i);
  if (m2) return parseInt(m2[1], 10);
  return null;
}

function parseLocation(text: string): { city: string; state: string } | null {
  const normalized = text.toLowerCase().trim();
  if (LOCATION_MAP[normalized]) return LOCATION_MAP[normalized];

  // Try "City, ST" pattern
  const m = text.match(/^([\w\s]+),\s*([A-Z]{2})$/);
  if (m) return { city: m[1].trim(), state: m[2] };

  return null;
}

function parseNightsFromText(text: string): number | null {
  const m = text.match(/(\d+)\s*nights?/i);
  return m ? parseInt(m[1], 10) : null;
}

function parseDatesFromText(text: string): string | null {
  // "May 25 - 27, 2026" or "Sep 30 - Oct 2, 2026"
  const m = text.match(
    /([A-Z][a-z]+\s+\d{1,2})\s*[-–]\s*(?:([A-Z][a-z]+)\s+)?(\d{1,2}),?\s*(\d{4})/,
  );
  if (m) return m[0];
  return null;
}

// ── Main crawler ─────────────────────────────────────────────────────────────

export async function runWestgateEventsCrawler() {
  const processedUrls = new Set<string>();

  const crawler = new PlaywrightCrawler({
    maxRequestsPerCrawl: 80,
    navigationTimeoutSecs: 60,
    requestHandlerTimeoutSecs: 90,
    headless: true,
    async requestHandler({ request, page, log }) {
      log.info(`Scraping ${request.url}`);
      const url = request.url;

      // ── Homepage / listing page: extract event cards and paginate ──────
      if (url === BASE_URL || url === `${BASE_URL}/` || url.includes("admin-ajax")) {
        // Wait for event results to load
        await page
          .waitForSelector("#event-results a, .filter_result", { timeout: 15000 })
          .catch(() => {});
        await page.waitForTimeout(1500);

        // Extract event card links from the current page
        const eventLinks = await page.$$eval(
          '#event-results a[href*="/events/"]',
          (els) =>
            els.map((a) => {
              const anchor = a as HTMLAnchorElement;
              const h3 = anchor.querySelector("h3");
              const paragraphs = anchor.querySelectorAll("p");
              let location = "";
              let priceText = "";

              paragraphs.forEach((p) => {
                const text = p.textContent || "";
                if (text.includes("$")) {
                  priceText = text;
                } else if (text.includes(",")) {
                  location = text.trim();
                }
              });

              return {
                url: anchor.href,
                title: h3?.textContent?.trim() || "",
                location,
                priceText,
                imageUrl:
                  anchor.querySelector("img")?.getAttribute("src") || "",
                isSoldOut: (anchor.textContent || "").includes("SOLD OUT"),
              };
            }),
        );

        log.info(`Found ${eventLinks.length} event cards on listing page`);

        // Enqueue individual event pages for detailed scraping
        for (const event of eventLinks) {
          if (event.isSoldOut) {
            log.info(`Skipping sold-out event: ${event.title}`);
            continue;
          }
          if (event.url && !processedUrls.has(event.url)) {
            await crawler.addRequests([
              {
                url: event.url,
                userData: {
                  listingTitle: event.title,
                  listingLocation: event.location,
                  listingPrice: event.priceText,
                  listingImage: event.imageUrl,
                },
              },
            ]);
          }
        }

        // Handle AJAX pagination — click through pages
        if (!url.includes("admin-ajax")) {
          const totalPages = await page
            .$$eval(".ajax-paging a[data-page]", (els) =>
              Math.max(...els.map((a) => parseInt(a.getAttribute("data-page") || "1", 10))),
            )
            .catch(() => 1);

          if (totalPages > 1) {
            log.info(`Found ${totalPages} pages of events`);
            for (let pg = 2; pg <= Math.min(totalPages, 10); pg++) {
              // Click the pagination link and wait for new content
              const pageSelector = `.ajax-paging a[data-page="${pg}"]`;
              const pageLink = await page.$(pageSelector);
              if (pageLink) {
                await pageLink.click();
                await page.waitForTimeout(2000);

                // Extract event cards from the new page
                const newLinks = await page.$$eval(
                  '#event-results a[href*="/events/"]',
                  (els) =>
                    els.map((a) => {
                      const anchor = a as HTMLAnchorElement;
                      const h3 = anchor.querySelector("h3");
                      const paragraphs = anchor.querySelectorAll("p");
                      let location = "";
                      let priceText = "";
                      paragraphs.forEach((p) => {
                        const text = p.textContent || "";
                        if (text.includes("$"))  priceText = text;
                        else if (text.includes(",")) location = text.trim();
                      });
                      return {
                        url: anchor.href,
                        title: h3?.textContent?.trim() || "",
                        location,
                        priceText,
                        isSoldOut: (anchor.textContent || "").includes("SOLD OUT"),
                      };
                    }),
                );

                for (const event of newLinks) {
                  if (event.isSoldOut) continue;
                  if (event.url && !processedUrls.has(event.url)) {
                    await crawler.addRequests([
                      {
                        url: event.url,
                        userData: {
                          listingTitle: event.title,
                          listingLocation: event.location,
                          listingPrice: event.priceText,
                        },
                      },
                    ]);
                  }
                }

                log.info(`Page ${pg}: found ${newLinks.length} event cards`);
              }
            }
          }
        }

        return;
      }

      // ── Individual event page: extract full deal details ───────────────
      if (!url.includes("/events/")) return;
      if (processedUrls.has(url)) return;
      processedUrls.add(url);

      await page.waitForLoadState("networkidle", { timeout: 20000 }).catch(() => {});
      await page.waitForTimeout(1000);

      const userData = request.userData as {
        listingTitle?: string;
        listingLocation?: string;
        listingPrice?: string;
        listingImage?: string;
      };

      // Check for sold out
      const pageText = await page.evaluate(() => document.body?.innerText || "");
      if (pageText.includes("SOLD OUT")) {
        log.info(`Skipping sold-out event page: ${url}`);
        return;
      }

      // Event title
      const title = await page
        .$eval("h1", (el) => el.textContent?.trim() || "")
        .catch(() => userData.listingTitle || "");

      if (!title) {
        log.info(`No title found on ${url}, skipping`);
        return;
      }

      // Price
      let price: number | null = null;
      const priceText = await page.evaluate(() => {
        const body = document.body?.innerText || "";
        // Look for "From $XXX" or "$XXX per couple"
        const m = body.match(/(?:from\s*)?\$(\d+)\s*(?:per\s*couple)?/i);
        return m ? m[0] : "";
      });
      price = parsePrice(priceText);

      // Fallback: try listing data
      if (!price && userData.listingPrice) {
        price = parsePrice(userData.listingPrice);
      }

      if (!price || price <= 0) {
        log.info(`No price found for "${title}", skipping`);
        return;
      }

      // Original price and savings
      const originalPrice = parseOriginalPrice(pageText);
      const savingsPercent = parseSavings(pageText);

      // Location
      let location: { city: string; state: string } | null = null;

      // Try from page content first
      const locationText = await page.evaluate(() => {
        // Look for map-pin or location elements
        const locEl = document.querySelector(
          ".event-location, [class*='location'], .map-pin + span, .map-pin ~ *",
        );
        if (locEl) return locEl.textContent?.trim() || "";

        // Check for "City, ST" pattern in paragraphs
        const paragraphs = document.querySelectorAll("p");
        for (const p of paragraphs) {
          const text = p.textContent?.trim() || "";
          if (/^[\w\s]+,\s*[A-Z]{2}\s*\d{5}/.test(text)) return text;
          if (/^[\w\s]+,\s*[A-Z]{2}$/.test(text)) return text;
        }
        return "";
      });

      if (locationText) {
        // Extract city, state from address or location text
        const m = locationText.match(/([\w\s]+),\s*([A-Z]{2})/);
        if (m) location = { city: m[1].trim(), state: m[2] };
      }

      if (!location && userData.listingLocation) {
        location = parseLocation(userData.listingLocation);
      }

      if (!location) {
        // Try to infer from resort name
        if (pageText.toLowerCase().includes("kissimmee") || pageText.toLowerCase().includes("orlando")) {
          location = { city: "Orlando", state: "FL" };
        } else if (pageText.toLowerCase().includes("las vegas")) {
          location = { city: "Las Vegas", state: "NV" };
        } else if (pageText.toLowerCase().includes("gatlinburg")) {
          location = { city: "Gatlinburg", state: "TN" };
        } else if (pageText.toLowerCase().includes("branson")) {
          location = { city: "Branson", state: "MO" };
        } else if (pageText.toLowerCase().includes("myrtle beach")) {
          location = { city: "Myrtle Beach", state: "SC" };
        } else {
          location = { city: "Unknown", state: "" };
        }
      }

      // Resort name
      const resortName = await page.evaluate(() => {
        const body = document.body?.innerText || "";
        // Look for "Westgate [Resort Name]" pattern
        const m = body.match(/Westgate\s[\w\s]+(?:Resort|Hotel|Casino|Club)/i);
        return m ? m[0].trim() : "";
      }) || "Westgate Resort";

      // Duration: event packages are typically 2-3 nights
      const nights = parseNightsFromText(pageText) || 2;

      // Travel dates
      const travelWindow = parseDatesFromText(pageText) || undefined;

      // Image URL
      const imageUrl = await page
        .$eval(
          ".slick-slide img, .event-details img, .wp-post-image",
          (img) => (img as HTMLImageElement).src,
        )
        .catch(() => userData.listingImage || undefined);

      // Inclusions from .experience-includes
      const inclusions = await page.$$eval(
        ".experience-includes li, .experience-includes p",
        (els) =>
          els
            .map((el) => el.textContent?.trim() || "")
            .filter((t) => t.length > 0),
      ).catch(() => [] as string[]);

      if (inclusions.length === 0) {
        inclusions.push(`${nights + 1} Days / ${nights} Nights at ${resortName}`);
        inclusions.push("Event tickets included");
        inclusions.push("Resort accommodation");
      }

      const deal: ScrapedDeal = {
        title: `${title} - ${location.city} Event Package`,
        price,
        originalPrice: originalPrice && originalPrice > price ? originalPrice : undefined,
        durationNights: nights,
        durationDays: nights + 1,
        description: `${title} event package including ${nights} nights at ${resortName} in ${location.city}, ${location.state}. Includes event tickets, accommodation, and more.`,
        resortName,
        url,
        imageUrl,
        inclusions: inclusions.length > 0 ? inclusions : undefined,
        requirements: [
          "Must attend 120-minute timeshare presentation",
          "Ages 25-70",
          "Must be employed with combined household income $50,000+",
          "Married/cohabitating couples must attend together",
        ],
        presentationMinutes: 120,
        travelWindow,
        savingsPercent: savingsPercent ?? undefined,
        city: location.city,
        state: location.state,
        country: "US",
        brandSlug: "westgate-events",
      };

      try {
        await storeDeal(deal, "westgate-events");
        log.info(`Stored: ${deal.title} ($${deal.price})`);
      } catch (err) {
        log.error(`Failed to store ${deal.title}: ${err}`);
      }
    },
  });

  await crawler.run([BASE_URL]);
}

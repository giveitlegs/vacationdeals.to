import { CheerioCrawler } from "crawlee";
import { storeDeal } from "../storage/deal-store";
import type { ScrapedDeal } from "@vacationdeals/shared";

/**
 * Westgate Events crawler.
 *
 * westgateevents.com is a WordPress site that sells concert/sports/show
 * vacation packages bundled with Westgate resort stays.
 *
 * Listing page: /events/ (server-rendered, paginated at /events/page/N/)
 *   - #event-results > .row > .col-lg-3 > .event-wrapper > a.box.style3
 *   - Each card: div.image (img + span.date + div.status_tags) +
 *               div.text (span.title + div.action > div.left (location) +
 *                         div.right (span.price) + span.cta-btn)
 *   - Sold-out cards have class "sold" on a.box and span.status.sold badge
 *   - ~111 events across 10 pages (12 per page)
 *
 * Individual event pages (/events/{slug}/):
 *   - h2 title, price in .price span, "Was: $XXX" original price
 *   - Resort name and address in content
 *   - Duration shown as "X Nights + Y Tickets"
 *   - Inclusions list (ul > li) after "Experience Includes:" heading
 *   - Schema.org MusicEvent / SportsEvent JSON-LD
 *   - Images in .content-video section or .wp-post-image
 *
 * Known destinations: Orlando FL, Las Vegas NV, Gatlinburg TN,
 *   Branson MO, Myrtle Beach SC, Williamsburg VA
 */

const BASE_URL = "https://westgateevents.com";
const EVENTS_URL = `${BASE_URL}/events/`;
const MAX_PAGES = 12; // safety limit

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
  const cleaned = text.replace(/\s+/g, " ").replace(/,/g, "");
  const match = cleaned.match(/\$(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

function parseOriginalPrice(text: string): number | null {
  // "Was: $799" or "Was:$799"
  const m = text.match(/was\s*:?\s*\$(\d[\d,]*)/i);
  if (m) return parseInt(m[1].replace(/,/g, ""), 10);
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
  const m = text.match(/([\w\s]+),\s*([A-Z]{2})/);
  if (m) return { city: m[1].trim(), state: m[2] };

  return null;
}

function parseNightsFromDate(dateText: string): number | null {
  // "May 25 – May 27, 2026" => 2 nights
  // "Mar 19 - Mar 21, 2026" => 2 nights
  // "Mar 20 - Mar 23, 2026" => 3 nights
  // "Apr 10 – Apr 13, 2026" => 3 nights
  const m = dateText.match(
    /([A-Z][a-z]+)\s+(\d{1,2})\s*[-–]\s*(?:([A-Z][a-z]+)\s+)?(\d{1,2}),?\s*(\d{4})/,
  );
  if (!m) return null;

  const startMonth = m[1];
  const startDay = parseInt(m[2], 10);
  const endMonth = m[3] || startMonth;
  const endDay = parseInt(m[4], 10);
  const year = parseInt(m[5], 10);

  const MONTHS: Record<string, number> = {
    Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
    Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
  };

  const startIdx = MONTHS[startMonth];
  const endIdx = MONTHS[endMonth];
  if (startIdx === undefined || endIdx === undefined) return null;

  const start = new Date(year, startIdx, startDay);
  const end = new Date(year, endIdx, endDay);
  const diffMs = end.getTime() - start.getTime();
  const nights = Math.round(diffMs / (1000 * 60 * 60 * 24));
  return nights > 0 && nights <= 14 ? nights : null;
}

function inferLocationFromText(text: string): { city: string; state: string } {
  const lower = text.toLowerCase();
  if (lower.includes("kissimmee") || lower.includes("orlando"))
    return { city: "Orlando", state: "FL" };
  if (lower.includes("las vegas"))
    return { city: "Las Vegas", state: "NV" };
  if (lower.includes("gatlinburg"))
    return { city: "Gatlinburg", state: "TN" };
  if (lower.includes("branson"))
    return { city: "Branson", state: "MO" };
  if (lower.includes("myrtle beach"))
    return { city: "Myrtle Beach", state: "SC" };
  if (lower.includes("williamsburg"))
    return { city: "Williamsburg", state: "VA" };
  if (lower.includes("cocoa beach"))
    return { city: "Cocoa Beach", state: "FL" };
  return { city: "Unknown", state: "" };
}

// ── Main crawler ─────────────────────────────────────────────────────────────

export async function runWestgateEventsCrawler() {
  const processedSlugs = new Set<string>();
  let totalStored = 0;

  const crawler = new CheerioCrawler({
    maxRequestsPerCrawl: 150,
    maxConcurrency: 3,
    async requestHandler({ request, $, log }) {
      const url = request.url;
      const label = request.label || "LISTING";

      // ── Listing pages: /events/ and /events/page/N/ ────────────────────
      if (label === "LISTING") {
        const cards = $("#event-results a.box");
        log.info(`[${url}] Found ${cards.length} event cards`);

        if (cards.length === 0) {
          // Fallback: try homepage "New Events" section cards
          const homeCards = $("a.box.style3");
          if (homeCards.length > 0) {
            log.info(`Fallback: found ${homeCards.length} cards on page`);
          }
        }

        cards.each((_, el) => {
          const $card = $(el);
          const href = $card.attr("href") || "";
          const isSold =
            $card.hasClass("sold") ||
            $card.find(".status.sold").length > 0;

          if (isSold) {
            const soldTitle = $card.find(".title").text().trim();
            log.info(`Skipping sold-out: ${soldTitle}`);
            return;
          }

          // Extract listing-level data from the card
          const title = $card.find(".title").text().trim();
          const priceText = $card.find(".price").text().trim();
          const locationText = $card.find(".action .left span").text().trim();
          const dateText = $card.find(".date span").last().text().trim();
          const imageUrl =
            $card.find(".image img").first().attr("src") || "";

          // Dedupe by slug
          const slugMatch = href.match(/\/events\/([^/]+)\/?$/);
          const slug = slugMatch ? slugMatch[1] : href;
          if (processedSlugs.has(slug)) return;
          processedSlugs.add(slug);

          const fullUrl = href.startsWith("http")
            ? href
            : `${BASE_URL}${href}`;

          // Parse card data for use as fallback on detail page
          const price = parsePrice(priceText);
          const location = parseLocation(locationText);
          const nights = parseNightsFromDate(dateText);

          // Enqueue the individual event page
          crawler.addRequests([
            {
              url: fullUrl,
              label: "DETAIL",
              userData: {
                listingTitle: title,
                listingPrice: price,
                listingLocation: location,
                listingNights: nights,
                listingDate: dateText,
                listingImage: imageUrl,
              },
            },
          ]);
        });

        // Enqueue pagination links: /events/page/2/ through /events/page/N/
        const pageLinks = $("a.page");
        const pageNumbers: number[] = [];
        pageLinks.each((_, el) => {
          const pageHref = $(el).attr("href") || "";
          const pageMatch = pageHref.match(/\/page\/(\d+)/);
          if (pageMatch) pageNumbers.push(parseInt(pageMatch[1], 10));
        });

        if (pageNumbers.length > 0) {
          const maxPage = Math.min(Math.max(...pageNumbers), MAX_PAGES);
          const currentPageMatch = url.match(/\/page\/(\d+)/);
          const currentPage = currentPageMatch
            ? parseInt(currentPageMatch[1], 10)
            : 1;

          // Only enqueue pages we haven't visited yet (from page 1, enqueue all)
          if (currentPage === 1) {
            for (let pg = 2; pg <= maxPage; pg++) {
              crawler.addRequests([
                {
                  url: `${EVENTS_URL}page/${pg}/`,
                  label: "LISTING",
                },
              ]);
            }
            log.info(`Enqueued pages 2-${maxPage}`);
          }
        }

        return;
      }

      // ── Individual event detail page ───────────────────────────────────
      if (label === "DETAIL") {
        const userData = request.userData as {
          listingTitle?: string;
          listingPrice?: number | null;
          listingLocation?: { city: string; state: string } | null;
          listingNights?: number | null;
          listingDate?: string;
          listingImage?: string;
        };

        const pageText = $("body").text() || "";

        // Check for sold out on detail page
        if (
          $(".status.sold").length > 0 ||
          pageText.includes("SOLD OUT")
        ) {
          log.info(`Skipping sold-out detail page: ${url}`);
          return;
        }

        // Title: prefer h2 (main event heading), then h1, then listing data
        let title =
          $("h2").first().text().trim() ||
          $("h1").first().text().trim() ||
          userData.listingTitle ||
          "";

        // Some h1/h2 contain site-wide text; filter those out
        if (
          title.toLowerCase().includes("westgate events") ||
          title.toLowerCase().includes("cheer harder")
        ) {
          title = userData.listingTitle || "";
        }

        if (!title) {
          log.info(`No title found on ${url}, skipping`);
          return;
        }

        // Price: try .price element, then body regex, then listing data
        let price: number | null = null;
        const priceEl = $(".price").first().text().trim();
        if (priceEl) price = parsePrice(priceEl);
        if (!price) {
          const priceMatch = pageText.match(
            /(?:from\s*)?\$(\d[\d,]*)\s*(?:per\s*couple)?/i,
          );
          if (priceMatch)
            price = parseInt(priceMatch[1].replace(/,/g, ""), 10);
        }
        if (!price && userData.listingPrice) {
          price = userData.listingPrice;
        }
        if (!price || price <= 0) {
          log.info(`No price found for "${title}", skipping`);
          return;
        }

        // Original price
        const originalPrice = parseOriginalPrice(pageText);
        const savingsPercent = parseSavings(pageText);

        // Location: try detail page address, then listing data, then infer
        let location: { city: string; state: string } | null = null;

        // Look for address pattern in page text
        const addrMatch = pageText.match(
          /\d+[^,\n]+,\s*([\w\s]+),\s*([A-Z]{2})\s*\d{5}/,
        );
        if (addrMatch) {
          location = { city: addrMatch[1].trim(), state: addrMatch[2] };
        }
        if (!location && userData.listingLocation) {
          location = userData.listingLocation;
        }
        if (!location) {
          location = inferLocationFromText(pageText);
        }

        // Resort name
        const resortMatch = pageText.match(
          /Westgate\s[\w\s]+(?:Resort|Hotel|Casino|Club|Tower)/i,
        );
        const resortName = resortMatch
          ? resortMatch[0].trim()
          : "Westgate Resort";

        // Duration: try "X Nights" from page, then date range, then listing
        let nights: number | null = null;
        const nightsMatch = pageText.match(/(\d+)\s*nights?/i);
        if (nightsMatch) nights = parseInt(nightsMatch[1], 10);
        if (!nights && userData.listingDate) {
          nights = parseNightsFromDate(userData.listingDate);
        }
        if (!nights && userData.listingNights) {
          nights = userData.listingNights;
        }
        if (!nights) nights = 2; // default for event packages

        // Travel window / dates
        const travelWindow = userData.listingDate || undefined;

        // Image: try detail page images, then listing image
        let imageUrl =
          $(".content-video img, .wp-post-image, .slick-slide img")
            .first()
            .attr("src") ||
          userData.listingImage ||
          undefined;
        // Prefer full-size image over 322x190 thumbnail
        if (imageUrl && imageUrl.includes("-322x190")) {
          imageUrl = imageUrl.replace(/-322x190/, "");
        }

        // Inclusions: look for list items in the experience/includes section
        const inclusions: string[] = [];
        $("ul li").each((_, el) => {
          const text = $(el).text().trim();
          // Filter to inclusion-like items (skip nav, footer, etc.)
          if (
            text.length > 5 &&
            text.length < 200 &&
            (text.toLowerCase().includes("night") ||
              text.toLowerCase().includes("ticket") ||
              text.toLowerCase().includes("transport") ||
              text.toLowerCase().includes("accommodation") ||
              text.toLowerCase().includes("dinner") ||
              text.toLowerCase().includes("drink") ||
              text.toLowerCase().includes("welcome") ||
              text.toLowerCase().includes("checkout") ||
              text.toLowerCase().includes("party") ||
              text.toLowerCase().includes("resort") ||
              text.toLowerCase().includes("seat") ||
              text.toLowerCase().includes("pass") ||
              text.toLowerCase().includes("admission") ||
              text.toLowerCase().includes("breakfast") ||
              text.toLowerCase().includes("helicopter") ||
              text.toLowerCase().includes("cruise") ||
              text.toLowerCase().includes("zipline") ||
              text.toLowerCase().includes("park"))
          ) {
            inclusions.push(text);
          }
        });

        if (inclusions.length === 0) {
          inclusions.push(
            `${nights + 1} Days / ${nights} Nights at ${resortName}`,
          );
          inclusions.push("Event tickets included");
          inclusions.push("Resort accommodation");
        }

        const deal: ScrapedDeal = {
          title: `${title} - ${location.city} Event Package`,
          price,
          originalPrice:
            originalPrice && originalPrice > price
              ? originalPrice
              : undefined,
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
          totalStored++;
          log.info(`Stored: ${deal.title} ($${deal.price})`);
        } catch (err) {
          log.error(`Failed to store ${deal.title}: ${err}`);
        }

        return;
      }
    },
  });

  await crawler.run([{ url: EVENTS_URL, label: "LISTING" }]);

  console.log(
    `[westgate-events] Finished. Stored ${totalStored} deals from ${processedSlugs.size} unique events.`,
  );
}

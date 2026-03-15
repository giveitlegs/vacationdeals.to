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

// ── Event type classification ────────────────────────────────────────────────

type EventType = "concert" | "show" | "sports" | "comedy" | "attraction" | "getaway";

/** Keywords that signal a specific event type */
const CONCERT_KEYWORDS = [
  "concert", "live in concert", "tour", "band", "music",
];
const SHOW_KEYWORDS = [
  "show", "dinner show", "stampede", "theater", "theatre", "cirque",
  "performance", "spectacular", "revue", "musical",
];
const SPORTS_KEYWORDS = [
  "game", "match", "nfl", "nba", "nhl", "mlb", "ufc", "boxing",
  "football", "basketball", "hockey", "baseball", "racing", "nascar",
];
const COMEDY_KEYWORDS = [
  "comedy", "comedian", "stand-up", "standup", "laugh",
];
const ATTRACTION_KEYWORDS = [
  "busch gardens", "seaworld", "legoland", "disney", "universal",
  "gatorland", "zipline", "theme park", "water park", "aquarium",
  "museum", "zoo",
];
const GETAWAY_KEYWORDS = [
  "a weekend in", "a week in", "getaway", "escape",
];

/** Known artists/performers — lets us tag concerts even without keywords */
const KNOWN_ARTISTS = [
  "metallica", "eagles", "jennifer lopez", "j-lo", "bruno mars",
  "adele", "elton john", "billy joel", "garth brooks", "luke bryan",
  "keith urban", "rod stewart", "sting", "u2", "aerosmith", "kiss",
  "def leppard", "journey", "santana", "pitbull", "shakira", "bad bunny",
  "maná", "mana", "marc anthony", "enrique iglesias", "reba mcentire",
  "carrie underwood", "blake shelton", "chris stapleton", "morgan wallen",
  "luke combs", "post malone", "drake", "usher", "janet jackson",
  "celine dion", "mariah carey", "backstreet boys", "new kids on the block",
  "boyz ii men", "earth wind and fire", "chicago", "fleetwood mac",
  "stevie nicks", "lady gaga", "pink", "coldplay", "imagine dragons",
  "foo fighters", "green day", "blink-182", "red hot chili peppers",
  "dave chappelle", "kevin hart", "jeff dunham", "gabriel iglesias",
  "sebastian maniscalco", "joe rogan", "bill burr", "bert kreischer",
];

function classifyEventType(title: string, pageText: string): EventType {
  const lower = (title + " " + pageText).toLowerCase();

  // Check getaway first (weekend/week resort-only packages)
  if (GETAWAY_KEYWORDS.some((kw) => title.toLowerCase().includes(kw))) {
    return "getaway";
  }
  // Attractions (theme parks, etc.)
  if (ATTRACTION_KEYWORDS.some((kw) => lower.includes(kw))) {
    return "attraction";
  }
  // Comedy
  if (COMEDY_KEYWORDS.some((kw) => lower.includes(kw))) {
    return "comedy";
  }
  // Sports
  if (SPORTS_KEYWORDS.some((kw) => lower.includes(kw))) {
    return "sports";
  }
  // Show (dinner shows, theater, etc.)
  if (SHOW_KEYWORDS.some((kw) => lower.includes(kw))) {
    return "show";
  }
  // Known artist → concert
  if (KNOWN_ARTISTS.some((a) => title.toLowerCase().includes(a))) {
    return "concert";
  }
  // Concert keywords
  if (CONCERT_KEYWORDS.some((kw) => lower.includes(kw))) {
    return "concert";
  }
  // JSON-LD type hint from the page
  if (lower.includes('"musicevent"') || lower.includes('"sportsEvent"')) {
    // If we haven't matched anything specific, treat MusicEvent as concert
    return "concert";
  }

  // Default: if the page has ticket-related content, treat as concert; else getaway
  if (lower.includes("ticket")) return "concert";
  return "getaway";
}

/**
 * Extract the venue name from the detail page.
 * The site puts venue info in the page content but NOT in the JSON-LD location
 * (which uses the resort address). Common patterns:
 *   - "at The Sphere" / "at T-Mobile Arena" / "at The Colosseum"
 *   - Venue names appear in text near "at" before a comma or period
 *   - For attractions: the attraction name IS the venue (e.g. "Busch Gardens")
 */
function extractVenueName(
  title: string,
  pageText: string,
  eventType: EventType,
): string | null {
  // For attractions, the title itself is the venue
  if (eventType === "attraction") {
    // Extract attraction name: "A Day at Busch Gardens" → "Busch Gardens"
    const atMatch = title.match(/(?:a day at|a night at|visit)\s+(.+)/i);
    if (atMatch) return atMatch[1].trim();
    return title; // fallback: full title is the attraction
  }

  // For getaway packages, there's no separate venue
  if (eventType === "getaway") return null;

  // Look for "at {Venue}" patterns in the page text
  // Common venues: The Sphere, T-Mobile Arena, The Colosseum at Caesar's Palace,
  // Amway Center, Bridgestone Arena, etc.
  const venuePatterns = [
    /(?:tickets?\s+(?:to|for)\s+.+?\s+)?at\s+(The\s+Sphere)/i,
    /at\s+(T-Mobile\s+Arena)/i,
    /at\s+(The\s+Colosseum\s+at\s+Caesars?\s+Palace)/i,
    /at\s+(The\s+Colosseum)/i,
    /at\s+(Amway\s+Center)/i,
    /at\s+(Bridgestone\s+Arena)/i,
    /at\s+(Madison\s+Square\s+Garden)/i,
    /at\s+(MGM\s+Grand\s+Garden\s+Arena)/i,
    /at\s+(Mandalay\s+Bay\s+Events?\s+Center)/i,
    /at\s+(Allegiant\s+Stadium)/i,
    /at\s+(Hard\s+Rock\s+Stadium)/i,
    /at\s+(Dolby\s+Live)/i,
    /at\s+(Resorts\s+World\s+Theatre)/i,
    /at\s+(Zappos\s+Theater)/i,
    /at\s+(Pigeon\s+Forge)/i,
    /at\s+(Dolly\s+Parton'?s?\s+Stampede)/i,
    // Generic: "at The/Some Venue Name" (2-5 capitalized words)
    /\bat\s+((?:The\s+)?[A-Z][\w']+(?:\s+[A-Z][\w']+){0,4}(?:\s+(?:Arena|Center|Theatre|Theater|Stadium|Garden|Colosseum|Amphitheatre|Amphitheater|Pavilion|Hall|Dome|Sphere|Palace|Live)))/,
  ];

  for (const pattern of venuePatterns) {
    const m = pageText.match(pattern);
    if (m) return m[1].trim();
  }

  // Try title: "Metallica at The Sphere" → "The Sphere"
  const titleAt = title.match(/\bat\s+(.+)$/i);
  if (titleAt) {
    const venue = titleAt[1].trim();
    // Only accept if it looks like a venue (starts with capital, not a city)
    if (venue.match(/^[A-Z]/) && !venue.match(/^(Orlando|Las Vegas|Gatlinburg|Branson|Myrtle|Williamsburg)/)) {
      return venue;
    }
  }

  return null;
}

/**
 * Build an SEO-optimized deal title based on event type, artist, city, venue.
 */
function buildSEOTitle(
  eventName: string,
  eventType: EventType,
  city: string,
  venueName: string | null,
): string {
  const venueStr = venueName ? ` at ${venueName}` : "";

  switch (eventType) {
    case "concert":
      return `Discount ${eventName} Concert Tickets ${city}${venueStr}`;
    case "sports":
      return `Discount ${eventName} Sports Tickets ${city}${venueStr}`;
    case "comedy":
      return `Discount ${eventName} Comedy Show Tickets ${city}${venueStr}`;
    case "show":
      return `Discount ${eventName} Show Tickets ${city}${venueStr}`;
    case "attraction":
      return `Discount ${eventName} Tickets ${city}${venueStr}`;
    case "getaway":
      return `Discount ${city} Vacation Package — ${eventName}`;
  }
}

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

        // Event type classification + venue extraction
        const eventType = classifyEventType(title, pageText);
        const venueName = extractVenueName(title, pageText, eventType);
        log.info(`Event type: ${eventType}, venue: ${venueName || "none"}`);

        // Build SEO-optimized title
        const seoTitle = buildSEOTitle(title, eventType, location.city, venueName);

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
          if (eventType !== "getaway") {
            inclusions.push("Event tickets included");
          }
          inclusions.push("Resort accommodation");
        }

        // Build description based on event type
        const descriptionParts = [seoTitle];
        if (eventType === "getaway") {
          descriptionParts.push(
            `including ${nights} nights at ${resortName} in ${location.city}, ${location.state}.`,
          );
        } else {
          descriptionParts.push(
            `vacation package including ${nights} nights at ${resortName} in ${location.city}, ${location.state}.`,
          );
          if (venueName) {
            descriptionParts.push(`Event held at ${venueName}.`);
          }
          descriptionParts.push("Includes event tickets, accommodation, and more.");
        }

        const deal: ScrapedDeal = {
          title: seoTitle,
          price,
          originalPrice:
            originalPrice && originalPrice > price
              ? originalPrice
              : undefined,
          durationNights: nights,
          durationDays: nights + 1,
          description: descriptionParts.join(" "),
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

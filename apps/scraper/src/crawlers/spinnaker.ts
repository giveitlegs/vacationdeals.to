import { CheerioCrawler } from "crawlee";
import { storeDeal } from "../storage/deal-store";
import type { ScrapedDeal } from "@vacationdeals/shared";

/**
 * Spinnaker Resorts crawler (spinnakerresorts.com).
 *
 * Spinnaker is a direct timeshare brand offering 4D/3N mini-vacation packages
 * at $269-$359+tax across 4 destinations: Hilton Head Island, Branson,
 * Ormond Beach, Williamsburg.
 *
 * Site structure (WordPress + Elementor):
 *   - Mini vacations hub: /home/offers/mini-vacations/
 *   - Destination pages: /home/offers/mini-vacations/{prefix}-mini-vacations/
 *     - hhi = Hilton Head Island
 *     - br = Branson
 *     - ob = Ormond Beach
 *     - wb = Williamsburg
 *   - Each destination page lists 3 named packages with price, inclusions
 *   - Booking via contact form with query params: travel_destination, package, source
 *   - Deals include Visa gift cards + entertainment credits
 *   - All packages are 4 days / 3 nights
 *   - Requires 90-minute presentation attendance
 *
 * Strategy:
 *   1. Crawl the mini-vacations hub to discover destination pages
 *   2. Crawl each destination page to extract named packages
 *   3. Use known deal data as structured fallback
 */

const BASE_URL = "https://spinnakerresorts.com";

// ── Known packages from all 4 destinations ──────────────────────────────────

interface KnownPackage {
  destination: string;
  destinationSlug: string;
  city: string;
  state: string;
  packageName: string;
  price: number;
  nights: number;
  days: number;
  inclusions: string[];
  resortName: string;
  bookingWindow: string;
}

const KNOWN_PACKAGES: KnownPackage[] = [
  // Hilton Head Island
  {
    destination: "Hilton Head Island", destinationSlug: "hhi",
    city: "Hilton Head", state: "SC",
    packageName: "Southern Belle", price: 359, nights: 3, days: 4,
    inclusions: ["4 Days / 3 Nights", "$100 Visa Gift Card", "$100 Entertainment Credits"],
    resortName: "Spinnaker Resorts Hilton Head", bookingWindow: "12 months",
  },
  {
    destination: "Hilton Head Island", destinationSlug: "hhi",
    city: "Hilton Head", state: "SC",
    packageName: "Dolphin Sighting!", price: 299, nights: 3, days: 4,
    inclusions: ["4 Days / 3 Nights", "2 Dolphin Cruises", "$100 Entertainment Credits"],
    resortName: "Spinnaker Resorts Hilton Head", bookingWindow: "3 months",
  },
  {
    destination: "Hilton Head Island", destinationSlug: "hhi",
    city: "Hilton Head", state: "SC",
    packageName: "Master Your Swing", price: 329, nights: 3, days: 4,
    inclusions: ["4 Days / 3 Nights", "$50 Visa Gift Card", "$150 Entertainment Credits"],
    resortName: "Spinnaker Resorts Hilton Head", bookingWindow: "6 months",
  },
  // Branson
  {
    destination: "Branson", destinationSlug: "br",
    city: "Branson", state: "MO",
    packageName: "Ozark Mountaineer", price: 329, nights: 3, days: 4,
    inclusions: ["4 Days / 3 Nights", "1-Bedroom Condo", "$100 Visa Gift Card", "$50 Entertainment Credits"],
    resortName: "Spinnaker Resorts Branson", bookingWindow: "12 months",
  },
  {
    destination: "Branson", destinationSlug: "br",
    city: "Branson", state: "MO",
    packageName: "Showstopper", price: 299, nights: 3, days: 4,
    inclusions: ["4 Days / 3 Nights", "1-Bedroom Condo", "$50 Visa Gift Card", "$50 Entertainment Credits"],
    resortName: "Spinnaker Resorts Branson", bookingWindow: "3 months",
  },
  {
    destination: "Branson", destinationSlug: "br",
    city: "Branson", state: "MO",
    packageName: "Roller Coaster Madness", price: 269, nights: 3, days: 4,
    inclusions: ["4 Days / 3 Nights", "Hotel Stay", "$100 Entertainment Credits"],
    resortName: "Spinnaker Resorts Branson", bookingWindow: "6 months",
  },
  // Ormond Beach
  {
    destination: "Ormond Beach", destinationSlug: "ob",
    city: "Ormond Beach", state: "FL",
    packageName: "Nautical Fun", price: 359, nights: 3, days: 4,
    inclusions: ["4 Days / 3 Nights", "$100 Visa Gift Card", "$100 Entertainment Credits"],
    resortName: "Royal Floridian Resort", bookingWindow: "12 months",
  },
  {
    destination: "Ormond Beach", destinationSlug: "ob",
    city: "Ormond Beach", state: "FL",
    packageName: "Ol' Fashioned Charm", price: 299, nights: 3, days: 4,
    inclusions: ["4 Days / 3 Nights", "$50 Visa Gift Card", "$50 Entertainment Credits"],
    resortName: "Royal Floridian Resort", bookingWindow: "3 months",
  },
  {
    destination: "Ormond Beach", destinationSlug: "ob",
    city: "Ormond Beach", state: "FL",
    packageName: "Beach Girl", price: 329, nights: 3, days: 4,
    inclusions: ["4 Days / 3 Nights", "$50 Visa Gift Card", "$150 Entertainment Credits"],
    resortName: "Royal Floridian Resort", bookingWindow: "6 months",
  },
  // Williamsburg
  {
    destination: "Williamsburg", destinationSlug: "wb",
    city: "Williamsburg", state: "VA",
    packageName: "History Explorer", price: 329, nights: 3, days: 4,
    inclusions: ["4 Days / 3 Nights", "1-Bedroom Condo", "$100 Visa Gift Card", "$50 Entertainment Credits"],
    resortName: "Kings Creek Plantation", bookingWindow: "12 months",
  },
  {
    destination: "Williamsburg", destinationSlug: "wb",
    city: "Williamsburg", state: "VA",
    packageName: "Grand Golfer", price: 299, nights: 3, days: 4,
    inclusions: ["4 Days / 3 Nights", "1-Bedroom Condo", "$50 Visa Gift Card", "$50 Entertainment Credits"],
    resortName: "Kings Creek Plantation", bookingWindow: "12 months",
  },
  {
    destination: "Williamsburg", destinationSlug: "wb",
    city: "Williamsburg", state: "VA",
    packageName: "Sunset Cruiser", price: 269, nights: 3, days: 4,
    inclusions: ["4 Days / 3 Nights", "Hotel Stay", "$50 Visa Gift Card", "$100 Entertainment Credits"],
    resortName: "Kings Creek Plantation", bookingWindow: "12 months",
  },
];

// ── Destination sub-pages to crawl ──────────────────────────────────────────

const DESTINATION_PAGES = [
  { slug: "hhi", city: "Hilton Head", state: "SC" },
  { slug: "br", city: "Branson", state: "MO" },
  { slug: "ob", city: "Ormond Beach", state: "FL" },
  { slug: "wb", city: "Williamsburg", state: "VA" },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function parsePrice(text: string): number | null {
  const match = text.replace(/,/g, "").match(/\$(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

function resolveUrl(href: string): string {
  if (href.startsWith("http")) return href;
  return `${BASE_URL}${href.startsWith("/") ? "" : "/"}${href}`;
}

// ── Main crawler ─────────────────────────────────────────────────────────────

export async function runSpinnakerCrawler() {
  const processedUrls = new Set<string>();
  let dealsFoundFromPages = 0;

  const crawler = new CheerioCrawler({
    maxRequestsPerCrawl: 20,
    async requestHandler({ request, $, log }) {
      log.info(`Scraping ${request.url}`);

      const isMiniVacationsHub =
        request.url.includes("/mini-vacations/") &&
        !request.url.includes("-mini-vacations/");

      // ── Mini-vacations hub: discover destination pages ─────────────────
      if (isMiniVacationsHub) {
        const destUrls: string[] = [];
        $('a[href*="mini-vacations"]').each((_i, el) => {
          const href = $(el).attr("href") || "";
          if (href.includes("-mini-vacations")) {
            const fullUrl = resolveUrl(href);
            if (!processedUrls.has(fullUrl) && !destUrls.includes(fullUrl)) {
              destUrls.push(fullUrl);
            }
          }
        });

        // Also enqueue known destination pages
        for (const dest of DESTINATION_PAGES) {
          const url = `${BASE_URL}/home/offers/mini-vacations/${dest.slug}-mini-vacations/`;
          if (!destUrls.includes(url) && !processedUrls.has(url)) {
            destUrls.push(url);
          }
        }

        if (destUrls.length > 0) {
          await crawler.addRequests(destUrls.map((url) => ({ url })));
          log.info(`Enqueued ${destUrls.length} destination mini-vacation pages`);
        }

        return;
      }

      // ── Destination mini-vacation pages ────────────────────────────────
      if (request.url.includes("-mini-vacations/")) {
        // Determine which destination this is
        const destMatch = DESTINATION_PAGES.find((d) =>
          request.url.includes(`${d.slug}-mini-vacations`),
        );
        if (!destMatch) {
          log.warning(`Unknown destination page: ${request.url}`);
          return;
        }

        const pageText = $("body").text();

        // Try to extract deals from the Elementor-rendered page
        // Spinnaker uses Elementor with accordion/tab sections per package
        // Look for price patterns ($XXX) and package name patterns
        const priceMatches = pageText.match(/\$\d{2,3}\s*\+?\s*tax/gi) || [];
        const packageNames = KNOWN_PACKAGES.filter(
          (p) => p.destinationSlug === destMatch.slug,
        );

        // Try to parse individual package sections
        // Elementor sections often use .elementor-element or .e-con
        const sections = $(".elementor-element, .e-con, .e-n-accordion-item, section");

        let foundFromDOM = false;

        sections.each((_i, el) => {
          const section = $(el);
          const sectionText = section.text();

          // Check if this section contains a package
          for (const known of packageNames) {
            if (
              sectionText.includes(known.packageName) &&
              sectionText.includes(`$${known.price}`)
            ) {
              const bookingUrl = `${BASE_URL}/home/contact/mini-vacation-request/?travel_destination=${destMatch.city.replace(/\s+/g, "-")}&package=${known.packageName.replace(/\s+/g, "-")}`;
              if (processedUrls.has(bookingUrl)) return;
              processedUrls.add(bookingUrl);

              // Try to find image in or near this section
              const imgSrc =
                section.find("img").first().attr("src") ||
                section.find("img").first().attr("data-src") ||
                "";
              const imageUrl = imgSrc ? resolveUrl(imgSrc) : undefined;

              const deal: ScrapedDeal = {
                title: `${known.packageName} - ${destMatch.city}`,
                price: known.price,
                durationNights: known.nights,
                durationDays: known.days,
                description: `Spinnaker Resorts ${known.packageName} package in ${destMatch.city}. ${known.bookingWindow} to reserve dates. Requires 90-minute presentation.`,
                resortName: known.resortName,
                url: bookingUrl,
                imageUrl,
                inclusions: known.inclusions,
                presentationMinutes: 90,
                city: destMatch.city,
                state: destMatch.state,
                country: "US",
                brandSlug: "spinnaker",
              };

              storeDeal(deal, "spinnaker")
                .then(() => {
                  dealsFoundFromPages++;
                  log.info(`Stored deal: ${deal.title} ($${deal.price})`);
                })
                .catch((err) => log.error(`Failed to store deal ${deal.title}: ${err}`));

              foundFromDOM = true;
            }
          }
        });

        // If we couldn't parse from DOM sections, try simpler text matching
        if (!foundFromDOM) {
          for (const known of packageNames) {
            if (
              pageText.includes(known.packageName) ||
              pageText.includes(`$${known.price}`)
            ) {
              const bookingUrl = `${BASE_URL}/home/contact/mini-vacation-request/?travel_destination=${destMatch.city.replace(/\s+/g, "-")}&package=${known.packageName.replace(/\s+/g, "-")}`;
              if (processedUrls.has(bookingUrl)) continue;
              processedUrls.add(bookingUrl);

              // Try to grab any image from the page for this destination
              const imgSrc = $("img[src*='elementor'], img[src*='resort'], img[src*='vacation']")
                .first()
                .attr("src") || "";
              const imageUrl = imgSrc ? resolveUrl(imgSrc) : undefined;

              const deal: ScrapedDeal = {
                title: `${known.packageName} - ${destMatch.city}`,
                price: known.price,
                durationNights: known.nights,
                durationDays: known.days,
                description: `Spinnaker Resorts ${known.packageName} package in ${destMatch.city}. ${known.bookingWindow} to reserve dates. Requires 90-minute presentation.`,
                resortName: known.resortName,
                url: bookingUrl,
                imageUrl,
                inclusions: known.inclusions,
                presentationMinutes: 90,
                city: destMatch.city,
                state: destMatch.state,
                country: "US",
                brandSlug: "spinnaker",
              };

              try {
                await storeDeal(deal, "spinnaker");
                dealsFoundFromPages++;
                log.info(`Stored text-matched deal: ${deal.title} ($${deal.price})`);
              } catch (err) {
                log.error(`Failed to store deal ${deal.title}: ${err}`);
              }
            }
          }
        }

        return;
      }

      // ── Homepage or other pages: look for offer links ──────────────────
      $('a[href*="mini-vacations"], a[href*="offers"]').each((_i, el) => {
        const href = $(el).attr("href") || "";
        const fullUrl = resolveUrl(href);
        if (
          fullUrl.includes("spinnakerresorts.com") &&
          !processedUrls.has(fullUrl)
        ) {
          crawler.addRequests([{ url: fullUrl }]).catch(() => {});
        }
      });
    },
  });

  // Start from the mini-vacations hub
  await crawler.run([
    `${BASE_URL}/home/offers/mini-vacations/`,
  ]);

  // ── Fallback: if crawling didn't yield results, use known packages ──────
  if (dealsFoundFromPages === 0) {
    console.log("[Spinnaker] No deals parsed from pages, using known packages fallback");
    for (const known of KNOWN_PACKAGES) {
      const bookingUrl = `${BASE_URL}/home/contact/mini-vacation-request/?travel_destination=${known.city.replace(/\s+/g, "-")}&package=${known.packageName.replace(/\s+/g, "-")}`;
      if (processedUrls.has(bookingUrl)) continue;
      processedUrls.add(bookingUrl);

      const deal: ScrapedDeal = {
        title: `${known.packageName} - ${known.city}`,
        price: known.price,
        durationNights: known.nights,
        durationDays: known.days,
        description: `Spinnaker Resorts ${known.packageName} package in ${known.city}. ${known.bookingWindow} to reserve dates. Requires 90-minute presentation.`,
        resortName: known.resortName,
        url: bookingUrl,
        inclusions: known.inclusions,
        presentationMinutes: 90,
        city: known.city,
        state: known.state,
        country: "US",
        brandSlug: "spinnaker",
      };

      try {
        await storeDeal(deal, "spinnaker");
        console.log(`[Spinnaker] Stored fallback deal: ${deal.title} ($${deal.price})`);
      } catch (err) {
        console.error(`[Spinnaker] Failed to store fallback deal ${deal.title}: ${err}`);
      }
    }
  }
}

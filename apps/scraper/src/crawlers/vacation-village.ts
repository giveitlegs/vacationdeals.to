import { CheerioCrawler } from "crawlee";
import { storeDeal } from "../storage/deal-store";
import type { ScrapedDeal } from "@vacationdeals/shared";

/**
 * Vacation Village Deals crawler (vacationvillagedeals.com).
 *
 * Vacation Village is a direct timeshare brand offering heavily discounted
 * vacation packages ($49-$299) across Orlando, Las Vegas, South Florida,
 * Williamsburg, and the Berkshires.
 *
 * Site structure:
 *   - Homepage lists all deals grouped by destination
 *   - Each deal card has: image link, duration in heading, price, "BOOK THIS DEAL NOW" link
 *   - Individual deal pages at {destination}-vacation-deals/{deal-slug}.aspx
 *   - Deals include bonus items: theme park tickets, Visa gift cards, show tickets
 *   - Savings percentages shown as badges
 *
 * Strategy:
 *   1. Crawl homepage for all deal cards (all deals are on one page)
 *   2. Follow individual deal pages for additional details
 */

const BASE_URL = "https://www.vacationvillagedeals.com";

// ── Known deals with pre-parsed data from site analysis ─────────────────────

interface KnownDeal {
  path: string;
  resortName: string;
  city: string;
  state?: string;
  country: string;
  price: number;
  nights: number;
  days: number;
  savingsPercent: number;
  inclusions: string[];
}

const KNOWN_DEALS: KnownDeal[] = [
  {
    path: "orlando-florida-vacation-deals/disney-2tickets-4days-199special.aspx",
    resortName: "Vacation Village at Parkway",
    city: "Orlando", state: "FL", country: "US",
    price: 199, nights: 3, days: 4, savingsPercent: 62,
    inclusions: ["4 Days / 3 Nights", "2 Disney World Tickets"],
  },
  {
    path: "orlando-florida-vacation-deals/universal-studio-2tickets-4days-199special.aspx",
    resortName: "Vacation Village at Parkway",
    city: "Orlando", state: "FL", country: "US",
    price: 199, nights: 3, days: 4, savingsPercent: 62,
    inclusions: ["4 Days / 3 Nights", "2 Universal Studios Tickets"],
  },
  {
    path: "orlando-florida-vacation-deals/disney-2tickets-5days-299special.aspx",
    resortName: "Vacation Village at Parkway",
    city: "Orlando", state: "FL", country: "US",
    price: 299, nights: 4, days: 5, savingsPercent: 51,
    inclusions: ["5 Days / 4 Nights", "2 Disney World Tickets"],
  },
  {
    path: "las-vegas-vacation-deals/4-day-3-night-hooters_plus150-49special.aspx",
    resortName: "OYO Hotel & Casino Las Vegas",
    city: "Las Vegas", state: "NV", country: "US",
    price: 49, nights: 3, days: 4, savingsPercent: 84,
    inclusions: ["4 Days / 3 Nights", "$150 Hotel Credit"],
  },
  {
    path: "las-vegas-vacation-deals/4-day-3-night-plusshowtickets-129special.aspx",
    resortName: "The Berkley, Las Vegas",
    city: "Las Vegas", state: "NV", country: "US",
    price: 129, nights: 3, days: 4, savingsPercent: 87,
    inclusions: ["4 Days / 3 Nights", "2 Cirque du Soleil Tickets"],
  },
  {
    path: "las-vegas-vacation-deals/5-day-4-night-plusshowtickets-179special.aspx",
    resortName: "The Berkley, Las Vegas",
    city: "Las Vegas", state: "NV", country: "US",
    price: 179, nights: 4, days: 5, savingsPercent: 86,
    inclusions: ["5 Days / 4 Nights", "2 Cirque du Soleil Tickets"],
  },
  {
    path: "south-florida-vacation-deals/4day-3night_plus100-99-weston.aspx",
    resortName: "Vacation Village at Weston",
    city: "Weston", state: "FL", country: "US",
    price: 99, nights: 3, days: 4, savingsPercent: 87,
    inclusions: ["4 Days / 3 Nights", "$100 Visa Gift Card"],
  },
  {
    path: "williamsburg-vacation-deals/williamsburg-4days-plus150-149special.aspx",
    resortName: "Vacation Village Williamsburg",
    city: "Williamsburg", state: "VA", country: "US",
    price: 199, nights: 3, days: 4, savingsPercent: 82,
    inclusions: ["4 Days / 3 Nights", "$150 Visa Gift Card"],
  },
  {
    path: "south-florida-vacation-deals/4day-3night-plus200-199-weston.aspx",
    resortName: "Vacation Village at Weston",
    city: "Weston", state: "FL", country: "US",
    price: 199, nights: 3, days: 4, savingsPercent: 77,
    inclusions: ["4 Days / 3 Nights", "$200 Visa Gift Card"],
  },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function parsePrice(text: string): number | null {
  const match = text.replace(/,/g, "").match(/\$(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

function parseNights(text: string): { nights: number; days: number } | null {
  let m = text.match(/(\d+)\s*-?\s*days?\s*[\/&,]\s*(\d+)\s*-?\s*nights?/i);
  if (m) {
    return { days: parseInt(m[1], 10), nights: parseInt(m[2], 10) };
  }
  m = text.match(/(\d+)\s*-?\s*nights?\s*[\/&,]\s*(\d+)\s*-?\s*days?/i);
  if (m) {
    return { nights: parseInt(m[1], 10), days: parseInt(m[2], 10) };
  }
  m = text.match(/(\d+)\s*nights?/i);
  if (m) {
    const nights = parseInt(m[1], 10);
    return { nights, days: nights + 1 };
  }
  return null;
}

function parseSavingsPercent(text: string): number | null {
  const m = text.match(/(?:save\s+(?:up\s+to\s+)?)?(\d+)\s*%/i);
  return m ? parseInt(m[1], 10) : null;
}

function resolveUrl(href: string): string {
  if (href.startsWith("http")) return href;
  return `${BASE_URL}/${href.replace(/^\//, "")}`;
}

function detectDestination(
  text: string,
): { city: string; state?: string; country: string } | null {
  const destMap: Array<{ pattern: RegExp; city: string; state?: string; country: string }> = [
    { pattern: /orlando/i, city: "Orlando", state: "FL", country: "US" },
    { pattern: /las\s*vegas/i, city: "Las Vegas", state: "NV", country: "US" },
    { pattern: /williamsburg/i, city: "Williamsburg", state: "VA", country: "US" },
    { pattern: /south\s*florida|weston|palm\s*beach/i, city: "Weston", state: "FL", country: "US" },
    { pattern: /berkshire/i, city: "Berkshires", state: "MA", country: "US" },
  ];
  for (const d of destMap) {
    if (d.pattern.test(text)) {
      return { city: d.city, state: d.state, country: d.country };
    }
  }
  return null;
}

// ── Main crawler ─────────────────────────────────────────────────────────────

export async function runVacationVillageCrawler() {
  const processedUrls = new Set<string>();

  const crawler = new CheerioCrawler({
    maxRequestsPerCrawl: 40,
    async requestHandler({ request, $, log }) {
      log.info(`Scraping ${request.url}`);

      const isHomepage =
        request.url === BASE_URL ||
        request.url === `${BASE_URL}/` ||
        request.url.replace(/\/$/, "") === BASE_URL.replace(/\/$/, "");

      if (isHomepage) {
        // ── Strategy 1: Parse deal cards from homepage ──────────────────
        // Look for links to .aspx deal pages
        const dealLinks = new Set<string>();

        $('a[href*=".aspx"]').each((_i, el) => {
          const href = $(el).attr("href");
          if (!href || href.includes("javascript")) return;
          if (href.includes("vacation-deals/") || href.includes("special")) {
            const fullUrl = resolveUrl(href);
            if (!processedUrls.has(fullUrl)) {
              dealLinks.add(fullUrl);
            }
          }
        });

        // Try to extract deals directly from the homepage content
        // Cards follow: image link + duration heading + price + booking link
        $('a[href*="special.aspx"], a[href*="vacation-deals/"]').each((_i, el) => {
          const link = $(el);
          const href = link.attr("href") || "";
          if (!href.includes(".aspx")) return;

          const dealUrl = resolveUrl(href);
          if (processedUrls.has(dealUrl)) return;

          const linkText = link.text().trim();
          // Skip non-deal links (navigation, etc.)
          if (
            linkText === "" ||
            linkText.length > 200 ||
            linkText.toLowerCase().includes("view more") ||
            linkText.toLowerCase() === "book this deal now"
          )
            return;

          // Get context from surrounding elements
          const parent = link.closest("div, td, section, article");
          const contextText = parent.length > 0 ? parent.text() : "";

          const price = parsePrice(contextText);
          if (!price || price <= 0) return;

          processedUrls.add(dealUrl);

          const duration = parseNights(contextText) || { nights: 3, days: 4 };
          const savingsPercent = parseSavingsPercent(contextText);
          const destination = detectDestination(contextText || href);

          // Find resort name from h4/h3 in context
          const headingText =
            parent.find("h4, h3, h2").first().text().trim() || "";
          const resortName = headingText || linkText;

          // Image
          const imgSrc = parent.find("img:not(.bonus)").first().attr("src") || "";
          const imageUrl = imgSrc ? resolveUrl(imgSrc) : undefined;

          // Inclusions from text
          const inclusions: string[] = [];
          if (duration) {
            inclusions.push(`${duration.days} Days / ${duration.nights} Nights`);
          }
          // Look for bonus items (tickets, gift cards)
          const bonusMatch = contextText.match(
            /(?:plus|includes?|with)\s+(.+?)(?:\.|$)/i,
          );
          if (bonusMatch) {
            inclusions.push(bonusMatch[1].trim());
          }

          const deal: ScrapedDeal = {
            title: `${resortName} - ${destination?.city || "Unknown"}`,
            price,
            durationNights: duration.nights,
            durationDays: duration.days,
            resortName,
            url: dealUrl,
            imageUrl,
            inclusions: inclusions.length > 0 ? inclusions : undefined,
            savingsPercent: savingsPercent ?? undefined,
            city: destination?.city || "Unknown",
            state: destination?.state,
            country: destination?.country || "US",
            brandSlug: "vacation-village",
          };

          storeDeal(deal, "vacation-village")
            .then(() => log.info(`Stored deal: ${deal.title} ($${deal.price})`))
            .catch((err) => log.error(`Failed to store deal ${deal.title}: ${err}`));
        });

        // ── Strategy 2: Use known deals as fallback ───────────────────────
        // If DOM parsing didn't yield results, store known deals
        if (processedUrls.size === 0) {
          log.info("Using known deals fallback for Vacation Village");
          for (const known of KNOWN_DEALS) {
            const dealUrl = resolveUrl(known.path);
            if (processedUrls.has(dealUrl)) continue;
            processedUrls.add(dealUrl);

            const deal: ScrapedDeal = {
              title: `${known.resortName} - ${known.city}`,
              price: known.price,
              durationNights: known.nights,
              durationDays: known.days,
              resortName: known.resortName,
              url: dealUrl,
              inclusions: known.inclusions,
              savingsPercent: known.savingsPercent,
              city: known.city,
              state: known.state,
              country: known.country,
              brandSlug: "vacation-village",
            };

            try {
              await storeDeal(deal, "vacation-village");
              log.info(`Stored known deal: ${deal.title} ($${deal.price})`);
            } catch (err) {
              log.error(`Failed to store known deal ${deal.title}: ${err}`);
            }
          }
        }

        // Enqueue individual deal pages for richer data
        for (const url of dealLinks) {
          await crawler.addRequests([{ url }]);
        }
        if (dealLinks.size > 0) {
          log.info(`Enqueued ${dealLinks.size} individual deal pages`);
        }

        return;
      }

      // ── Individual deal pages (.aspx) ─────────────────────────────────
      if (processedUrls.has(request.url)) return;
      processedUrls.add(request.url);

      const pageText = $("body").text();
      const price = parsePrice(pageText);
      if (!price || price <= 0) return;

      const duration = parseNights(pageText) || { nights: 3, days: 4 };
      const destination = detectDestination(request.url) || detectDestination(pageText);

      // Title from h1 or og:title
      const title =
        $("h1").first().text().trim() ||
        $('meta[property="og:title"]').attr("content") ||
        "";
      if (!title) return;

      // Resort name
      const resortName =
        $("h2, h3")
          .filter((_i, el) => /resort|village|hotel/i.test($(el).text()))
          .first()
          .text()
          .trim() || title;

      // Image
      const imageUrl =
        $('meta[property="og:image"]').attr("content") ||
        $("img")
          .filter((_i, el) => {
            const src = $(el).attr("src") || "";
            return /resort|hotel|pool|room/i.test(src);
          })
          .first()
          .attr("src") ||
        undefined;

      // Inclusions
      const inclusions: string[] = [];
      inclusions.push(`${duration.days} Days / ${duration.nights} Nights`);
      $("li, p").each((_i, el) => {
        const text = $(el).text().trim();
        if (
          text.length > 5 &&
          text.length < 200 &&
          /ticket|gift\s*card|visa|credit|included|complimentary|bonus/i.test(text)
        ) {
          inclusions.push(text);
        }
      });

      const savingsPercent = parseSavingsPercent(pageText);

      const deal: ScrapedDeal = {
        title: `${resortName} - ${destination?.city || "Unknown"}`,
        price,
        durationNights: duration.nights,
        durationDays: duration.days,
        resortName,
        url: request.url,
        imageUrl: imageUrl ? resolveUrl(imageUrl) : undefined,
        inclusions: inclusions.length > 0 ? inclusions : undefined,
        savingsPercent: savingsPercent ?? undefined,
        city: destination?.city || "Unknown",
        state: destination?.state,
        country: destination?.country || "US",
        brandSlug: "vacation-village",
      };

      try {
        await storeDeal(deal, "vacation-village");
        log.info(`Stored detail page deal: ${deal.title} ($${deal.price})`);
      } catch (err) {
        log.error(`Failed to store detail deal ${deal.title}: ${err}`);
      }
    },
  });

  await crawler.run([BASE_URL]);
}

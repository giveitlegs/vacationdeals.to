import { CheerioCrawler } from "crawlee";
import { storeDeal } from "../storage/deal-store";
import type { ScrapedDeal } from "@vacationdeals/shared";

/**
 * VacationVIP crawler (vacationvip.com).
 *
 * VacationVIP is a broker site selling timeshare preview vacation packages.
 * The homepage features a #popularGrid section with deal cards as <a> elements.
 *
 * Deal card structure (inside #popularGrid > a):
 *   - <img> with resort/destination photo (.webp)
 *   - Discount text: "80% OFF"
 *   - Duration: "4-Days/3-Nights"
 *   - Resort/property name
 *   - Original price (struck through) + discounted price + "Per Family/Couple/Package"
 *
 * Some deal links point to govip.vacations (external), some to
 * vacationvip.com/getaways/{slug}.
 *
 * Strategy:
 *   1. Crawl homepage to extract all deal cards from #popularGrid
 *   2. Also crawl /getaways/ page for additional deals
 */

const BASE_URL = "https://www.vacationvip.com";

// ── Known destinations for mapping ──────────────────────────────────────────

const DESTINATION_MAP: Record<string, { city: string; state?: string; country: string }> = {
  orlando: { city: "Orlando", state: "FL", country: "US" },
  "las vegas": { city: "Las Vegas", state: "NV", country: "US" },
  vegas: { city: "Las Vegas", state: "NV", country: "US" },
  gatlinburg: { city: "Gatlinburg", state: "TN", country: "US" },
  "pigeon forge": { city: "Pigeon Forge", state: "TN", country: "US" },
  pigeonforge: { city: "Pigeon Forge", state: "TN", country: "US" },
  branson: { city: "Branson", state: "MO", country: "US" },
  "myrtle beach": { city: "Myrtle Beach", state: "SC", country: "US" },
  myrtlebeach: { city: "Myrtle Beach", state: "SC", country: "US" },
  williamsburg: { city: "Williamsburg", state: "VA", country: "US" },
  cancun: { city: "Cancun", country: "Mexico" },
  "cabo san lucas": { city: "Cabo San Lucas", country: "Mexico" },
  cabo: { city: "Cabo San Lucas", country: "Mexico" },
  "punta cana": { city: "Punta Cana", country: "Dominican Republic" },
  miami: { city: "Miami", state: "FL", country: "US" },
  "daytona beach": { city: "Daytona Beach", state: "FL", country: "US" },
  daytona: { city: "Daytona Beach", state: "FL", country: "US" },
  "new orleans": { city: "New Orleans", state: "LA", country: "US" },
  sedona: { city: "Sedona", state: "AZ", country: "US" },
  "lake tahoe": { city: "Lake Tahoe", state: "CA", country: "US" },
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function parsePrice(text: string): number | null {
  const match = text.replace(/,/g, "").match(/\$(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

function parseNights(text: string): { nights: number; days: number } | null {
  // "4-Days/3-Nights" or "4 Days / 3 Nights"
  let m = text.match(/(\d+)\s*-?\s*Days?\s*[\/&]\s*(\d+)\s*-?\s*Nights?/i);
  if (m) {
    return { days: parseInt(m[1], 10), nights: parseInt(m[2], 10) };
  }
  // "3-Nights/4-Days"
  m = text.match(/(\d+)\s*-?\s*Nights?\s*[\/&]\s*(\d+)\s*-?\s*Days?/i);
  if (m) {
    return { nights: parseInt(m[1], 10), days: parseInt(m[2], 10) };
  }
  // "3 Nights"
  m = text.match(/(\d+)\s*-?\s*Nights?/i);
  if (m) {
    const nights = parseInt(m[1], 10);
    return { nights, days: nights + 1 };
  }
  return null;
}

function parseSavingsPercent(text: string): number | null {
  const m = text.match(/(\d+)\s*%\s*OFF/i);
  return m ? parseInt(m[1], 10) : null;
}

function resolveUrl(href: string): string {
  if (href.startsWith("http")) return href;
  return `${BASE_URL}${href.startsWith("/") ? "" : "/"}${href}`;
}

function detectDestination(
  text: string,
): { city: string; state?: string; country: string } | null {
  const lower = text.toLowerCase();
  // Try matching "City, ST" pattern first
  const cityStateMatch = text.match(/([A-Za-z\s]+),\s*([A-Z]{2})\b/);
  if (cityStateMatch) {
    const city = cityStateMatch[1].trim();
    const state = cityStateMatch[2];
    return { city, state, country: "US" };
  }

  // Fallback to keyword matching
  for (const [key, dest] of Object.entries(DESTINATION_MAP)) {
    if (lower.includes(key)) {
      return dest;
    }
  }
  return null;
}

// ── Main crawler ─────────────────────────────────────────────────────────────

export async function runVacationvipCrawler() {
  const processedUrls = new Set<string>();

  const crawler = new CheerioCrawler({
    maxRequestsPerCrawl: 50,
    async requestHandler({ request, $, log }) {
      log.info(`Scraping ${request.url}`);

      // ── Strategy 1: Parse deal cards from #popularGrid ──────────────────
      const dealCards = $("#popularGrid > a, #popularGrid a, .deal-card a, .package-card");

      if (dealCards.length > 0) {
        log.info(`Found ${dealCards.length} deal cards on ${request.url}`);

        dealCards.each((_i, el) => {
          const card = $(el);
          try {
            const cardText = card.text();
            const href = card.attr("href") || card.find("a").first().attr("href") || "";
            const dealUrl = href ? resolveUrl(href) : "";

            if (!dealUrl || processedUrls.has(dealUrl)) return;

            // Price - look for the discounted price (lower number)
            const allPrices: number[] = [];
            const priceMatches = cardText.replace(/,/g, "").matchAll(/\$(\d+)/g);
            for (const pm of priceMatches) {
              allPrices.push(parseInt(pm[1], 10));
            }

            if (allPrices.length === 0) return;

            // The smaller price is the deal price, larger is the original
            const price = Math.min(...allPrices);
            const originalPrice = allPrices.length > 1 ? Math.max(...allPrices) : undefined;

            if (price <= 0) return;

            processedUrls.add(dealUrl);

            // Duration
            const duration = parseNights(cardText) || { nights: 3, days: 4 };

            // Savings percent
            const savingsPercent = parseSavingsPercent(cardText);

            // Resort name - look for text that isn't price/duration/discount
            // The resort name is typically a longer text element in the card
            let resortName = "";
            card.find("h2, h3, h4, h5, strong, b, .resort-name, .property-name").each((_i, el) => {
              const text = $(el).text().trim();
              if (text && text.length > 5 && !/\$/.test(text) && !/OFF/i.test(text) && !/Days?/i.test(text)) {
                if (!resortName || text.length > resortName.length) {
                  resortName = text;
                }
              }
            });

            // If no heading found, try to extract from card text
            if (!resortName) {
              const lines = cardText.split(/\n/).map((l) => l.trim()).filter(Boolean);
              for (const line of lines) {
                if (
                  line.length > 8 &&
                  !/\$/.test(line) &&
                  !/OFF/i.test(line) &&
                  !/Days?\s*[\/&]/i.test(line) &&
                  !/Per\s/i.test(line)
                ) {
                  resortName = line;
                  break;
                }
              }
            }

            if (!resortName) resortName = "Vacation Package";

            // Destination detection from card text, URL, or resort name
            const destination =
              detectDestination(cardText) ||
              detectDestination(href) ||
              detectDestination(resortName) ||
              { city: "Unknown", country: "US" };

            // Image
            const imgEl = card.find("img").first();
            const imgSrc = imgEl.attr("src") || imgEl.attr("data-src") || imgEl.attr("data-lazy-src") || "";
            const imageUrl = imgSrc ? resolveUrl(imgSrc) : undefined;

            // Inclusions from card text
            const inclusions: string[] = [];
            const durationStr = `${duration.days} Days / ${duration.nights} Nights`;
            inclusions.push(durationStr);

            // Look for bonus items like "gift card", "show tickets", "casino chips"
            if (/gift\s*card/i.test(cardText)) {
              const gcMatch = cardText.match(/\$\d+\s*gift\s*card/i);
              if (gcMatch) inclusions.push(gcMatch[0]);
            }
            if (/show\s*tickets?/i.test(cardText)) inclusions.push("Show Tickets Included");
            if (/casino\s*chips?/i.test(cardText)) inclusions.push("Casino Chips Included");
            if (/breakfast/i.test(cardText)) inclusions.push("Breakfast Included");

            const deal: ScrapedDeal = {
              title: `${resortName} - ${destination.city}`,
              price,
              originalPrice,
              durationNights: duration.nights,
              durationDays: duration.days,
              description: `Vacation preview package at ${resortName} in ${destination.city}`,
              resortName,
              url: dealUrl,
              imageUrl,
              inclusions: inclusions.length > 0 ? inclusions : undefined,
              savingsPercent: savingsPercent ?? undefined,
              city: destination.city,
              state: destination.state,
              country: destination.country,
              brandSlug: "vacationvip",
            };

            storeDeal(deal, "vacationvip")
              .then(() => log.info(`Stored deal: ${deal.title} ($${deal.price})`))
              .catch((err) => log.error(`Failed to store deal ${deal.title}: ${err}`));
          } catch (err) {
            log.error(`Error parsing deal card: ${err}`);
          }
        });
      }

      // ── Strategy 2: Parse any loose deal links on the page ──────────────
      $('a[href*="/getaways/"], a[href*="govip.vacations"]').each((_i, el) => {
        const link = $(el);
        const href = link.attr("href") || "";
        const dealUrl = resolveUrl(href);
        if (processedUrls.has(dealUrl)) return;

        const parent = link.parent();
        const contextText = parent.text() || link.text();
        const price = parsePrice(contextText);
        if (!price || price <= 0) return;

        processedUrls.add(dealUrl);

        const duration = parseNights(contextText) || { nights: 3, days: 4 };
        const savingsPercent = parseSavingsPercent(contextText);
        const destination = detectDestination(contextText) || detectDestination(href) || { city: "Unknown", country: "US" };

        const resortName = link.find("h2, h3, h4, h5").first().text().trim() || "Vacation Package";

        const imgSrc = parent.find("img").first().attr("src") || "";
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
          brandSlug: "vacationvip",
        };

        storeDeal(deal, "vacationvip")
          .then(() => log.info(`Stored link deal: ${deal.title} ($${deal.price})`))
          .catch((err) => log.error(`Failed to store link deal: ${err}`));
      });

      // ── Enqueue getaways page from homepage ────────────────────────────
      if (request.url === BASE_URL || request.url === `${BASE_URL}/`) {
        await crawler.addRequests([{ url: `${BASE_URL}/getaways/` }]);
        log.info("Enqueued /getaways/ page");
      }
    },
  });

  await crawler.run([BASE_URL]);
}

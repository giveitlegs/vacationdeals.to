import { PlaywrightCrawler } from "crawlee";
import { storeDeal } from "../storage/deal-store";
import type { ScrapedDeal } from "@vacationdeals/shared";

/**
 * PayVibe Travel crawler (travel.payvibe.com).
 *
 * PayVibe is a promotional vacation package site — React SPA backed by a
 * POST API with a dynamic secret key. Rather than fight the API auth layer,
 * we render the page in Playwright and scrape the DOM after hydration.
 *
 * Listing URL: https://travel.payvibe.com/
 * Detail URL:  https://travel.payvibe.com/deals-detail/{id}-global-solutions/{hash?}
 */

const BASE_URL = "https://travel.payvibe.com";
const LISTING_URL = `${BASE_URL}/`;

function parsePrice(text: string): number | null {
  const match = text.match(/\$\s*([\d,]+(?:\.\d{2})?)/);
  if (!match) return null;
  const n = parseFloat(match[1].replace(/,/g, ""));
  return Number.isFinite(n) && n > 0 ? n : null;
}

function parseNights(text: string): { nights: number; days: number } | null {
  const nightsMatch = text.match(/(\d+)\s*nights?/i);
  const daysMatch = text.match(/(\d+)\s*days?/i);
  if (!nightsMatch && !daysMatch) return null;
  const nights = nightsMatch ? parseInt(nightsMatch[1], 10) : (daysMatch ? parseInt(daysMatch[1], 10) - 1 : 0);
  const days = daysMatch ? parseInt(daysMatch[1], 10) : nights + 1;
  if (nights < 1 || nights > 14) return null;
  return { nights, days };
}

const CITY_LOOKUP: Record<string, { state?: string; country: string }> = {
  "orlando": { state: "FL", country: "US" },
  "las vegas": { state: "NV", country: "US" },
  "gatlinburg": { state: "TN", country: "US" },
  "myrtle beach": { state: "SC", country: "US" },
  "branson": { state: "MO", country: "US" },
  "daytona beach": { state: "FL", country: "US" },
  "williamsburg": { state: "VA", country: "US" },
  "cocoa beach": { state: "FL", country: "US" },
  "hilton head": { state: "SC", country: "US" },
  "miami": { state: "FL", country: "US" },
  "nashville": { state: "TN", country: "US" },
  "fort lauderdale": { state: "FL", country: "US" },
  "virginia beach": { state: "VA", country: "US" },
  "san diego": { state: "CA", country: "US" },
  "san antonio": { state: "TX", country: "US" },
  "galveston": { state: "TX", country: "US" },
  "key west": { state: "FL", country: "US" },
  "cancun": { country: "MX" },
  "cabo san lucas": { country: "MX" },
  "puerto vallarta": { country: "MX" },
  "cozumel": { country: "MX" },
  "punta cana": { country: "DR" },
};

function resolveLocation(city: string): { city: string; state?: string; country: string } {
  const key = city.toLowerCase().trim();
  const meta = CITY_LOOKUP[key] ?? { country: "US" };
  const titleCase = city
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
  return { city: titleCase, ...meta };
}

interface CardInfo {
  href: string;
  text: string;
  imageUrl: string;
}

export async function runPayvibeCrawler(): Promise<void> {
  const seen = new Set<string>();

  const crawler = new PlaywrightCrawler({
    maxRequestsPerCrawl: 50,
    maxConcurrency: 1,
    requestHandlerTimeoutSecs: 60,
    navigationTimeoutSecs: 45,
    headless: true,
    launchContext: {
      launchOptions: {
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      },
    },

    async requestHandler({ page, request, log }) {
      log.info(`PayVibe: ${request.url}`);

      await page.waitForLoadState("networkidle", { timeout: 30000 }).catch(() => {});
      await page.waitForSelector('a[href*="/deals-detail/"]', { timeout: 20000 }).catch(() => {});

      const cards: CardInfo[] = await page.evaluate(() => {
        const links = Array.from(document.querySelectorAll('a[href*="/deals-detail/"]'));
        return links.map((a) => {
          const anchor = a as HTMLAnchorElement;
          const href = anchor.getAttribute("href") || "";
          const card = (anchor.closest("article") || anchor.closest("div[class*=card]") || anchor.closest("div")) as HTMLElement | null;
          const text = card?.innerText || anchor.innerText || "";
          const img = card?.querySelector("img");
          const imageUrl = img?.getAttribute("src") || img?.getAttribute("data-src") || "";
          return { href, text, imageUrl };
        });
      });

      log.info(`PayVibe: ${cards.length} card links found`);

      for (const card of cards) {
        const fullUrl = card.href.startsWith("http") ? card.href : `${BASE_URL}${card.href}`;
        if (seen.has(fullUrl)) continue;

        const price = parsePrice(card.text);
        const duration = parseNights(card.text);

        // Site uses uppercase titles: "FORT LAUDERDALE VACATION FOR 4" → "Fort Lauderdale"
        const titleMatch = card.text.match(/^([A-Z][A-Z\s,]+?)(?:\s+VACATION|\s+GETAWAY|\s+RESORT|\n|$)/m);
        const rawCity = titleMatch?.[1]?.trim().replace(/,.*$/, "") || null;
        if (!rawCity || !price) {
          log.debug(`PayVibe: skipping card (city=${rawCity}, price=${price})`);
          continue;
        }

        seen.add(fullUrl);
        const loc = resolveLocation(rawCity);

        const deal: ScrapedDeal = {
          title: `${loc.city} Vacation Package`,
          price,
          durationNights: duration?.nights ?? 3,
          durationDays: duration?.days ?? 4,
          description: `Promotional vacation package in ${loc.city} via PayVibe.`,
          url: fullUrl,
          imageUrl: card.imageUrl.startsWith("http") ? card.imageUrl : undefined,
          city: loc.city,
          state: loc.state,
          country: loc.country,
          brandSlug: "payvibe",
        };

        await storeDeal(deal, "payvibe");
        log.info(`PayVibe: stored ${deal.title} ($${deal.price}, ${deal.durationNights}n)`);
      }
    },

    failedRequestHandler({ request, log }) {
      log.warning(`PayVibe request failed: ${request.url}`);
    },
  });

  await crawler.run([{ url: LISTING_URL }]);
}

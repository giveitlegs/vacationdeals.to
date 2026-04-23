import { PlaywrightCrawler } from "crawlee";
import { storeDeal } from "../storage/deal-store";
import type { ScrapedDeal } from "@vacationdeals/shared";

/**
 * PayVibe Travel crawler (travel.payvibe.com).
 *
 * PayVibe is a React SPA backed by a POST API with a dynamic secret key.
 * We render the page in Playwright and scrape `.deal-container` cards
 * after hydration — avoids the API auth layer entirely.
 *
 * Card text format (empirical, from inspection):
 *   CITY NAME, STATE/COUNTRY VACATION/HOTEL/GETAWAY\n
 *   DURATION CITY NAME ...\n
 *   -DISCOUNT%\n
 *   $ORIGINAL\n
 *   $DISCOUNTED\n
 *   DESCRIPTION\n
 *   View
 */

const BASE_URL = "https://travel.payvibe.com";
const LISTING_URL = `${BASE_URL}/`;

const CITY_LOOKUP: Record<string, { canonical: string; state?: string; country: string }> = {
  "orlando": { canonical: "Orlando", state: "FL", country: "US" },
  "las vegas": { canonical: "Las Vegas", state: "NV", country: "US" },
  "gatlinburg": { canonical: "Gatlinburg", state: "TN", country: "US" },
  "myrtle beach": { canonical: "Myrtle Beach", state: "SC", country: "US" },
  "branson": { canonical: "Branson", state: "MO", country: "US" },
  "daytona beach": { canonical: "Daytona Beach", state: "FL", country: "US" },
  "williamsburg": { canonical: "Williamsburg", state: "VA", country: "US" },
  "cocoa beach": { canonical: "Cocoa Beach", state: "FL", country: "US" },
  "hilton head": { canonical: "Hilton Head", state: "SC", country: "US" },
  "hilton head island": { canonical: "Hilton Head", state: "SC", country: "US" },
  "miami": { canonical: "Miami", state: "FL", country: "US" },
  "nashville": { canonical: "Nashville", state: "TN", country: "US" },
  "fort lauderdale": { canonical: "Fort Lauderdale", state: "FL", country: "US" },
  "virginia beach": { canonical: "Virginia Beach", state: "VA", country: "US" },
  "san diego": { canonical: "San Diego", state: "CA", country: "US" },
  "san antonio": { canonical: "San Antonio", state: "TX", country: "US" },
  "galveston": { canonical: "Galveston", state: "TX", country: "US" },
  "key west": { canonical: "Key West", state: "FL", country: "US" },
  "new orleans": { canonical: "New Orleans", state: "LA", country: "US" },
  "panama city beach": { canonical: "Panama City Beach", state: "FL", country: "US" },
  "pigeon forge": { canonical: "Pigeon Forge", state: "TN", country: "US" },
  "cancun": { canonical: "Cancun", country: "MX" },
  "cabo san lucas": { canonical: "Cabo San Lucas", country: "MX" },
  "cabo": { canonical: "Cabo San Lucas", country: "MX" },
  "puerto vallarta": { canonical: "Puerto Vallarta", country: "MX" },
  "cozumel": { canonical: "Cozumel", country: "MX" },
  "punta cana": { canonical: "Punta Cana", country: "DR" },
};

function detectCity(text: string): { city: string; state?: string; country: string } | null {
  const hay = text.toLowerCase();
  // Longest-match wins (so "hilton head island" beats "hilton head")
  const sortedKeys = Object.keys(CITY_LOOKUP).sort((a, b) => b.length - a.length);
  for (const key of sortedKeys) {
    if (hay.includes(key)) {
      const { canonical, state, country } = CITY_LOOKUP[key];
      return { city: canonical, state, country };
    }
  }
  return null;
}

function extractPrices(text: string): { original: number | null; discounted: number | null } {
  // Collect all $NNN or $NNN.NN values in order
  const matches = [...text.matchAll(/\$\s*([\d,]+(?:\.\d{2})?)/g)].map((m) =>
    parseFloat(m[1].replace(/,/g, "")),
  ).filter((n) => Number.isFinite(n) && n > 0);
  if (matches.length === 0) return { original: null, discounted: null };
  if (matches.length === 1) return { original: null, discounted: matches[0] };
  // PayVibe always shows the original first, discounted second
  return { original: matches[0], discounted: matches[1] };
}

function extractNights(text: string): { nights: number; days: number } {
  // "5 DAYS, 4 NIGHTS" | "2-3-OR 4-NIGHT" | "3 nights"
  const nightsMatch = text.match(/(\d+)\s*(?:night|nights|NIGHT|NIGHTS)/);
  const daysMatch = text.match(/(\d+)\s*(?:day|days|DAY|DAYS)/);
  const nights = nightsMatch ? parseInt(nightsMatch[1], 10) : 0;
  const days = daysMatch ? parseInt(daysMatch[1], 10) : nights + 1;
  if (nights >= 1 && nights <= 14) return { nights, days };
  // Fallback: 3n/4d
  return { nights: 3, days: 4 };
}

interface RawCard {
  text: string;
  href: string;
  imgSrc: string;
}

export async function runPayvibeCrawler(): Promise<void> {
  const seen = new Set<string>();

  const crawler = new PlaywrightCrawler({
    maxRequestsPerCrawl: 5,
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
      await page.waitForSelector(".deal-container", { timeout: 20000 }).catch(() => {});

      const cards: RawCard[] = await page.evaluate(() => {
        return Array.from(document.querySelectorAll(".deal-container")).map((el) => {
          const card = el as HTMLElement;
          const link = card.querySelector('a[href*="/deals-detail/"]') as HTMLAnchorElement | null;
          const img = card.querySelector("img") as HTMLImageElement | null;
          return {
            text: card.innerText || "",
            href: link?.href || "",
            imgSrc: img?.src || "",
          };
        });
      });

      log.info(`PayVibe: ${cards.length} deal cards found`);

      let stored = 0;
      for (const card of cards) {
        if (!card.href || seen.has(card.href)) continue;

        const loc = detectCity(card.text);
        if (!loc) {
          log.debug(`PayVibe: skipped (no known city) — ${card.text.split("\n")[0]}`);
          continue;
        }

        const { original, discounted } = extractPrices(card.text);
        if (!discounted) {
          log.debug(`PayVibe: skipped (no price) — ${loc.city}`);
          continue;
        }

        const { nights, days } = extractNights(card.text);
        const title = card.text.split("\n")[0].trim().slice(0, 200);

        seen.add(card.href);

        const deal: ScrapedDeal = {
          title: title || `${loc.city} Vacation Package`,
          price: discounted,
          originalPrice: original ?? undefined,
          durationNights: nights,
          durationDays: days,
          description: card.text.split("\n").slice(0, 5).join(" ").slice(0, 400),
          url: card.href,
          imageUrl: card.imgSrc.startsWith("http") ? card.imgSrc : undefined,
          city: loc.city,
          state: loc.state,
          country: loc.country,
          brandSlug: "payvibe",
        };

        await storeDeal(deal, "payvibe");
        stored++;
        log.info(`PayVibe: stored ${deal.title.slice(0, 50)} ($${deal.price}, ${deal.durationNights}n, ${deal.city})`);
      }

      log.info(`PayVibe: ${stored}/${cards.length} cards stored`);
    },

    failedRequestHandler({ request, log }) {
      log.warning(`PayVibe request failed: ${request.url}`);
    },
  });

  await crawler.run([{ url: LISTING_URL }]);
}

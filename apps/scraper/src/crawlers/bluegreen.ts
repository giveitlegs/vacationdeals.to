import { PlaywrightCrawler } from "crawlee";
import { storeDeal } from "../storage/deal-store";
import type { ScrapedDeal } from "@vacationdeals/shared";

/**
 * Bluegreen Vacations crawler.
 *
 * Bluegreen (now part of Hilton Grand Vacations) offers vacation packages at:
 *   - https://www.bluegreenvacations.com/deals/global — main deals page
 *
 * Known offers (verified March 2026):
 *   - 3-Night Getaway: $249 + $100 MasterCard Reward Card, 18 destinations
 *   - 7-Night Resort Explorer: $699 + $125 MasterCard Reward Card, 10 destinations, splittable
 *
 * The site is JS-rendered and requires Playwright for full content extraction.
 * Deals page is phone-booking only (866-933-7520), no individual deal URLs.
 *
 * We crawl the deals page for current pricing and create per-destination deals
 * for the major Bluegreen resort locations.
 */

const BASE_URL = "https://www.bluegreenvacations.com";
const DEALS_URL = `${BASE_URL}/deals/global`;

// Major Bluegreen resort destinations with resort names
const DESTINATIONS: Array<{
  city: string;
  state: string;
  country: string;
  resort: string;
  available3Night: boolean;
  available7Night: boolean;
}> = [
  { city: "Orlando", state: "FL", country: "US", resort: "The Fountains", available3Night: true, available7Night: true },
  { city: "Las Vegas", state: "NV", country: "US", resort: "Club 36", available3Night: true, available7Night: true },
  { city: "Myrtle Beach", state: "SC", country: "US", resort: "SeaGlass Tower", available3Night: true, available7Night: true },
  { city: "Nashville", state: "TN", country: "US", resort: "The Marquee", available3Night: true, available7Night: true },
  { city: "Savannah", state: "GA", country: "US", resort: "The Lodge at Legacy Park", available3Night: true, available7Night: true },
  { city: "Panama City Beach", state: "FL", country: "US", resort: "Landmark Holiday Beach Resort", available3Night: true, available7Night: false },
  { city: "Gatlinburg", state: "TN", country: "US", resort: "MountainLoft", available3Night: true, available7Night: true },
  { city: "Scottsdale", state: "AZ", country: "US", resort: "Cibola Vista Resort & Spa", available3Night: true, available7Night: true },
  { city: "Wisconsin Dells", state: "WI", country: "US", resort: "Christmas Mountain Village", available3Night: true, available7Night: false },
  { city: "Atlantic City", state: "NJ", country: "US", resort: "Bluegreen at Atlantic Palace", available3Night: true, available7Night: false },
  { city: "Big Bear Lake", state: "CA", country: "US", resort: "Big Bear Village", available3Night: true, available7Night: false },
  { city: "Branson", state: "MO", country: "US", resort: "Wilderness Club at Big Cedar", available3Night: true, available7Night: true },
];

// Default package definitions — updated by live scraping
let PACKAGES = {
  threeNight: {
    price: 249,
    nights: 3,
    days: 4,
    rewardCard: 100,
    destinationCount: 18,
    retailValuePerNight: "$175-$900",
  },
  sevenNight: {
    price: 699,
    nights: 7,
    days: 8,
    rewardCard: 125,
    destinationCount: 10,
    retailValuePerNight: "$175-$900",
    splittable: true,
  },
};

// ── Helpers ─────────────────────────────────────────────────────────────────

function parsePrice(text: string): number | null {
  const match = text.replace(/,/g, "").match(/\$\s*(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

function parseRewardCard(text: string): number | null {
  const m = text.replace(/,/g, "").match(/\$(\d+)\s*(?:master\s*card|reward\s*card|gift\s*card)/i);
  return m ? parseInt(m[1], 10) : null;
}

// ── Main crawler ────────────────────────────────────────────────────────────

export async function runBluegreenCrawler() {
  const processedKeys = new Set<string>();
  let liveDataExtracted = false;

  const crawler = new PlaywrightCrawler({
    maxRequestsPerCrawl: 10,
    navigationTimeoutSecs: 45,
    requestHandlerTimeoutSecs: 60,
    maxConcurrency: 1,
    maxRequestRetries: 2,
    headless: true,
    launchContext: {
      launchOptions: {
        args: ["--no-sandbox"],
      },
    },

    async requestHandler({ request, page, log }) {
      const url = request.url;
      log.info(`Navigating to ${url}`);

      await page.waitForLoadState("networkidle", { timeout: 30000 }).catch(() => {});
      await page.waitForTimeout(2000);

      const bodyText = await page.evaluate(() => document.body?.innerText || "");

      if (!bodyText || bodyText.length < 100) {
        log.warning(`Minimal content on ${url}`);
        return;
      }

      // ── Extract 3-Night package ──────────────────────────────────────
      const threeNightMatch = bodyText.match(
        /3[- ]night[^]*?\$\s*([\d,]+)\s*(?:\/\s*stay|per\s*stay)?/i
      );
      if (threeNightMatch) {
        const price = parseInt(threeNightMatch[1].replace(/,/g, ""), 10);
        if (price >= 99 && price <= 999) {
          PACKAGES.threeNight.price = price;
          liveDataExtracted = true;
          log.info(`Live 3-night price: $${price}`);
        }
      }

      // ── Extract 7-Night package ──────────────────────────────────────
      const sevenNightMatch = bodyText.match(
        /7[- ]night[^]*?\$\s*([\d,]+)\s*(?:\/\s*stay|per\s*stay)?/i
      );
      if (sevenNightMatch) {
        const price = parseInt(sevenNightMatch[1].replace(/,/g, ""), 10);
        if (price >= 199 && price <= 1999) {
          PACKAGES.sevenNight.price = price;
          liveDataExtracted = true;
          log.info(`Live 7-night price: $${price}`);
        }
      }

      // ── Extract reward card amounts ──────────────────────────────────
      // Look for "$100 MasterCard" near 3-night, "$125 MasterCard" near 7-night
      const allRewardMatches = bodyText.matchAll(
        /\$(\d+)\s*(?:master\s*card|reward\s*card)/gi
      );
      const rewardAmounts: number[] = [];
      for (const rm of allRewardMatches) {
        rewardAmounts.push(parseInt(rm[1], 10));
      }
      if (rewardAmounts.length >= 2) {
        PACKAGES.threeNight.rewardCard = Math.min(...rewardAmounts);
        PACKAGES.sevenNight.rewardCard = Math.max(...rewardAmounts);
        liveDataExtracted = true;
        log.info(`Live reward cards: $${PACKAGES.threeNight.rewardCard} / $${PACKAGES.sevenNight.rewardCard}`);
      } else if (rewardAmounts.length === 1) {
        PACKAGES.threeNight.rewardCard = rewardAmounts[0];
        liveDataExtracted = true;
      }

      // ── Extract discount percentage ──────────────────────────────────
      const discountMatch = bodyText.match(/(?:save|up\s+to)\s+(\d+)%\s*off/i);
      const savingsPercent = discountMatch ? parseInt(discountMatch[1], 10) : undefined;

      // ── Check for splittable mention ─────────────────────────────────
      if (bodyText.toLowerCase().includes("split")) {
        PACKAGES.sevenNight.splittable = true;
      }

      log.info(
        `Extracted packages: ` +
        `3-night=$${PACKAGES.threeNight.price} (+$${PACKAGES.threeNight.rewardCard} card), ` +
        `7-night=$${PACKAGES.sevenNight.price} (+$${PACKAGES.sevenNight.rewardCard} card)`
      );

      // ── Store deals per destination ──────────────────────────────────
      for (const dest of DESTINATIONS) {
        // 3-Night Getaway
        if (dest.available3Night) {
          const key3 = `3night-${dest.city}`;
          if (!processedKeys.has(key3)) {
            processedKeys.add(key3);

            const pkg = PACKAGES.threeNight;
            const deal: ScrapedDeal = {
              title: `Bluegreen ${dest.city} 3-Night Getaway`,
              price: pkg.price,
              durationNights: pkg.nights,
              durationDays: pkg.days,
              description: `${pkg.days} Days / ${pkg.nights} Nights at ${dest.resort} in ${dest.city}, ${dest.state}. Save up to ${savingsPercent || 81}% off retail value (${pkg.retailValuePerNight}/night). Includes $${pkg.rewardCard} MasterCard Reward Card.`,
              resortName: dest.resort,
              url: DEALS_URL,
              inclusions: [
                `${pkg.days} Days / ${pkg.nights} Nights accommodation`,
                `$${pkg.rewardCard} MasterCard Reward Card`,
                `Up to ${savingsPercent || 81}% off retail value`,
                "Resort amenities access",
                "Up to 12 months to travel",
              ],
              requirements: [
                "Attend 2-hour timeshare presentation",
                "Age 25-70",
                "Minimum household income requirement",
                "One offer per household",
                "Non-transferable",
              ],
              presentationMinutes: 120,
              savingsPercent: savingsPercent || 81,
              travelWindow: "Up to 12 months from purchase",
              city: dest.city,
              state: dest.state,
              country: dest.country,
              brandSlug: "bluegreen",
            };

            try {
              await storeDeal(deal, "bluegreen");
              log.info(`Stored: ${deal.title} ($${deal.price})`);
            } catch (err) {
              log.error(`Failed to store ${deal.title}: ${err}`);
            }
          }
        }

        // 7-Night Resort Explorer
        if (dest.available7Night) {
          const key7 = `7night-${dest.city}`;
          if (!processedKeys.has(key7)) {
            processedKeys.add(key7);

            const pkg = PACKAGES.sevenNight;
            const deal: ScrapedDeal = {
              title: `Bluegreen ${dest.city} 7-Night Resort Explorer`,
              price: pkg.price,
              durationNights: pkg.nights,
              durationDays: pkg.days,
              description: `${pkg.days} Days / ${pkg.nights} Nights at ${dest.resort} in ${dest.city}, ${dest.state}. Save up to ${savingsPercent || 77}% off retail value. Includes $${pkg.rewardCard} MasterCard Reward Card.${pkg.splittable ? " Split your 7 nights across up to 3 separate getaways!" : ""}`,
              resortName: dest.resort,
              url: DEALS_URL,
              inclusions: [
                `${pkg.days} Days / ${pkg.nights} Nights accommodation`,
                `$${pkg.rewardCard} MasterCard Reward Card`,
                `Up to ${savingsPercent || 77}% off retail value`,
                ...(pkg.splittable ? ["Split across up to 3 separate getaways"] : []),
                "Resort amenities access",
                "Up to 12 months to travel",
              ],
              requirements: [
                "Attend 2-hour timeshare presentation",
                "Age 25-70",
                "Minimum household income requirement",
                "One offer per household",
                "Non-transferable",
              ],
              presentationMinutes: 120,
              savingsPercent: savingsPercent || 77,
              travelWindow: "Up to 12 months from purchase",
              city: dest.city,
              state: dest.state,
              country: dest.country,
              brandSlug: "bluegreen",
            };

            try {
              await storeDeal(deal, "bluegreen");
              log.info(`Stored: ${deal.title} ($${deal.price})`);
            } catch (err) {
              log.error(`Failed to store ${deal.title}: ${err}`);
            }
          }
        }
      }
    },

    async failedRequestHandler({ request, log }) {
      log.warning(`Request failed: ${request.url}`);
    },
  });

  // Crawl the deals page
  await crawler.run([
    { url: DEALS_URL },
    { url: `${BASE_URL}/deals` },
  ]);

  // If live extraction failed, still seed from known data
  if (!liveDataExtracted && processedKeys.size === 0) {
    console.log("[bluegreen] Live scraping yielded no data. Seeding from known catalog.");

    for (const dest of DESTINATIONS) {
      // 3-Night
      if (dest.available3Night) {
        const pkg = PACKAGES.threeNight;
        const deal: ScrapedDeal = {
          title: `Bluegreen ${dest.city} 3-Night Getaway`,
          price: pkg.price,
          durationNights: pkg.nights,
          durationDays: pkg.days,
          description: `${pkg.days} Days / ${pkg.nights} Nights at ${dest.resort} in ${dest.city}, ${dest.state}. Includes $${pkg.rewardCard} MasterCard Reward Card.`,
          resortName: dest.resort,
          url: DEALS_URL,
          inclusions: [
            `${pkg.days} Days / ${pkg.nights} Nights accommodation`,
            `$${pkg.rewardCard} MasterCard Reward Card`,
            "Up to 81% off retail value",
            "Resort amenities access",
            "Up to 12 months to travel",
          ],
          requirements: [
            "Attend 2-hour timeshare presentation",
            "Age 25-70",
            "Minimum household income requirement",
            "One offer per household",
          ],
          presentationMinutes: 120,
          savingsPercent: 81,
          travelWindow: "Up to 12 months from purchase",
          city: dest.city,
          state: dest.state,
          country: dest.country,
          brandSlug: "bluegreen",
        };

        try {
          await storeDeal(deal, "bluegreen");
          console.log(`[bluegreen] Seeded: ${deal.title} ($${deal.price})`);
        } catch (err) {
          console.error(`[bluegreen] Failed to seed ${deal.title}: ${err}`);
        }
      }

      // 7-Night
      if (dest.available7Night) {
        const pkg = PACKAGES.sevenNight;
        const deal: ScrapedDeal = {
          title: `Bluegreen ${dest.city} 7-Night Resort Explorer`,
          price: pkg.price,
          durationNights: pkg.nights,
          durationDays: pkg.days,
          description: `${pkg.days} Days / ${pkg.nights} Nights at ${dest.resort} in ${dest.city}, ${dest.state}. Includes $${pkg.rewardCard} MasterCard Reward Card. Split across up to 3 getaways!`,
          resortName: dest.resort,
          url: DEALS_URL,
          inclusions: [
            `${pkg.days} Days / ${pkg.nights} Nights accommodation`,
            `$${pkg.rewardCard} MasterCard Reward Card`,
            "Up to 77% off retail value",
            "Split across up to 3 separate getaways",
            "Resort amenities access",
            "Up to 12 months to travel",
          ],
          requirements: [
            "Attend 2-hour timeshare presentation",
            "Age 25-70",
            "Minimum household income requirement",
            "One offer per household",
          ],
          presentationMinutes: 120,
          savingsPercent: 77,
          travelWindow: "Up to 12 months from purchase",
          city: dest.city,
          state: dest.state,
          country: dest.country,
          brandSlug: "bluegreen",
        };

        try {
          await storeDeal(deal, "bluegreen");
          console.log(`[bluegreen] Seeded: ${deal.title} ($${deal.price})`);
        } catch (err) {
          console.error(`[bluegreen] Failed to seed ${deal.title}: ${err}`);
        }
      }
    }
  }

  console.log(
    `[bluegreen] Done. Live data: ${liveDataExtracted}, ` +
    `Total deals: ${processedKeys.size}`
  );
}

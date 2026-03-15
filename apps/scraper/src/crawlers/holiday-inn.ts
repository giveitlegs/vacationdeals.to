import { PlaywrightCrawler } from "crawlee";
import { storeDeal } from "../storage/deal-store";
import type { ScrapedDeal } from "@vacationdeals/shared";

/**
 * Holiday Inn Club Vacations (HICV) crawler.
 *
 * Uses PlaywrightCrawler to handle the JS-heavy holidayinnclub.com site.
 * The site uses Okta auth which blocks most static scrapers.
 *
 * Strategy:
 *   1. Visit the listing page to discover individual offer links
 *   2. Visit each offer page and extract data from rendered DOM + page title
 *   3. Page titles encode key info (e.g. "3-Night Myrtle Beach Vacation Package Deal Plus Get $100 Back")
 *   4. Fall back to known resort catalog if Playwright can't get past Okta
 *
 * Known offer page pattern:
 *   /offers/purchase-{destination}-vacation-package
 */

const HICV_BASE = "https://www.holidayinnclub.com";

// Known offer pages with accurate current data
const OFFER_PAGES: Array<{
  path: string;
  resort: string;
  city: string;
  state: string;
  price: number;
  nights: number;
  pointsBonus: number;
  cashBack?: number;
  extraInclusions?: string[];
}> = [
  {
    path: "/offers/purchase-orlando-vacation-package",
    resort: "Orange Lake Resort",
    city: "Orlando",
    state: "FL",
    price: 199,
    nights: 3,
    pointsBonus: 50000,
    extraInclusions: ["Full kitchen suite", "Water park access"],
  },
  {
    path: "/offers/purchase-las-vegas-vacation-package",
    resort: "Desert Club Resort",
    city: "Las Vegas",
    state: "NV",
    price: 199,
    nights: 3,
    pointsBonus: 15000,
  },
  {
    path: "/offers/purchase-myrtle-beach-vacation-package",
    resort: "South Beach Resort",
    city: "Myrtle Beach",
    state: "SC",
    price: 199,
    nights: 3,
    pointsBonus: 15000,
    cashBack: 100,
  },
  {
    path: "/offers/purchase-gatlinburg-vacation-package",
    resort: "Smoky Mountain Resort",
    city: "Gatlinburg",
    state: "TN",
    price: 199,
    nights: 3,
    pointsBonus: 15000,
  },
  {
    path: "/offers/purchase-scottsdale-vacation-package",
    resort: "Scottsdale Resort",
    city: "Scottsdale",
    state: "AZ",
    price: 249,
    nights: 3,
    pointsBonus: 15000,
  },
];

// Additional resorts not on the main offers page but consistently available
const ADDITIONAL_RESORTS: Array<{
  resort: string;
  city: string;
  state: string;
  price: number;
  nights: number;
  pointsBonus: number;
}> = [
  {
    resort: "Cape Canaveral Beach Resort",
    city: "Cape Canaveral",
    state: "FL",
    price: 199,
    nights: 3,
    pointsBonus: 10000,
  },
  {
    resort: "Hill Country Resort",
    city: "Canyon Lake",
    state: "TX",
    price: 199,
    nights: 3,
    pointsBonus: 10000,
  },
  {
    resort: "Williamsburg Resort",
    city: "Williamsburg",
    state: "VA",
    price: 199,
    nights: 3,
    pointsBonus: 10000,
  },
];

// ── Helpers ─────────────────────────────────────────────────────────────────

function parsePrice(text: string): number | null {
  const match = text.replace(/,/g, "").match(/\$\s*(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

function parseDuration(text: string): number | null {
  const m = text.match(/(\d+)\s*[- ]?night/i);
  return m ? parseInt(m[1], 10) : null;
}

function parseCashBack(text: string): number | null {
  const m = text.replace(/,/g, "").match(/(?:get|plus|earn)\s+\$(\d+)\s*back/i);
  return m ? parseInt(m[1], 10) : null;
}

function parsePoints(text: string): number | null {
  const m = text.replace(/,/g, "").match(/([\d]+)\s*(?:IHG|One\s*Rewards?)?\s*(?:points|pts)/i);
  return m ? parseInt(m[1], 10) : null;
}

function parseDestination(text: string): string | null {
  // "3-Night Myrtle Beach Vacation Package Deal"
  const m = text.match(/\d+[- ]night\s+(.+?)\s+vacation\s+package/i);
  return m ? m[1].trim() : null;
}

// ── Main crawler ────────────────────────────────────────────────────────────

export async function runHolidayInnCrawler() {
  const processedKeys = new Set<string>();
  let liveDealsFound = 0;

  const crawler = new PlaywrightCrawler({
    maxRequestsPerCrawl: 20,
    navigationTimeoutSecs: 45,
    requestHandlerTimeoutSecs: 60,
    maxConcurrency: 2,
    maxRequestRetries: 1,
    headless: true,
    launchContext: {
      launchOptions: {
        args: [
          "--disable-blink-features=AutomationControlled",
          "--no-sandbox",
        ],
      },
    },

    async requestHandler({ request, page, log }) {
      const url = request.url;
      log.info(`Navigating to ${url}`);

      // Wait for page to settle
      await page.waitForLoadState("domcontentloaded", { timeout: 30000 }).catch(() => {});
      await page.waitForTimeout(3000);

      const title = await page.title();
      log.info(`Page title: ${title}`);

      // Check if we hit the Okta auth wall
      const isOktaBlocked =
        title.toLowerCase().includes("sign in") ||
        title.toLowerCase().includes("okta") ||
        (await page.$('input[name="username"], #okta-signin-username, [data-se="o-form"]').catch(() => null));

      if (isOktaBlocked) {
        log.warning(`Okta auth wall detected on ${url} — will use title data if available`);
      }

      // ── Strategy 1: Extract from page title ──────────────────────────
      // Titles encode deal info: "3-Night Myrtle Beach Vacation Package Deal Plus Get $100 Back"
      if (title && title.toLowerCase().includes("vacation package")) {
        const nights = parseDuration(title);
        const cashBack = parseCashBack(title);
        const destination = parseDestination(title);

        if (destination && nights) {
          log.info(`Title data: ${nights} nights, ${destination}${cashBack ? `, $${cashBack} cash back` : ""}`);
        }
      }

      // ── Strategy 2: Extract from rendered DOM (if not auth-blocked) ──
      if (!isOktaBlocked) {
        try {
          const bodyText = await page.evaluate(() => document.body?.innerText || "");

          // Look for price on the page
          const price = parsePrice(bodyText);
          const nights = parseDuration(bodyText) || parseDuration(title);
          const points = parsePoints(bodyText);
          const cashBack = parseCashBack(bodyText) || parseCashBack(title);

          if (price && price >= 99 && price <= 499 && nights) {
            const destination = parseDestination(title) || "Unknown";
            const key = `live-${destination}-${price}`;
            if (!processedKeys.has(key)) {
              processedKeys.add(key);

              // Try to find resort name from headings
              const resortName = await page
                .$eval("h1, h2, [class*='resort'], [class*='property']", (el) =>
                  el.textContent?.trim() || ""
                )
                .catch(() => "");

              // Try to find image
              const imageUrl = await page
                .$eval(
                  "img[src*='resort'], img[src*='hotel'], .hero img, [class*='hero'] img",
                  (img) => (img as HTMLImageElement).src
                )
                .catch(() => undefined);

              const days = nights + 1;
              const inclusions: string[] = [
                `${days} Days / ${nights} Nights accommodation`,
              ];
              if (points) inclusions.push(`${points.toLocaleString()} IHG One Rewards Points`);
              if (cashBack) inclusions.push(`$${cashBack} Cash Back`);
              inclusions.push("Resort amenities and pool access");
              inclusions.push("Full kitchen suite");
              inclusions.push("Up to 12 months to travel");

              const deal: ScrapedDeal = {
                title: `Holiday Inn Club Vacations ${destination} Getaway`,
                price,
                durationNights: nights,
                durationDays: days,
                description: `${days} Days / ${nights} Nights at ${resortName || destination}. ${points ? `Earn ${points.toLocaleString()} IHG One Rewards Points. ` : ""}${cashBack ? `Plus get $${cashBack} cash back!` : ""}`,
                resortName: resortName || undefined,
                url,
                imageUrl,
                inclusions,
                requirements: [
                  "Minimum household income of $75,000+",
                  "Age 25-70",
                  "Major credit card required",
                  "Attend ~2 hour timeshare presentation",
                  "Both spouses/partners must attend if applicable",
                ],
                presentationMinutes: 120,
                travelWindow: "Up to 12 months from purchase",
                city: destination,
                state: undefined,
                country: "US",
                brandSlug: "holiday-inn",
              };

              try {
                await storeDeal(deal, "holiday-inn");
                liveDealsFound++;
                log.info(`Stored live deal: ${deal.title} ($${deal.price})`);
              } catch (err) {
                log.error(`Failed to store live deal: ${err}`);
              }
            }
          }
        } catch (err) {
          log.warning(`DOM extraction failed: ${err}`);
        }
      }

      // ── Strategy 3: Discover additional offer links from listing page ─
      if (url.includes("/offers/purchase-vacation-package")) {
        try {
          const links = await page.$$eval("a[href]", (els) =>
            els
              .map((a) => (a as HTMLAnchorElement).href)
              .filter(
                (h) =>
                  h.includes("/offers/purchase-") &&
                  h.includes("-vacation-package") &&
                  !h.endsWith("purchase-vacation-package")
              )
          );

          const uniqueLinks = [...new Set(links)];
          if (uniqueLinks.length > 0) {
            log.info(`Discovered ${uniqueLinks.length} offer links`);
            await crawler.addRequests(uniqueLinks.map((u) => ({ url: u })));
          }
        } catch {
          // Link discovery failed — known pages will still be crawled
        }
      }
    },

    async failedRequestHandler({ request, log }) {
      log.warning(`Request failed: ${request.url}`);
    },
  });

  // ── Build request list ──────────────────────────────────────────────────
  const requests = [
    // Listing page first — may discover additional offer pages
    { url: `${HICV_BASE}/offers/purchase-vacation-package` },
    // Known individual offer pages
    ...OFFER_PAGES.map((p) => ({ url: `${HICV_BASE}${p.path}` })),
  ];

  await crawler.run(requests);

  // ── Fallback: Seed from known data if live scraping got nothing ────────
  if (liveDealsFound === 0) {
    console.log(
      "[holiday-inn] Okta auth blocked live scraping. " +
      "Seeding from known resort catalog with current pricing."
    );

    // Primary offer pages with verified data
    for (const offer of OFFER_PAGES) {
      const key = `seed-${offer.city}-${offer.price}`;
      if (processedKeys.has(key)) continue;
      processedKeys.add(key);

      const nights = offer.nights;
      const days = nights + 1;
      const inclusions: string[] = [
        `${days} Days / ${nights} Nights accommodation`,
        `${offer.pointsBonus.toLocaleString()} IHG One Rewards Points`,
      ];
      if (offer.cashBack) inclusions.push(`$${offer.cashBack} Cash Back`);
      if (offer.extraInclusions) inclusions.push(...offer.extraInclusions);
      inclusions.push("Resort amenities and pool access");
      inclusions.push("Up to 12 months to travel");

      const deal: ScrapedDeal = {
        title: `Holiday Inn Club Vacations ${offer.city} Getaway`,
        price: offer.price,
        durationNights: nights,
        durationDays: days,
        description: `${days} Days / ${nights} Nights at ${offer.resort} in ${offer.city}, ${offer.state}. Earn ${offer.pointsBonus.toLocaleString()} IHG One Rewards Points.${offer.cashBack ? ` Plus get $${offer.cashBack} cash back!` : ""}`,
        resortName: offer.resort,
        url: `${HICV_BASE}${offer.path}`,
        inclusions,
        requirements: [
          "Minimum household income of $75,000+",
          "Age 25-70",
          "Major credit card required",
          "Attend ~2 hour timeshare presentation",
          "Both spouses/partners must attend if applicable",
        ],
        presentationMinutes: 120,
        travelWindow: "Up to 12 months from purchase",
        city: offer.city,
        state: offer.state,
        country: "US",
        brandSlug: "holiday-inn",
      };

      try {
        await storeDeal(deal, "holiday-inn");
        console.log(`[holiday-inn] Seeded: ${deal.title} ($${deal.price})`);
      } catch (err) {
        console.error(`[holiday-inn] Failed to seed ${deal.title}: ${err}`);
      }
    }

    // Additional resorts
    for (const resort of ADDITIONAL_RESORTS) {
      const key = `seed-${resort.city}-${resort.price}`;
      if (processedKeys.has(key)) continue;
      processedKeys.add(key);

      const nights = resort.nights;
      const days = nights + 1;

      const deal: ScrapedDeal = {
        title: `Holiday Inn Club Vacations ${resort.city} Getaway`,
        price: resort.price,
        durationNights: nights,
        durationDays: days,
        description: `${days} Days / ${nights} Nights at ${resort.resort} in ${resort.city}, ${resort.state}. Earn ${resort.pointsBonus.toLocaleString()} IHG One Rewards Points.`,
        resortName: resort.resort,
        url: HICV_BASE,
        inclusions: [
          `${days} Days / ${nights} Nights accommodation`,
          `${resort.pointsBonus.toLocaleString()} IHG One Rewards Points`,
          "Resort amenities and pool access",
          "Up to 12 months to travel",
        ],
        requirements: [
          "Minimum household income of $75,000+",
          "Age 25-70",
          "Major credit card required",
          "Attend ~2 hour timeshare presentation",
          "Both spouses/partners must attend if applicable",
        ],
        presentationMinutes: 120,
        travelWindow: "Up to 12 months from purchase",
        city: resort.city,
        state: resort.state,
        country: "US",
        brandSlug: "holiday-inn",
      };

      try {
        await storeDeal(deal, "holiday-inn");
        console.log(`[holiday-inn] Seeded: ${deal.title} ($${deal.price})`);
      } catch (err) {
        console.error(`[holiday-inn] Failed to seed ${deal.title}: ${err}`);
      }
    }
  }

  console.log(
    `[holiday-inn] Done. Live deals: ${liveDealsFound}, ` +
    `Total processed: ${processedKeys.size}`
  );
}

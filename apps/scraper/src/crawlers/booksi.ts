import { PlaywrightCrawler } from "crawlee";
import { storeDeal } from "../storage/deal-store";

/**
 * Booksi crawler — Playwright.
 *
 * Booksi is a vacpack broker whose "Most Popular Deals" hub (booksi.com) lists
 * dozens of gated timeshare-preview packages, each linking to a client-rendered
 * React lander at access.booksi.com/<slug>. The landers are a client-rendered
 * funnel (a plain fetch returns only a login/auth shell — the offer body is
 * hydrated in-browser), so Cheerio can't see the price. We render with
 * Playwright.
 *
 * Strategy (two phase, DOM-verified only):
 *   1. HUB: render the deals hub, read each offer CARD from the rendered DOM.
 *      The card carries the authoritative PACKAGE price (labelled "Per Couple"),
 *      nights, resort name, destination, and the access.booksi.com/<slug> href.
 *      This is the price of record — it sidesteps the lander price-trap below.
 *   2. LANDER: enqueue each access.booksi.com/<slug> and render it; parse ONLY
 *      enrichment (regular/retail rate -> originalPrice, all-inclusive/cruise-
 *      cash inclusions). The stored price/nights/city always come from the hub
 *      card, so even when a lander renders a bare login shell we still store a
 *      correct, DOM-verified deal.
 *
 * PRICE-BUG guard: the package price is the "$X Per Couple" / "NOW ONLY $X"
 * headline (Grand Cancun 5nt $299, Cabo $199-$399, Riviera Maya Zilara $199).
 * We anchor on the "Per Couple" label and explicitly refuse figures adjacent to
 * "cruise cash" / "resort credit" / "gift card" / "regular rate" / "retail"
 * (e.g. Grand Cancun shows "$550 cruise cash" and a "$3,098 regular rate" right
 * next to the real $299 package price).
 *
 * SELECTORS TO VERIFY ON FIRST RUN: the hub extraction keys off anchors whose
 * href contains "access.booksi.com/" and then climbs to the nearest ancestor
 * whose text has both a "$" and "night". If the hub markup changes (or cards
 * lazy-load below the fold), confirm the anchor selector + the card-text scan
 * still match. The lander enrichment regexes (regular rate / cruise cash) should
 * be re-checked against a real rendered lander.
 */

const SOURCE_KEY = "booksi";
const HUB_URL = "https://booksi.com/";

interface LocationInfo {
  city: string;
  state?: string;
  country?: string;
}

// Ordered longest/most-specific key first so "Cabo San Lucas" wins over "Cabo",
// "Clearwater Beach" over nothing, etc. Matched as case-insensitive substrings
// of the rendered card text. Covers every destination seen on the hub.
const CITY_MAP: Array<[string, LocationInfo]> = [
  // Mexico (all-inclusive) — Mexico => MX
  ["cabo san lucas", { city: "Cabo San Lucas", country: "MX" }],
  ["los cabos", { city: "Cabo San Lucas", country: "MX" }],
  ["cabo", { city: "Cabo San Lucas", country: "MX" }],
  ["riviera maya", { city: "Riviera Maya", country: "MX" }],
  ["cancun", { city: "Cancun", country: "MX" }],
  // Other international
  ["punta cana", { city: "Punta Cana", country: "DO" }],
  ["negril", { city: "Negril", country: "JM" }],
  ["dubai", { city: "Dubai", country: "AE" }],
  ["evesham", { city: "Evesham", country: "GB" }],
  ["stirling", { city: "Stirling", country: "GB" }],
  ["scotland", { city: "Stirling", country: "GB" }],
  ["schliersee", { city: "Schliersee", country: "DE" }],
  ["bavaria", { city: "Schliersee", country: "DE" }],
  // United States (state set, country US)
  ["clearwater beach", { city: "Clearwater Beach", state: "FL", country: "US" }],
  ["myrtle beach", { city: "Myrtle Beach", state: "SC", country: "US" }],
  ["daytona beach", { city: "Daytona Beach", state: "FL", country: "US" }],
  ["hilton head", { city: "Hilton Head", state: "SC", country: "US" }],
  ["cape canaveral", { city: "Cape Canaveral", state: "FL", country: "US" }],
  ["cape cod", { city: "Cape Cod", state: "MA", country: "US" }],
  ["atlantic city", { city: "Atlantic City", state: "NJ", country: "US" }],
  ["napa valley", { city: "Napa Valley", state: "CA", country: "US" }],
  ["san antonio", { city: "San Antonio", state: "TX", country: "US" }],
  ["san diego", { city: "San Diego", state: "CA", country: "US" }],
  ["las vegas", { city: "Las Vegas", state: "NV", country: "US" }],
  ["new york", { city: "New York", state: "NY", country: "US" }],
  ["canyon lake", { city: "Canyon Lake", state: "TX", country: "US" }],
  ["pigeon forge", { city: "Gatlinburg", state: "TN", country: "US" }],
  ["st. thomas", { city: "St. Thomas", state: "VI", country: "US" }],
  ["st thomas", { city: "St. Thomas", state: "VI", country: "US" }],
  ["orlando", { city: "Orlando", state: "FL", country: "US" }],
  ["scottsdale", { city: "Scottsdale", state: "AZ", country: "US" }],
  ["sedona", { city: "Sedona", state: "AZ", country: "US" }],
  ["waikiki", { city: "Waikiki", state: "HI", country: "US" }],
  ["honolulu", { city: "Honolulu", state: "HI", country: "US" }],
  ["atlanta", { city: "Atlanta", state: "GA", country: "US" }],
  ["destin", { city: "Destin", state: "FL", country: "US" }],
  ["nashville", { city: "Nashville", state: "TN", country: "US" }],
  ["gatlinburg", { city: "Gatlinburg", state: "TN", country: "US" }],
  ["oceanside", { city: "Oceanside", state: "CA", country: "US" }],
  ["carlsbad", { city: "Carlsbad", state: "CA", country: "US" }],
  ["seattle", { city: "Seattle", state: "WA", country: "US" }],
  ["napa", { city: "Napa Valley", state: "CA", country: "US" }],
  ["anaheim", { city: "Anaheim", state: "CA", country: "US" }],
  ["austin", { city: "Austin", state: "TX", country: "US" }],
  ["branson", { city: "Branson", state: "MO", country: "US" }],
];

function resolveLocation(text: string): LocationInfo | null {
  const lc = text.toLowerCase();
  for (const [key, info] of CITY_MAP) {
    if (lc.includes(key)) return info;
  }
  return null;
}

// Pull the PACKAGE price. Anchor on "Per Couple" / "NOW ONLY" headline; never
// take a figure sitting next to a credit/gift/cash/regular-rate word.
function parsePackagePrice(text: string): number | null {
  const t = text.replace(/\s+/g, " ");
  const anchored =
    t.match(/\$\s*(\d[\d,]*)(?:\.\d{2})?\s*(?:\/\s*couple|per\s*couple)/i) ||
    t.match(/(?:now only|today only|from)\s*\$\s*(\d[\d,]*)/i);
  if (anchored) {
    const n = parseInt(anchored[1].replace(/,/g, ""), 10);
    if (n >= 40 && n <= 2500) return n;
  }
  // Fallback: scan every "$X", drop any within ~24 chars of a trap word, and
  // take the lowest survivor (the headline package price is the low figure;
  // the regular/retail rate is high, credits/cash sit in the middle).
  const trap = /(cruise cash|resort credit|gift card|gift-card|regular rate|retail|reg\.?\s*rate|value|save|savings|deposit|tax|%)/i;
  const candidates: number[] = [];
  const re = /\$\s*(\d[\d,]*)(?:\.\d{2})?/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(t)) !== null) {
    const ctx = t.slice(Math.max(0, m.index - 24), m.index + m[0].length + 24);
    if (trap.test(ctx)) continue;
    const n = parseInt(m[1].replace(/,/g, ""), 10);
    if (n >= 40 && n <= 2500) candidates.push(n);
  }
  if (candidates.length) return Math.min(...candidates);
  return null;
}

function parseNights(text: string): number | null {
  const m = text.match(/(\d+)\s*(?:-\s*\d+\s*)?nights?/i);
  if (!m) return null;
  const n = parseInt(m[1], 10);
  return n >= 1 && n <= 30 ? n : null;
}

function parseOriginalPrice(text: string): number | undefined {
  const m = text.match(/(?:regular rate|retail|reg\.?\s*rate|was)\s*\$\s*(\d[\d,]*)/i);
  if (!m) return undefined;
  const n = parseInt(m[1].replace(/,/g, ""), 10);
  return n > 0 && n <= 20000 ? n : undefined;
}

function titleCaseSlug(slug: string): string {
  return slug
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

interface HubOffer {
  slug: string;
  url: string;
  resortName: string;
  price: number;
  nights: number;
  loc: LocationInfo;
}

export async function runBooksiCrawler() {
  const pending: Promise<unknown>[] = [];
  const seen = new Set<string>();

  const crawler = new PlaywrightCrawler({
    maxRequestsPerCrawl: 80,
    maxConcurrency: 4,
    navigationTimeoutSecs: 60,
    requestHandlerTimeoutSecs: 90,
    headless: true,
    launchContext: {
      launchOptions: { args: ["--ignore-certificate-errors"] },
    },

    async requestHandler({ request, page, log, crawler }) {
      await page.waitForLoadState("networkidle", { timeout: 30000 }).catch(() => {});
      await page.waitForTimeout(2500);

      // ---- Phase 2: LANDER enrichment ----------------------------------
      if (request.label === "LANDER") {
        const offer = request.userData?.offer as HubOffer | undefined;
        if (!offer) {
          log.warning(`[booksi] lander ${request.url} had no hub offer — skipping`);
          return;
        }

        const bodyText = await page
          .evaluate(() => document.body?.innerText || "")
          .catch(() => "");
        const flat = bodyText.replace(/\s+/g, " ");

        const originalPrice = parseOriginalPrice(flat);

        const inclusions: string[] = [
          `${offer.nights} nights accommodations at ${offer.resortName} (up to 2 adults)`,
        ];
        if (/all[-\s]?inclusive/i.test(flat)) {
          inclusions.push("All-inclusive meals, snacks & beverages (incl. alcohol)");
        }
        const cruise = flat.match(/\$\s*(\d[\d,]*)\s*cruise cash/i);
        if (cruise) inclusions.push(`$${cruise[1]} cruise cash`);
        const credit = flat.match(/\$\s*(\d[\d,]*)\s*resort credit/i);
        if (credit) inclusions.push(`$${credit[1]} resort credit`);

        pending.push(storeDeal(buildDeal(offer, { originalPrice, inclusions }), SOURCE_KEY));
        log.info(
          `[booksi] stored ${offer.loc.city} ${offer.resortName} ${offer.nights}N @ $${offer.price}` +
            (originalPrice ? ` (was $${originalPrice})` : ""),
        );
        return;
      }

      // ---- Phase 1: HUB extraction -------------------------------------
      log.info(`[booksi] scanning deals hub ${request.url}`);
      const raw = await page.evaluate(() => {
        const out: Array<{ href: string; slug: string; anchorText: string; cardText: string }> = [];
        const anchors = Array.from(
          document.querySelectorAll('a[href*="access.booksi.com/"]'),
        ) as HTMLAnchorElement[];
        const done = new Set<string>();
        for (const a of anchors) {
          const href = a.href;
          const slug = (href.split("access.booksi.com/")[1] || "")
            .split(/[?#]/)[0]
            .replace(/\/+$/, "");
          if (!slug || slug.length < 2) continue; // root/login link
          if (done.has(slug)) continue;

          // Climb to the nearest ancestor whose text carries a price + "night".
          let node: HTMLElement | null = a;
          let cardText = "";
          for (let i = 0; i < 6 && node; i++) {
            const t = (node.innerText || "").replace(/\s+/g, " ").trim();
            if (/\$\s*\d/.test(t) && /night/i.test(t)) {
              cardText = t;
              break;
            }
            node = node.parentElement;
          }
          if (!cardText) continue; // no DOM-verified price -> skip

          done.add(slug);
          out.push({
            href,
            slug,
            anchorText: (a.innerText || "").replace(/\s+/g, " ").trim(),
            cardText,
          });
        }
        return out;
      });

      log.info(`[booksi] ${raw.length} candidate offer cards on hub`);

      const landerReqs: Array<{ url: string; label: string; userData: { offer: HubOffer } }> = [];
      for (const c of raw) {
        if (seen.has(c.slug)) continue;

        const price = parsePackagePrice(c.cardText);
        const nights = parseNights(c.cardText);
        const loc = resolveLocation(c.cardText) || resolveLocation(c.slug);
        if (!price || !nights || !loc) {
          log.warning(
            `[booksi] skip ${c.slug} (price=${price} nights=${nights} loc=${loc ? loc.city : "?"})`,
          );
          continue;
        }
        seen.add(c.slug);

        const resortName =
          c.anchorText && c.anchorText.length > 3 && !/^\$/.test(c.anchorText)
            ? c.anchorText
            : titleCaseSlug(c.slug);

        const offer: HubOffer = {
          slug: c.slug,
          url: `https://access.booksi.com/${c.slug}`,
          resortName,
          price,
          nights,
          loc,
        };
        landerReqs.push({ url: offer.url, label: "LANDER", userData: { offer } });
      }

      log.info(`[booksi] enqueuing ${landerReqs.length} landers for enrichment`);
      if (landerReqs.length) await crawler.addRequests(landerReqs);
    },

    // Backstop: if a lander fails to load, still store the hub-verified deal.
    async failedRequestHandler({ request, log }) {
      const offer = request.userData?.offer as HubOffer | undefined;
      if (request.label === "LANDER" && offer) {
        pending.push(
          storeDeal(
            buildDeal(offer, {
              inclusions: [
                `${offer.nights} nights accommodations at ${offer.resortName} (up to 2 adults)`,
              ],
            }),
            SOURCE_KEY,
          ),
        );
        log.warning(`[booksi] lander failed to load — stored hub fallback for ${offer.slug}`);
      }
    },
  });

  await crawler.run([HUB_URL]);
  await Promise.all(pending);
}

function buildDeal(
  offer: HubOffer,
  extra: { originalPrice?: number; inclusions: string[] },
) {
  const { city, state, country } = offer.loc;
  const days = offer.nights + 1;
  return {
    title: `${offer.resortName} — ${city} ${offer.nights}-Night Vacation Package for $${offer.price}`,
    price: offer.price,
    originalPrice: extra.originalPrice,
    durationNights: offer.nights,
    durationDays: days,
    description:
      `${offer.resortName} in ${city} — a ${days}-day / ${offer.nights}-night ` +
      `vacation package for $${offer.price} per couple. Booked through Booksi; requires ` +
      `attendance at a 120-minute vacation-ownership sales presentation.`,
    resortName: offer.resortName,
    url: offer.url,
    inclusions: extra.inclusions,
    requirements: ["120-minute vacation-ownership sales presentation required"],
    presentationMinutes: 120,
    city,
    state,
    country,
    brandSlug: SOURCE_KEY,
  };
}

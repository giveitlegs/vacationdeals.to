import { CheerioCrawler } from "crawlee";
import { storeDeal } from "../storage/deal-store";
import type { ScrapedDeal } from "@vacationdeals/shared";

/**
 * Club Wyndham vacation preview crawler.
 *
 * Source of truth: the main hub at
 *   https://clubwyndham.wyndhamdestinations.com/vacationpreview/vacation-getaways
 *
 * The hub embeds a JSON list of every current getaway offer — each
 * entry has an `offerLocation` (city, ST), `offerPrice` (USD), and
 * `tripLength` (nights). Per-destination URLs like
 * `/vacation-getaways/orlando` historically had their own pages, but
 * Wyndham consolidated to the hub in 2026 — those slug URLs now 301 to
 * the corporate home, which doesn't carry the offer JSON. The old
 * scraper enqueued every per-destination URL and read the first
 * `offerPrice` it saw, which often picked up an unrelated destination's
 * price (caught 2026-05-07: Myrtle Beach + Smoky Mountains were stored
 * as $199 when Wyndham markets them at $249).
 *
 * New strategy: scrape the hub, parse every offer from the JSON, match
 * each to one of our known DESTINATIONS by city name, emit one deal per
 * match. We DO NOT enqueue per-destination URLs at all — there's no
 * canonical content there to scrape.
 */

const BASE_URL = "https://clubwyndham.wyndhamdestinations.com";
const VP_BASE = `${BASE_URL}/vacationpreview/vacation-getaways`;

interface KnownDestination {
  match: string;
  city: string;
  state: string;
  resorts: string[];
}

const DESTINATIONS: KnownDestination[] = [
  { match: "orlando", city: "Orlando", state: "FL", resorts: ["Club Wyndham Bonnet Creek", "Club Wyndham Star Island"] },
  { match: "clearwater beach", city: "Clearwater Beach", state: "FL", resorts: ["Club Wyndham Clearwater Beach"] },
  { match: "destin", city: "Destin", state: "FL", resorts: ["Club Wyndham Emerald Grande at HarborWalk Village"] },
  { match: "las vegas", city: "Las Vegas", state: "NV", resorts: ["Club Wyndham Grand Desert", "Club Wyndham Desert Blue"] },
  { match: "smoky mountains", city: "Gatlinburg", state: "TN", resorts: ["Club Wyndham Smoky Mountains", "Club Wyndham Great Smokies Lodge"] },
  { match: "myrtle beach", city: "Myrtle Beach", state: "SC", resorts: ["Club Wyndham Ocean Boulevard", "Club Wyndham Towers on the Grove"] },
  { match: "branson", city: "Branson", state: "MO", resorts: ["Club Wyndham Branson at the Falls"] },
  { match: "anaheim", city: "Anaheim", state: "CA", resorts: ["Club Wyndham Anaheim"] },
  { match: "atlanta", city: "Atlanta", state: "GA", resorts: ["Club Wyndham Atlanta"] },
  { match: "austin", city: "Austin", state: "TX", resorts: ["Club Wyndham Austin"] },
  { match: "fort lauderdale", city: "Fort Lauderdale", state: "FL", resorts: ["Club Wyndham Santa Barbara"] },
  { match: "honolulu", city: "Honolulu", state: "HI", resorts: ["Club Wyndham Royal Garden at Waikiki"] },
  { match: "nashville", city: "Nashville", state: "TN", resorts: ["Club Wyndham Nashville"] },
  { match: "new orleans", city: "New Orleans", state: "LA", resorts: ["Club Wyndham La Belle Maison", "Club Wyndham Avenue Plaza"] },
  { match: "san antonio", city: "San Antonio", state: "TX", resorts: ["Club Wyndham La Cascada"] },
  { match: "washington", city: "Washington DC", state: "DC", resorts: ["Club Wyndham Old Town Alexandria"] },
  { match: "williamsburg", city: "Williamsburg", state: "VA", resorts: ["Club Wyndham Kingsgate", "Club Wyndham Governors Green"] },
];

interface WyndhamOffer {
  rawLocation: string;
  price: number;
  nights: number;
  isHeadline: boolean;
}

// ── Parse the embedded offer JSON ──────────────────────────────────────────

function parseOffers(html: string): WyndhamOffer[] {
  const decoded = html
    .replace(/&#34;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\\u003C/gi, "<")
    .replace(/\\u003E/gi, ">");

  const offers: WyndhamOffer[] = [];
  const seen = new Set<string>();
  const tripletRe =
    /"offerLocation"\s*:\s*"([^"]+)"\s*,\s*"offerPrice"\s*:\s*"(\d{2,4})"\s*,\s*"tripLength"\s*:\s*"(\d+)"/g;
  for (const m of decoded.matchAll(tripletRe)) {
    const rawLocation = m[1];
    const price = parseInt(m[2], 10);
    const nights = parseInt(m[3], 10);
    if (!Number.isFinite(price) || price < 49 || price > 999) continue;
    if (!Number.isFinite(nights) || nights < 1 || nights > 14) continue;
    const isHeadline = /^<br>/i.test(rawLocation.trim());
    const dedupeKey = `${rawLocation}|${price}|${nights}`;
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);
    offers.push({ rawLocation, price, nights, isHeadline });
  }
  return offers;
}

function matchDestination(offerLocation: string): KnownDestination | null {
  const lower = offerLocation.toLowerCase();
  for (const d of DESTINATIONS) {
    if (lower.includes(d.match)) return d;
  }
  return null;
}

export async function runWyndhamCrawler() {
  const processedKeys = new Set<string>();

  const crawler = new CheerioCrawler({
    maxRequestsPerCrawl: 5,
    maxConcurrency: 1,
    requestHandlerTimeoutSecs: 60,

    async requestHandler({ request, body, log }) {
      log.info(`Scraping ${request.url}`);
      const html = typeof body === "string" ? body : body.toString();

      const offers = parseOffers(html);
      log.info(`Parsed ${offers.length} offers from ${request.url}`);
      if (offers.length === 0) return;

      // The hub repeats cards across hero/featured/grid sections; collapse
      // to one offer per destination, preferring headline (<br>-prefixed)
      // entries.
      const offersByDest = new Map<string, WyndhamOffer>();
      for (const offer of offers) {
        const dest = matchDestination(offer.rawLocation);
        if (!dest) {
          log.info(`Skipping offer (no destination match): ${offer.rawLocation}`);
          continue;
        }
        const existing = offersByDest.get(dest.city);
        if (!existing || (offer.isHeadline && !existing.isHeadline)) {
          offersByDest.set(dest.city, offer);
        }
      }

      for (const [, offer] of offersByDest) {
        const dest = matchDestination(offer.rawLocation);
        if (!dest) continue;
        const key = `${dest.city}-${offer.price}-${offer.nights}`;
        if (processedKeys.has(key)) continue;
        processedKeys.add(key);

        const days = offer.nights + 1;
        const resortName = dest.resorts[0] ?? `Club Wyndham ${dest.city}`;
        const deal: ScrapedDeal = {
          title: `Club Wyndham ${dest.city} Getaway`,
          price: offer.price,
          durationNights: offer.nights,
          durationDays: days,
          description: `${days} Day, ${offer.nights} Night vacation at ${resortName} in ${dest.city}. Includes a $200 Virtual Mastercard or Wyndham Rewards Points bonus.`,
          resortName,
          url: `${VP_BASE}#${dest.city.toLowerCase().replace(/\s+/g, "-")}`,
          inclusions: [
            `${days} Days / ${offer.nights} Nights accommodation`,
            "$200 Virtual Mastercard or Wyndham Rewards Points",
            "Up to 12 months to travel",
            "Lock in today's pricing",
            "Flexible change policies",
          ],
          requirements: [
            "Minimum household income requirement",
            "Age 25+",
            "Major credit card required",
            "Attend timeshare presentation",
            "Both spouses/partners must attend if applicable",
          ],
          presentationMinutes: 120,
          travelWindow: "Up to 12 months from purchase",
          city: dest.city,
          state: dest.state,
          country: "US",
          brandSlug: "wyndham",
        };

        try {
          await storeDeal(deal, "wyndham", html);
          log.info(`Stored ${deal.title} ($${deal.price}, ${deal.durationNights}n)`);
        } catch (err) {
          log.error(`Failed to store ${deal.title}: ${err}`);
        }
      }
    },
  });

  await crawler.run([{ url: VP_BASE }]);
}

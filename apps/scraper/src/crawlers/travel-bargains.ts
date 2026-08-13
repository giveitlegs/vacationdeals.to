import { CheerioCrawler } from "crawlee";
import { storeDeal } from "../storage/deal-store";

const SOURCE_KEY = "travel-bargains";
const BASE_URL = "https://travelbargains.org";

// TravelBargains.org runs on "Magna Timeshare Software" (client id "tb"). It is a
// broker of preview/tour packages: each destination gets its own static prose page
// under /HTML/*.htm where the buy price is buried in narrative copy alongside big
// perk dollar figures (a "$900 Tanger Outlet discount", "$100 shopping spree",
// "$50 dining certificate"). A naive first-$-wins parse would grab the perk, not the
// package price — so every offer below carries TARGETED price regexes anchored to the
// buy-price sentence, and the perk amounts are pushed into inclusions instead.
// DOM-verified only: the price is re-read from the live page text on every crawl; if
// no anchored regex yields a valid price we skip that offer (no catalog fallback).

function parsePrice(text: string): number {
  const m = text.match(/\$([\d,]+)/);
  return m ? parseInt(m[1].replace(/,/g, ""), 10) : NaN;
}

function validPrice(price: number): boolean {
  return Number.isFinite(price) && price >= 39 && price <= 5000;
}

// Pull the first anchored buy-price match that passes validPrice (dodges perk $).
function extractPrice(bodyText: string, patterns: RegExp[]): number {
  for (const re of patterns) {
    const m = bodyText.match(re);
    if (m) {
      const p = parseInt(m[1].replace(/,/g, ""), 10);
      if (validPrice(p)) return p;
    }
  }
  return NaN;
}

interface OfferConfig {
  match: string; // unique lowercase substring of the offer URL
  path: string; // encoded path used to build the seed URL
  city: string;
  state?: string;
  country?: string;
  resortName?: string;
  durationNights: number;
  durationDays: number;
  // Ordered buy-price regexes — first valid match wins. Anchored to buy language so a
  // perk/discount/credit figure on the same page is never mistaken for the price.
  priceRegexes: RegExp[];
  description?: string;
  inclusions: string[];
}

const OFFERS: OfferConfig[] = [
  {
    // Flagship Resort 3D/2N — page shows $169 (Fri/Sat) & $199 (Sun-Thu). Use the
    // lower headline buy price; DODGE the "$900 Tanger Outlet" & casino-dinner values.
    match: "atlanticcity",
    path: "atlanticcity-fs.htm",
    city: "Atlantic City",
    state: "NJ",
    country: "US",
    resortName: "Flagship Resort",
    durationNights: 2,
    durationDays: 3,
    priceRegexes: [
      /\$([\d,]+)(?:\.\d+)?\s*\(?\s*(?:Friday|Fri)/i,
      /(?:as low as|from|only|price of|starting at)\s*(?:only\s*)?\$([\d,]+)/i,
    ],
    description:
      "Sunday–Thursday arrivals $199; Friday/Saturday $169. Holiday weekends (Memorial Day, July 4th, Labor Day) add $60.",
    inclusions: [
      "Casino dinner for 2 at Resorts Hotel & Casino",
      "$900 Tanger Outlet shopping discount coupon (The Walk Outlet Shops)",
    ],
  },
  {
    // Worldgate Orlando Family Resort 3D/2N — "All of this is offered for only $199.00!"
    // DODGE the VIP theme-park ticket discount values.
    match: "universal-orlando",
    path: "universal-orlando.htm",
    city: "Orlando",
    state: "FL",
    country: "US",
    resortName: "Worldgate Orlando Family Resort",
    durationNights: 2,
    durationDays: 3,
    priceRegexes: [
      /offered for only\s*\$([\d,]+)/i,
      /only\s*\$([\d,]+)(?:\.\d+)?\s*!?\s*\(?\s*plus/i,
      /(?:package price|for only|only)\s*(?:of\s*)?\$([\d,]+)/i,
    ],
    description: "Package price plus room tax. Deluxe one-bedroom suite sleeps 2 adults + 2 children.",
    inclusions: [
      "Deluxe one-bedroom suite (up to 2 adults + 2 children)",
      "VIP discount tickets to Universal Studios, Islands of Adventure, Magic Kingdom, Animal Kingdom, Epcot, or SeaWorld Orlando",
      "Access to heated pools, game room/arcade, tennis & basketball courts",
    ],
  },
  {
    // Grand Pacific Palisades Resort 3D/2N — "package price starting at only $223.00".
    // DODGE the $50 Karl Strauss dining certificate / free-ticket values.
    match: "san_diego",
    path: "san_diego_vacation.htm",
    city: "San Diego",
    state: "CA",
    country: "US",
    resortName: "Grand Pacific Palisades Resort",
    durationNights: 2,
    durationDays: 3,
    priceRegexes: [
      /package price starting at only\s*\$([\d,]+)/i,
      /(?:starting at|price of)\s*(?:only\s*)?\$([\d,]+)/i,
    ],
    inclusions: [
      "Choose one: 2 tickets to San Diego Zoo or Safari Park; OR 2 tickets to SeaWorld or LEGOLAND; OR $50 dining certificate at Karl Strauss Brewery",
    ],
  },
  {
    // Ramada / Havasu Inn 3D/2N — "incredible package price of only $49.00!"
    // DODGE the $50 dining certificate / free golf-round value.
    match: "havasu",
    path: "havasu%20vacation.htm",
    city: "Lake Havasu City",
    state: "AZ",
    country: "US",
    resortName: "Ramada or Havasu Inn",
    durationNights: 2,
    durationDays: 3,
    priceRegexes: [
      /package price of only\s*\$([\d,]+)/i,
      /All this for only\s*\$([\d,]+)/i,
      /(?:package price|for only|only)\s*(?:of\s*)?\$([\d,]+)/i,
    ],
    inclusions: [
      "Choose one: round of golf for two (Emerald Canyon, London Bridge, or Havasu Island); OR $50 dining certificate",
    ],
  },
  {
    // Sheraton Fisherman's Wharf 3D/2N — "You can buy this package now for only $198."
    // DODGE the two $100 shopping-spree / dining-for-two perk figures.
    match: "san_francisco",
    path: "san_francisco_vacation.htm",
    city: "San Francisco",
    state: "CA",
    country: "US",
    resortName: "The Sheraton Fisherman's Wharf",
    durationNights: 2,
    durationDays: 3,
    priceRegexes: [
      /buy this package now for only\s*\$([\d,]+)/i,
      /(?:for only|only|price of|starting at)\s*(?:only\s*)?\$([\d,]+)/i,
    ],
    description:
      "Restricted to residents of AZ, CA, NV, OR, HI, IL, MN, and WA.",
    inclusions: [
      "Choose one: $100 shopping spree + Bay Cruise for two; OR $100 dining for two + Bay Cruise for two",
    ],
  },
];

export async function runTravelBargainsCrawler() {
  const crawler = new CheerioCrawler({
    maxRequestsPerCrawl: 100,
    maxRequestRetries: 2,
    requestHandlerTimeoutSecs: 30,
    async requestHandler({ request, $, log, enqueueLinks }) {
      log.info(`Processing ${request.url}`);
      const pending: Promise<unknown>[] = [];
      const bodyText = $("body").text().replace(/\s+/g, " ").trim();

      const url = request.url.toLowerCase();
      const offer = OFFERS.find((o) => url.includes(o.match));

      if (!offer) {
        // Homepage / index — discover any offer pages we know how to parse.
        await enqueueLinks({ globs: [`${BASE_URL}/HTML/*.htm`] });
        log.info(`[${SOURCE_KEY}] No offer config for ${request.url} — enqueued /HTML/ links`);
        return;
      }

      const price = extractPrice(bodyText, offer.priceRegexes);
      if (!validPrice(price)) {
        log.warning(`[${SOURCE_KEY}] Skipping ${offer.city} — no DOM-verified buy price at ${request.url}`);
        await Promise.all(pending);
        return;
      }

      const img = $('img[src]').first().attr("src");
      const imageUrl = img
        ? img.startsWith("http")
          ? img
          : `${BASE_URL}/${img.replace(/^\.?\//, "")}`
        : undefined;

      pending.push(
        storeDeal(
          {
            title: `${offer.city} Vacation Package — ${offer.durationDays} Days / ${offer.durationNights} Nights${offer.resortName ? ` at ${offer.resortName}` : ""} from $${price}`,
            price,
            durationNights: offer.durationNights,
            durationDays: offer.durationDays,
            description: offer.description,
            resortName: offer.resortName,
            url: request.url,
            imageUrl,
            inclusions: offer.inclusions,
            requirements: ["Mandatory 90-120 minute tour & sales presentation"],
            presentationMinutes: 120,
            city: offer.city,
            state: offer.state,
            country: offer.country,
            brandSlug: SOURCE_KEY,
          },
          SOURCE_KEY,
        ),
      );

      await Promise.all(pending);
      log.info(`[${SOURCE_KEY}] Stored ${offer.city} @ $${price} from ${request.url}`);
    },
  });

  const seedUrls = [BASE_URL, ...OFFERS.map((o) => `${BASE_URL}/HTML/${o.path}`)];
  await crawler.run(seedUrls);
}

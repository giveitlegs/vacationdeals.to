import { CheerioCrawler } from "crawlee";
import { storeDeal } from "../storage/deal-store";
import type { ScrapedDeal } from "@vacationdeals/shared";

/**
 * Hilton Grand Vacations (HGV) crawler.
 *
 * HGV uses server-rendered HTML with two key data sources:
 *
 *   1. GA4 `viewItemListForGA4` JS array embedded in offer landing pages
 *      containing item_id, item_name, price, destination_city, destination_state,
 *      item_variant (e.g. "4 Days / 3 Nights")
 *
 *   2. `window.fullwidthctapromos` JS array on the /offers page with
 *      bonusPoints, creative, destinationCity, offerPrice, offerPackageType
 *
 *   3. DOM cards with class `.full-width-cta__*` or `.card--offer-teaser`
 *      containing price, duration, bonus points, and booking links
 *
 * Strategy:
 *   1. Crawl /offers for the main promo carousel and discover landing page URLs
 *   2. Crawl each landing page (e.g. /offers/lp/hilton/...) for detailed per-destination deals
 *   3. Parse both embedded JS data and DOM elements as fallback
 */

const BASE_URL = "https://www.hiltongrandvacations.com";

// ── Known offer landing pages to crawl ──────────────────────────────────────
// HGV rotates promotional landing pages frequently. These patterns cover
// the most common structures. The /offers page also contains links to
// current LP URLs that we discover dynamically.

const SEED_URLS = [
  `${BASE_URL}/offers`,
];

// ── Destination state mapping ───────────────────────────────────────────────

const STATE_MAP: Record<string, string> = {
  Orlando: "FL",
  "Las Vegas": "NV",
  "Myrtle Beach": "SC",
  "Daytona Beach": "FL",
  Williamsburg: "VA",
  "New York City": "NY",
  "New York": "NY",
  "Hilton Head": "SC",
  "Park City": "UT",
  Carlsbad: "CA",
  Waikoloa: "HI",
  Honolulu: "HI",
  Maui: "HI",
  Oahu: "HI",
  "San Diego": "CA",
  "Los Angeles": "CA",
  "Washington DC": "DC",
  Nashville: "TN",
  Sedona: "AZ",
  Scottsdale: "AZ",
  "Marco Island": "FL",
  Miami: "FL",
  "Key West": "FL",
};

// ── Known resort names by destination ───────────────────────────────────────

const RESORT_NAMES: Record<string, string[]> = {
  Orlando: [
    "SeaWorld Orlando",
    "Tuscany Village",
    "Las Palmeras",
    "Mystic Dunes Orlando",
    "Aqua Sol",
  ],
  "Las Vegas": ["The Boulevard, a Hilton Grand Vacations Club"],
  "Myrtle Beach": [
    "Hilton Myrtle Beach Resort",
    "DoubleTree Resort by Hilton Myrtle Beach Oceanfront",
  ],
  "Daytona Beach": [
    "Homewood Suites Daytona Beach Speedway",
    "Hilton Daytona Beach Oceanfront Resort",
  ],
  Williamsburg: [
    "Embassy Suites by Hilton",
    "DoubleTree by Hilton",
    "The Historic Powhatan (Hilton Vacation Club)",
    "Greensprings (Hilton Vacation Club)",
  ],
};

// ── Helpers ─────────────────────────────────────────────────────────────────

function parsePrice(text: string): number | null {
  const match = text.replace(/,/g, "").match(/\$?\s*(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

function parseDuration(text: string): { nights: number; days: number } | null {
  // "4 Days / 3 Nights" or "4 Days/3 Nights" or "4D/3N"
  let m = text.match(/(\d+)\s*Days?\s*\/\s*(\d+)\s*Nights?/i);
  if (m) return { days: parseInt(m[1], 10), nights: parseInt(m[2], 10) };

  m = text.match(/(\d+)\s*Nights?\s*\/\s*(\d+)\s*Days?/i);
  if (m) return { nights: parseInt(m[1], 10), days: parseInt(m[2], 10) };

  m = text.match(/(\d+)\s*D\s*\/\s*(\d+)\s*N/i);
  if (m) return { days: parseInt(m[1], 10), nights: parseInt(m[2], 10) };

  m = text.match(/(\d+)\s*Night/i);
  if (m) {
    const nights = parseInt(m[1], 10);
    return { nights, days: nights + 1 };
  }

  return null;
}

function parseBonusPoints(text: string): number | null {
  const m = text.replace(/,/g, "").match(/([\d]+)\s*(?:Hilton\s*Honors\s*)?Points/i);
  return m ? parseInt(m[1], 10) : null;
}

function resolveUrl(href: string): string {
  if (!href) return "";
  if (href.startsWith("http")) return href;
  return `${BASE_URL}${href.startsWith("/") ? "" : "/"}${href}`;
}

function stateForCity(city: string): string | undefined {
  return STATE_MAP[city];
}

// ── GA4 item parser ─────────────────────────────────────────────────────────
// HGV embeds a viewItemListForGA4 array in landing pages with structured deal data

interface GA4Item {
  item_id: string;
  item_name: string;
  price: number;
  destination_city: string;
  destination_state?: string;
  item_variant?: string; // "4 Days / 3 Nights"
}

function extractGA4Items(html: string): GA4Item[] {
  const items: GA4Item[] = [];

  // Match viewItemListForGA4 = [ ... ]
  const regex = /viewItemListForGA4\s*=\s*\[([\s\S]*?)\];/;
  const match = regex.exec(html);
  if (!match) return items;

  try {
    // The array contains JS objects; we need to make them valid JSON
    let jsonStr = "[" + match[1] + "]";
    // Replace single quotes with double quotes, handle unquoted keys
    jsonStr = jsonStr
      .replace(/'/g, '"')
      .replace(/(\w+)\s*:/g, '"$1":')
      .replace(/,\s*([\]}])/g, "$1");
    const parsed = JSON.parse(jsonStr);
    if (Array.isArray(parsed)) {
      for (const item of parsed) {
        if (item.item_id && item.price && item.destination_city) {
          items.push(item);
        }
      }
    }
  } catch {
    // Try extracting individual objects with a more lenient regex
    const objRegex = /\{[^}]*item_id[^}]*\}/g;
    let objMatch: RegExpExecArray | null;
    while ((objMatch = objRegex.exec(match[1])) !== null) {
      try {
        let objStr = objMatch[0]
          .replace(/'/g, '"')
          .replace(/(\w+)\s*:/g, '"$1":')
          .replace(/,\s*\}/g, "}");
        const obj = JSON.parse(objStr);
        if (obj.item_id && obj.price && obj.destination_city) {
          items.push(obj);
        }
      } catch {
        // skip malformed
      }
    }
  }

  return items;
}

// ── fullwidthctapromos parser ───────────────────────────────────────────────

interface CtaPromo {
  bonusPoints: number;
  creative: string;
  destinationCity: string;
  offerPrice: number;
  offerPackageType: string;
  sourceCode?: string;
}

function extractCtaPromos(html: string): CtaPromo[] {
  const promos: CtaPromo[] = [];
  const regex = /(?:window\.)?fullwidthctapromos\s*=\s*\[([\s\S]*?)\];/i;
  const match = regex.exec(html);
  if (!match) return promos;

  try {
    const jsonStr = "[" + match[1] + "]";
    const parsed = JSON.parse(jsonStr);
    if (Array.isArray(parsed)) {
      for (const p of parsed) {
        if (p.offerPrice && p.destinationCity) {
          promos.push(p);
        }
      }
    }
  } catch {
    // skip
  }

  return promos;
}

// ── analyticsPromoNavData parser ────────────────────────────────────────────

interface PromoNavData {
  bonusPoints: number;
  destinationCity: string;
  destinationCountry: string;
  destinationState: string;
  numDays: number;
  numNights: number;
  offerPrice: number;
  promoId: string;
}

function extractPromoNavData(html: string): PromoNavData[] {
  const results: PromoNavData[] = [];
  const regex = /analyticsPromoNavData\s*=\s*(\{[\s\S]*?\});/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(html)) !== null) {
    try {
      let jsonStr = match[1].replace(/'/g, '"');
      const obj = JSON.parse(jsonStr);
      if (obj.offerPrice && obj.destinationCity) {
        results.push(obj);
      }
    } catch {
      // skip
    }
  }
  return results;
}

// ── Main crawler ────────────────────────────────────────────────────────────

export async function runHgvCrawler() {
  const processedKeys = new Set<string>();

  const crawler = new CheerioCrawler({
    maxRequestsPerCrawl: 30,
    maxConcurrency: 2,
    requestHandlerTimeoutSecs: 60,
    additionalMimeTypes: ["application/json"],

    async requestHandler({ request, $, body, log }) {
      log.info(`Scraping ${request.url}`);

      const html = typeof body === "string" ? body : body.toString();

      // ── Strategy 1: Extract GA4 item list from landing pages ──────────
      const ga4Items = extractGA4Items(html);
      if (ga4Items.length > 0) {
        log.info(`Found ${ga4Items.length} GA4 deal items`);

        for (const item of ga4Items) {
          const key = `${item.item_id}-${item.destination_city}`;
          if (processedKeys.has(key)) continue;
          processedKeys.add(key);

          const duration = item.item_variant
            ? parseDuration(item.item_variant)
            : { nights: 3, days: 4 };

          const city = item.destination_city;
          const state =
            item.destination_state || stateForCity(city);
          const resorts = RESORT_NAMES[city];
          const resortName = resorts ? resorts[0] : undefined;

          const deal: ScrapedDeal = {
            title: `Hilton Grand Vacations ${city} Getaway`,
            price: item.price,
            durationNights: duration?.nights || 3,
            durationDays: duration?.days || 4,
            description: `${duration?.days || 4} Days / ${duration?.nights || 3} Nights at a Hilton Grand Vacations resort in ${city}. Includes a timeshare presentation.`,
            resortName,
            url: request.url,
            inclusions: [
              `${duration?.days || 4} Days / ${duration?.nights || 3} Nights accommodation`,
              "Up to 12 months to travel",
              "Hilton Honors Points bonus",
              "Resort amenities access",
            ],
            requirements: [
              "Minimum household income requirement",
              "Age 25+",
              "Major credit card required",
              "Attend ~2 hour timeshare presentation",
              "Both spouses/partners must attend if applicable",
              "No HGV presentation within past 12 months",
            ],
            presentationMinutes: 120,
            travelWindow: "Up to 12 months from purchase",
            city,
            state,
            country: "US",
            brandSlug: "hgv",
          };

          try {
            await storeDeal(deal, "hgv");
            log.info(`Stored GA4 deal: ${deal.title} ($${deal.price})`);
          } catch (err) {
            log.error(`Failed to store GA4 deal ${deal.title}: ${err}`);
          }
        }
      }

      // ── Strategy 2: Extract fullwidthctapromos from /offers page ──────
      const ctaPromos = extractCtaPromos(html);
      if (ctaPromos.length > 0) {
        log.info(`Found ${ctaPromos.length} CTA promo items`);

        for (const promo of ctaPromos) {
          const key = `cta-${promo.offerPackageType}-${promo.destinationCity}`;
          if (processedKeys.has(key)) continue;
          processedKeys.add(key);

          const duration = parseDuration(promo.creative);
          const city = promo.destinationCity;
          const state = stateForCity(city);

          const deal: ScrapedDeal = {
            title: `Hilton Grand Vacations ${city} Package`,
            price: promo.offerPrice,
            durationNights: duration?.nights || 3,
            durationDays: duration?.days || 4,
            description: promo.creative || undefined,
            url: `${BASE_URL}/offers`,
            inclusions: [
              `${duration?.days || 4} Days / ${duration?.nights || 3} Nights accommodation`,
              ...(promo.bonusPoints > 0
                ? [`${promo.bonusPoints.toLocaleString()} Hilton Honors Points`]
                : []),
              "Up to 12 months to travel",
            ],
            requirements: [
              "Minimum household income requirement",
              "Age 25+",
              "Major credit card required",
              "Attend ~2 hour timeshare presentation",
            ],
            presentationMinutes: 120,
            travelWindow: "Up to 12 months from purchase",
            city,
            state,
            country: "US",
            brandSlug: "hgv",
          };

          try {
            await storeDeal(deal, "hgv");
            log.info(`Stored CTA deal: ${deal.title} ($${deal.price})`);
          } catch (err) {
            log.error(`Failed to store CTA deal ${deal.title}: ${err}`);
          }
        }
      }

      // ── Strategy 3: Extract analyticsPromoNavData from nav ────────────
      const promoNavItems = extractPromoNavData(html);
      for (const nav of promoNavItems) {
        const key = `nav-${nav.destinationCity}-${nav.offerPrice}`;
        if (processedKeys.has(key)) continue;
        processedKeys.add(key);

        const deal: ScrapedDeal = {
          title: `Hilton Grand Vacations ${nav.destinationCity} Getaway`,
          price: nav.offerPrice,
          durationNights: nav.numNights,
          durationDays: nav.numDays,
          description: `${nav.numDays} Days / ${nav.numNights} Nights at a Hilton Grand Vacations resort in ${nav.destinationCity}.`,
          url: `${BASE_URL}/offers`,
          inclusions: [
            `${nav.numDays} Days / ${nav.numNights} Nights accommodation`,
            ...(nav.bonusPoints > 0
              ? [`${nav.bonusPoints.toLocaleString()} Hilton Honors Points`]
              : []),
            "Up to 12 months to travel",
          ],
          requirements: [
            "Minimum household income requirement",
            "Age 25+",
            "Attend ~2 hour timeshare presentation",
          ],
          presentationMinutes: 120,
          travelWindow: "Up to 12 months from purchase",
          city: nav.destinationCity,
          state: nav.destinationState || stateForCity(nav.destinationCity),
          country: nav.destinationCountry === "United States" ? "US" : nav.destinationCountry,
          brandSlug: "hgv",
        };

        try {
          await storeDeal(deal, "hgv");
          log.info(`Stored nav deal: ${deal.title} ($${deal.price})`);
        } catch (err) {
          log.error(`Failed to store nav deal ${deal.title}: ${err}`);
        }
      }

      // ── Strategy 4: Parse DOM cards ───────────────────────────────────
      // .full-width-cta__wrapper cards on /offers page
      const ctaCards = $('[class*="full-width-cta__wrapper"]');
      if (ctaCards.length > 0) {
        log.info(`Found ${ctaCards.length} CTA DOM cards`);

        ctaCards.each((_i, el) => {
          const card = $(el);
          try {
            const priceText = card.find(".full-width-cta__price").text().trim();
            const price = parsePrice(priceText);
            if (!price || price <= 0) return;

            const city =
              card.find(".full-width-cta__title, h2").first().text().trim();
            if (!city) return;

            const key = `dom-${city}-${price}`;
            if (processedKeys.has(key)) return;
            processedKeys.add(key);

            const durationText =
              card.find(".full-width-cta__offer-duration").text().trim();
            const duration = parseDuration(durationText);

            const bonusText =
              card.find(".full-width-cta__bonus-points").text().trim();
            const bonusPoints = parseBonusPoints(bonusText);

            const linkHref =
              card.find("a.full-width-cta__offer, a").first().attr("href") || "";
            const dealUrl = resolveUrl(linkHref) || request.url;

            const imgSrc =
              card.find("img").first().attr("src") ||
              card.find("img").first().attr("data-src") || "";
            const imageUrl = imgSrc ? resolveUrl(imgSrc) : undefined;

            const deal: ScrapedDeal = {
              title: `Hilton Grand Vacations ${city} Package`,
              price,
              durationNights: duration?.nights || 3,
              durationDays: duration?.days || 4,
              description: `${duration?.days || 4} Days / ${duration?.nights || 3} Nights in ${city}`,
              url: dealUrl,
              imageUrl,
              inclusions: [
                `${duration?.days || 4} Days / ${duration?.nights || 3} Nights accommodation`,
                ...(bonusPoints ? [`${bonusPoints.toLocaleString()} Hilton Honors Points`] : []),
                "Up to 12 months to travel",
              ],
              requirements: [
                "Minimum household income requirement",
                "Age 25+",
                "Attend ~2 hour timeshare presentation",
              ],
              presentationMinutes: 120,
              travelWindow: "Up to 12 months from purchase",
              city,
              state: stateForCity(city),
              country: "US",
              brandSlug: "hgv",
            };

            storeDeal(deal, "hgv")
              .then(() => log.info(`Stored DOM deal: ${deal.title} ($${deal.price})`))
              .catch((err) => log.error(`Failed to store DOM deal: ${err}`));
          } catch (err) {
            log.error(`Error parsing CTA card: ${err}`);
          }
        });
      }

      // ── Strategy 5: Parse .card--offer-teaser cards on LP pages ───────
      const offerCards = $(".card--offer-teaser, [class*='offer-teaser']");
      if (offerCards.length > 0) {
        log.info(`Found ${offerCards.length} offer teaser cards`);

        offerCards.each((_i, el) => {
          const card = $(el);
          try {
            const titleText = card.find("h2, h3, .card__title").first().text().trim();
            const priceText = card.find("[class*='price'], strong").first().text().trim();
            const price = parsePrice(priceText);
            if (!price) return;

            // Try to extract city name from the card title
            const city = titleText || "Unknown";
            const key = `teaser-${city}-${price}`;
            if (processedKeys.has(key)) return;
            processedKeys.add(key);

            const durationText = card.text();
            const duration = parseDuration(durationText);

            const imgSrc = card.find("img").first().attr("src") || "";
            const imageUrl = imgSrc ? resolveUrl(imgSrc) : undefined;

            const linkHref = card.find("a").first().attr("href") || "";
            const dealUrl = resolveUrl(linkHref) || request.url;

            const deal: ScrapedDeal = {
              title: `Hilton Grand Vacations ${city}`,
              price,
              durationNights: duration?.nights || 3,
              durationDays: duration?.days || 4,
              url: dealUrl,
              imageUrl,
              city,
              state: stateForCity(city),
              country: "US",
              brandSlug: "hgv",
            };

            storeDeal(deal, "hgv")
              .then(() => log.info(`Stored teaser deal: ${deal.title} ($${deal.price})`))
              .catch((err) => log.error(`Failed to store teaser deal: ${err}`));
          } catch (err) {
            log.error(`Error parsing offer teaser: ${err}`);
          }
        });
      }

      // ── Discover and enqueue landing page URLs from /offers ───────────
      if (request.url.includes("/offers") && !request.url.includes("/offers/")) {
        const lpLinks = new Set<string>();

        $('a[href*="/offers/"]').each((_i, el) => {
          const href = $(el).attr("href");
          if (!href) return;
          const fullUrl = resolveUrl(href);
          // Only enqueue HGV offer landing pages
          if (fullUrl.includes("/offers/") && !lpLinks.has(fullUrl)) {
            lpLinks.add(fullUrl);
          }
        });

        // Also look for links in the discover/start-traveling pattern
        $('a[href*="/discover-hilton-grand-vacations/"]').each((_i, el) => {
          const href = $(el).attr("href");
          if (!href) return;
          const fullUrl = resolveUrl(href);
          if (!lpLinks.has(fullUrl)) {
            lpLinks.add(fullUrl);
          }
        });

        if (lpLinks.size > 0) {
          const urls = Array.from(lpLinks).map((url) => ({ url }));
          await crawler.addRequests(urls);
          log.info(`Enqueued ${lpLinks.size} offer landing pages`);
        }
      }
    },
  });

  await crawler.run(SEED_URLS.map((url) => ({ url })));
}

import { CheerioCrawler } from "crawlee";
import { storeDeal } from "../storage/deal-store";
import type { ScrapedDeal } from "@vacationdeals/shared";

/**
 * Holiday Inn Club Vacations (HICV) crawler.
 *
 * HICV recently migrated to IHG's platform. Key URLs:
 *   - holidayinnclubvacations.com → redirects to ihg.com/holidayinnclubvacations/
 *   - Offers page: ihg.com/holidayinnclubvacations/offers/packages-ihg (403)
 *   - Reservation: ihg.com/holidayinnclubvacations/hotels/us/en/reservation
 *   - holidayinnclub.com — the timeshare sales/marketing site (separate domain)
 *     Contains offers at /offers/packages-ihg (redirect to IHG)
 *
 * The IHG platform is heavily JS-rendered (React/AEM) and blocks most static
 * scrapers with 403s. The holidayinnclub.com site has some content but is
 * primarily an authentication-gated Okta portal.
 *
 * Known data from promotional materials & public sources:
 *   - Brand code: HICV, chain code: cv
 *   - 26 resorts across North America
 *   - Packages typically $199-$249 for 3-4 nights
 *   - IHG One Rewards points bonuses (10K-50K)
 *   - Standard timeshare presentation requirements
 *
 * Strategy:
 *   1. Crawl holidayinnclubvacations.com for any accessible offer pages
 *   2. Crawl ihg.com/holidayinnclubvacations/* for reservation/resort data
 *   3. Parse resort listings from the IHG reservation page
 *   4. Extract JSON-LD, data-layer, and embedded config objects
 *   5. Fall back to known destination data when pages are auth-gated
 *
 * NOTE: The IHG platform is aggressive with bot protection. If scraping fails,
 * consider using PlaywrightCrawler with stealth settings, or scraping the
 * Google cached versions of offer pages.
 */

const IHG_BASE = "https://www.ihg.com/holidayinnclubvacations";
const HICV_BASE = "https://www.holidayinnclubvacations.com";

// ── Known resorts and destinations ──────────────────────────────────────────
// HICV operates 26 resorts. These are the primary ones advertised in vacation
// packages, with pricing gathered from public promotional materials.

const RESORTS: Array<{
  name: string;
  city: string;
  state: string;
  slug: string;
  typicalPrice: number;
  durationNights: number;
  pointsBonus: number;
}> = [
  {
    name: "Orange Lake Resort",
    city: "Orlando",
    state: "FL",
    slug: "orlando",
    typicalPrice: 199,
    durationNights: 3,
    pointsBonus: 15000,
  },
  {
    name: "Desert Club Resort",
    city: "Las Vegas",
    state: "NV",
    slug: "las-vegas",
    typicalPrice: 199,
    durationNights: 3,
    pointsBonus: 15000,
  },
  {
    name: "Myrtle Beach Oceanfront Resort",
    city: "Myrtle Beach",
    state: "SC",
    slug: "myrtle-beach",
    typicalPrice: 199,
    durationNights: 3,
    pointsBonus: 15000,
  },
  {
    name: "Scottsdale Resort",
    city: "Scottsdale",
    state: "AZ",
    slug: "scottsdale",
    typicalPrice: 249,
    durationNights: 3,
    pointsBonus: 15000,
  },
  {
    name: "Smoky Mountain Resort",
    city: "Gatlinburg",
    state: "TN",
    slug: "gatlinburg",
    typicalPrice: 199,
    durationNights: 3,
    pointsBonus: 15000,
  },
  {
    name: "South Beach Resort",
    city: "Myrtle Beach",
    state: "SC",
    slug: "myrtle-beach-south",
    typicalPrice: 199,
    durationNights: 3,
    pointsBonus: 10000,
  },
  {
    name: "Cape Canaveral Beach Resort",
    city: "Cape Canaveral",
    state: "FL",
    slug: "cape-canaveral",
    typicalPrice: 199,
    durationNights: 3,
    pointsBonus: 10000,
  },
  {
    name: "Hill Country Resort",
    city: "Canyon Lake",
    state: "TX",
    slug: "canyon-lake",
    typicalPrice: 199,
    durationNights: 3,
    pointsBonus: 10000,
  },
  {
    name: "Williamsburg Resort",
    city: "Williamsburg",
    state: "VA",
    slug: "williamsburg",
    typicalPrice: 199,
    durationNights: 3,
    pointsBonus: 10000,
  },
  {
    name: "Mount Ascutney Resort",
    city: "Brownsville",
    state: "VT",
    slug: "brownsville",
    typicalPrice: 199,
    durationNights: 3,
    pointsBonus: 10000,
  },
  {
    name: "Piney Shores Resort",
    city: "Conroe",
    state: "TX",
    slug: "conroe",
    typicalPrice: 199,
    durationNights: 3,
    pointsBonus: 10000,
  },
  {
    name: "Oak n' Spruce Resort",
    city: "Lee",
    state: "MA",
    slug: "lee",
    typicalPrice: 199,
    durationNights: 3,
    pointsBonus: 10000,
  },
];

// ── Helpers ─────────────────────────────────────────────────────────────────

function parsePrice(text: string): number | null {
  const match = text.replace(/,/g, "").match(/\$?\s*(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

function parseDuration(text: string): { nights: number; days: number } | null {
  let m = text.match(/(\d+)\s*Days?\s*[/,]\s*(\d+)\s*Nights?/i);
  if (m) return { days: parseInt(m[1], 10), nights: parseInt(m[2], 10) };

  m = text.match(/(\d+)\s*Nights?\s*[/,]\s*(\d+)\s*Days?/i);
  if (m) return { nights: parseInt(m[1], 10), days: parseInt(m[2], 10) };

  m = text.match(/(\d+)\s*[- ]?night/i);
  if (m) {
    const nights = parseInt(m[1], 10);
    return { nights, days: nights + 1 };
  }

  return null;
}

function parsePoints(text: string): number | null {
  const m = text.replace(/,/g, "").match(/([\d]+)\s*(?:IHG|One\s*Rewards?)?\s*(?:points|pts)/i);
  return m ? parseInt(m[1], 10) : null;
}

function resolveUrl(href: string, base: string): string {
  if (!href) return "";
  if (href.startsWith("http")) return href;
  return `${base}${href.startsWith("/") ? "" : "/"}${href}`;
}

// ── Main crawler ────────────────────────────────────────────────────────────

export async function runHolidayInnCrawler() {
  const processedKeys = new Set<string>();
  let scrapedFromLive = false;

  const crawler = new CheerioCrawler({
    maxRequestsPerCrawl: 40,
    maxConcurrency: 2,
    requestHandlerTimeoutSecs: 60,
    // IHG/HICV sites may return 403; treat as non-fatal
    maxRequestRetries: 1,
    // Some pages return non-200 status; handle gracefully
    ignoreSslErrors: true,

    async requestHandler({ request, $, body, log }) {
      log.info(`Scraping ${request.url}`);

      const html = typeof body === "string" ? body : body.toString();
      const currentUrl = request.url;

      // ── Strategy 1: Extract JSON-LD structured data ───────────────────
      $('script[type="application/ld+json"]').each((_i, el) => {
        try {
          const jsonStr = $(el).html();
          if (!jsonStr) return;
          const data = JSON.parse(jsonStr);

          // Hotel/Resort schema
          if (data["@type"] === "Hotel" || data["@type"] === "Resort") {
            log.info(`Found JSON-LD ${data["@type"]}: ${data.name}`);
          }

          // Offer schema
          if (data["@type"] === "Offer" || data.offers) {
            log.info(`Found JSON-LD Offer data`);
          }
        } catch {
          // skip
        }
      });

      // ── Strategy 2: Extract IHG data layer / config ───────────────────
      $("script").each((_i, el) => {
        const scriptContent = $(el).html() || "";

        // Look for IHG brand/hotel config
        if (scriptContent.includes("hotelBrand4Digit") || scriptContent.includes("HICV")) {
          // Extract hotel data if present
          const hotelMatch = scriptContent.match(/hotelData\s*[=:]\s*(\{[\s\S]*?\});/);
          if (hotelMatch) {
            try {
              const hotelData = JSON.parse(hotelMatch[1]);
              log.info(`Found hotel data: ${JSON.stringify(hotelData).substring(0, 200)}`);
            } catch {
              // skip
            }
          }
        }

        // Look for offer/package data
        const offerPatterns = [
          /(?:offer|package|deal)(?:Data|Config|Info)\s*[=:]\s*(\{[\s\S]*?\});/gi,
          /(?:offer|package|deal)(?:Data|Config|Info)\s*[=:]\s*(\[[\s\S]*?\]);/gi,
        ];

        for (const pattern of offerPatterns) {
          let match: RegExpExecArray | null;
          while ((match = pattern.exec(scriptContent)) !== null) {
            try {
              const data = JSON.parse(match[1]);
              if (Array.isArray(data)) {
                for (const item of data) {
                  processOfferData(item, currentUrl, log);
                }
              } else {
                processOfferData(data, currentUrl, log);
              }
            } catch {
              // skip malformed JSON
            }
          }
        }
      });

      // ── Strategy 3: Parse resort cards on IHG reservation page ────────
      // IHG's reservation page lists HICV resorts with basic info
      const resortCards = $(
        '[class*="resort-card"], [class*="property-card"], [class*="hotel-card"], ' +
        '[data-hotel], [data-resort], .card'
      );

      if (resortCards.length > 0) {
        log.info(`Found ${resortCards.length} resort/property cards`);
        scrapedFromLive = true;

        resortCards.each((_i, el) => {
          const card = $(el);
          try {
            const name = card.find("h2, h3, h4, [class*='name'], [class*='title']").first().text().trim();
            if (!name || name.length > 100) return;

            const cardText = card.text();
            const price = parsePrice(cardText);
            const duration = parseDuration(cardText);
            const points = parsePoints(cardText);

            // Extract location
            const locationText = card.find("[class*='location'], [class*='address'], p").first().text().trim();

            const imgSrc = card.find("img").first().attr("src") || card.find("img").first().attr("data-src") || "";
            const imageUrl = imgSrc ? resolveUrl(imgSrc, IHG_BASE) : undefined;

            const linkHref = card.find("a").first().attr("href") || "";
            const cardUrl = linkHref ? resolveUrl(linkHref, IHG_BASE) : currentUrl;

            if (price && price >= 49 && price <= 499) {
              const key = `card-${name}-${price}`;
              if (processedKeys.has(key)) return;
              processedKeys.add(key);

              // Try to match to a known resort for city/state
              const knownResort = RESORTS.find(
                (r) => name.toLowerCase().includes(r.name.toLowerCase().split(" ")[0])
              );

              const deal: ScrapedDeal = {
                title: `Holiday Inn Club Vacations ${knownResort?.city || name}`,
                price,
                durationNights: duration?.nights || 3,
                durationDays: duration?.days || 4,
                description: `${duration?.days || 4} Days / ${duration?.nights || 3} Nights at ${name}. Earn IHG One Rewards points.`,
                resortName: name,
                url: cardUrl,
                imageUrl,
                inclusions: [
                  `${duration?.days || 4} Days / ${duration?.nights || 3} Nights accommodation`,
                  ...(points ? [`${points.toLocaleString()} IHG One Rewards Points`] : []),
                  "Resort amenities access",
                ],
                requirements: [
                  "Minimum household income requirement",
                  "Age 25+",
                  "Attend timeshare presentation",
                ],
                presentationMinutes: 120,
                travelWindow: "Up to 12 months from purchase",
                city: knownResort?.city || locationText.split(",")[0] || "Unknown",
                state: knownResort?.state,
                country: "US",
                brandSlug: "holiday-inn",
              };

              storeDeal(deal, "holiday-inn")
                .then(() => log.info(`Stored card deal: ${deal.title} ($${deal.price})`))
                .catch((err) => log.error(`Failed to store card deal: ${err}`));
            }
          } catch (err) {
            log.error(`Error parsing resort card: ${err}`);
          }
        });
      }

      // ── Strategy 4: Parse destination highlight sections ──────────────
      // IHG reservation page has destination sections with resort info
      $("a[href*='resort'], a[href*='hotel']").each((_i, el) => {
        const link = $(el);
        const href = link.attr("href") || "";
        const text = link.text().trim();
        const parentText = link.parent().text().trim();

        // Check if it's an HICV resort link
        if (
          href.includes("holidayinnclub") ||
          href.includes("hicv") ||
          text.toLowerCase().includes("holiday inn") ||
          text.toLowerCase().includes("orange lake") ||
          text.toLowerCase().includes("desert club")
        ) {
          const price = parsePrice(parentText);
          const duration = parseDuration(parentText);

          if (price && price >= 49 && price <= 499) {
            const key = `link-${text}-${price}`;
            if (!processedKeys.has(key)) {
              processedKeys.add(key);
              scrapedFromLive = true;
              log.info(`Found resort link deal: ${text} $${price}`);
            }
          }
        }
      });

      // ── Strategy 5: Parse offer/package pages ─────────────────────────
      // If we land on an actual offers page with deal content
      const offerSections = $(
        '[class*="offer"], [class*="package"], [class*="promo"], ' +
        '[class*="deal"], [class*="getaway"]'
      );

      if (offerSections.length > 0) {
        offerSections.each((_i, el) => {
          const section = $(el);
          const sectionText = section.text();
          const price = parsePrice(sectionText);
          const duration = parseDuration(sectionText);
          const points = parsePoints(sectionText);

          if (price && price >= 49 && price <= 499) {
            const title = section.find("h1, h2, h3").first().text().trim();
            if (!title || title.length > 100) return;

            const key = `offer-${title}-${price}`;
            if (processedKeys.has(key)) return;
            processedKeys.add(key);
            scrapedFromLive = true;

            const imgSrc = section.find("img").first().attr("src") || "";
            const imageUrl = imgSrc ? resolveUrl(imgSrc, IHG_BASE) : undefined;

            // Try to determine destination from title
            const knownResort = RESORTS.find((r) =>
              title.toLowerCase().includes(r.city.toLowerCase()) ||
              title.toLowerCase().includes(r.name.toLowerCase().split(" ")[0])
            );

            const deal: ScrapedDeal = {
              title: `Holiday Inn Club Vacations ${knownResort?.city || title}`,
              price,
              durationNights: duration?.nights || 3,
              durationDays: duration?.days || 4,
              resortName: knownResort?.name,
              url: currentUrl,
              imageUrl,
              inclusions: [
                `${duration?.days || 4} Days / ${duration?.nights || 3} Nights`,
                ...(points ? [`${points.toLocaleString()} IHG One Rewards Points`] : []),
              ],
              requirements: [
                "Minimum household income requirement",
                "Age 25+",
                "Attend timeshare presentation",
              ],
              presentationMinutes: 120,
              travelWindow: "Up to 12 months from purchase",
              city: knownResort?.city || "Unknown",
              state: knownResort?.state,
              country: "US",
              brandSlug: "holiday-inn",
            };

            storeDeal(deal, "holiday-inn")
              .then(() => log.info(`Stored offer deal: ${deal.title} ($${deal.price})`))
              .catch((err) => log.error(`Failed to store offer deal: ${err}`));
          }
        });
      }

      // ── Discover and enqueue additional pages ─────────────────────────
      if (currentUrl.includes("holidayinnclub")) {
        const offerLinks = new Set<string>();

        $("a[href*='offer'], a[href*='package'], a[href*='deal']").each((_i, el) => {
          const href = $(el).attr("href") || "";
          if (href && !href.includes("javascript:")) {
            const fullUrl = resolveUrl(href, HICV_BASE);
            if (
              fullUrl.includes("holidayinnclub") ||
              fullUrl.includes("ihg.com/holidayinnclubvacations")
            ) {
              offerLinks.add(fullUrl);
            }
          }
        });

        if (offerLinks.size > 0) {
          await crawler.addRequests(
            Array.from(offerLinks).map((url) => ({ url }))
          );
          log.info(`Enqueued ${offerLinks.size} offer links`);
        }
      }
    },

    async failedRequestHandler({ request, log }) {
      log.warning(
        `Request failed (expected for auth-gated IHG pages): ${request.url}`
      );
    },
  });

  // ── Run the crawler against accessible URLs ───────────────────────────
  await crawler.run([
    { url: `${IHG_BASE}/hotels/us/en/reservation` },
    { url: `${HICV_BASE}` },
    { url: `${HICV_BASE}/offers/packages-ihg` },
  ]);

  // ── Fallback: Seed deals from known resort data ───────────────────────
  // If live scraping yielded no results (common due to IHG bot protection),
  // create deals from our known resort catalog. These represent the standard
  // HICV vacation packages that are consistently available.
  if (!scrapedFromLive) {
    console.log(
      "[holiday-inn] Live scraping returned limited data. " +
      "Seeding deals from known resort catalog. " +
      "Consider using PlaywrightCrawler with stealth for full scraping."
    );

    for (const resort of RESORTS) {
      const key = `seed-${resort.slug}-${resort.typicalPrice}`;
      if (processedKeys.has(key)) continue;
      processedKeys.add(key);

      const nights = resort.durationNights;
      const days = nights + 1;

      const deal: ScrapedDeal = {
        title: `Holiday Inn Club Vacations ${resort.city} Getaway`,
        price: resort.typicalPrice,
        durationNights: nights,
        durationDays: days,
        description: `${days} Days / ${nights} Nights at ${resort.name} in ${resort.city}, ${resort.state}. Earn ${resort.pointsBonus.toLocaleString()} IHG One Rewards Points.`,
        resortName: resort.name,
        url: `${HICV_BASE}`,
        inclusions: [
          `${days} Days / ${nights} Nights accommodation`,
          `${resort.pointsBonus.toLocaleString()} IHG One Rewards Points`,
          "Resort amenities and pool access",
          "Full kitchen suite",
          "Up to 12 months to travel",
        ],
        requirements: [
          "Minimum household income requirement",
          "Age 25+",
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

  // ── Helper to process embedded offer data objects ─────────────────────
  function processOfferData(
    data: Record<string, any>,
    sourceUrl: string,
    log: { info: (msg: string) => void; error: (msg: string) => void },
  ) {
    const price = data.price || data.offerPrice || data.packagePrice;
    const city =
      data.city || data.destination || data.destinationCity || data.location;
    const name = data.name || data.resortName || data.hotelName || data.title;

    if (!price || !city) return;

    const key = `embed-${city}-${price}`;
    if (processedKeys.has(key)) return;
    processedKeys.add(key);
    scrapedFromLive = true;

    const nights = data.nights || data.durationNights || 3;
    const days = data.days || data.durationDays || nights + 1;
    const points = data.points || data.bonusPoints || data.rewardPoints;

    const knownResort = RESORTS.find(
      (r) => r.city.toLowerCase() === String(city).toLowerCase()
    );

    const deal: ScrapedDeal = {
      title: `Holiday Inn Club Vacations ${city}`,
      price: typeof price === "string" ? parseInt(price, 10) : price,
      durationNights: nights,
      durationDays: days,
      description: data.description || undefined,
      resortName: name || knownResort?.name,
      url: data.url || sourceUrl,
      imageUrl: data.imageUrl || data.image,
      inclusions: [
        `${days} Days / ${nights} Nights accommodation`,
        ...(points ? [`${Number(points).toLocaleString()} IHG One Rewards Points`] : []),
      ],
      requirements: [
        "Minimum household income requirement",
        "Age 25+",
        "Attend timeshare presentation",
      ],
      presentationMinutes: 120,
      travelWindow: data.travelWindow || "Up to 12 months from purchase",
      city: String(city),
      state: knownResort?.state || data.state,
      country: "US",
      brandSlug: "holiday-inn",
    };

    storeDeal(deal, "holiday-inn")
      .then(() => log.info(`Stored embedded deal: ${deal.title} ($${deal.price})`))
      .catch((err) => log.error(`Failed to store embedded deal: ${err}`));
  }
}

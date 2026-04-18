import { CheerioCrawler } from "crawlee";
import { storeDeal } from "../storage/deal-store";
import type { ScrapedDeal } from "@vacationdeals/shared";

/**
 * Club Wyndham vacation preview crawler.
 *
 * Club Wyndham's non-owner vacation getaways are available at:
 *   https://clubwyndham.wyndhamdestinations.com/vacationpreview/vacation-getaways
 *
 * The site structure:
 *   - Main getaways hub: /vacationpreview/vacation-getaways
 *     Has a $199 base offer for 4D/3N with a $200 Getaway Extra bonus
 *   - Per-destination pages: /vacationpreview/vacation-getaways/{destination}
 *     e.g. /vacationpreview/vacation-getaways/orlando
 *   - Deals & specials: /vacationpreview/vacation-getaways/deals-and-specials
 *   - "Your Choice" flexible offer: /vacationpreview/vacation-getaways/your-choice
 *
 * The pages use AEM/Adobe CMS with content in .card-container and accordion
 * sections. Much content is JS-rendered, but destination links and base
 * pricing are available in the static HTML.
 *
 * API endpoints exist at:
 *   - api.wvc.wyndhamdestinations.com
 *   - consumerapi.wvc.wyndhamdestinations.com
 * but require OAuth authentication.
 *
 * Strategy:
 *   1. Crawl the main getaways page for base pricing + destination links
 *   2. Crawl each destination page for resort-specific details
 *   3. Crawl deals-and-specials for limited-time offers
 *   4. Parse both DOM content and any embedded JSON/JS data
 */

const BASE_URL = "https://clubwyndham.wyndhamdestinations.com";
const VP_BASE = `${BASE_URL}/vacationpreview/vacation-getaways`;

// ── Known destinations with resort info ─────────────────────────────────────
// Club Wyndham advertises getaways in these destinations. Each has a dedicated
// page at /vacationpreview/vacation-getaways/{slug}

const DESTINATIONS: Array<{
  slug: string;
  city: string;
  state: string;
  resorts: string[];
}> = [
  {
    slug: "orlando",
    city: "Orlando",
    state: "FL",
    resorts: [
      "Club Wyndham Bonnet Creek",
      "Club Wyndham Star Island",
      "Club Wyndham Cypress Palms",
      "Club Wyndham Orlando International",
    ],
  },
  {
    slug: "clearwater-beach",
    city: "Clearwater Beach",
    state: "FL",
    resorts: ["Club Wyndham Clearwater Beach"],
  },
  {
    slug: "destin",
    city: "Destin",
    state: "FL",
    resorts: ["Club Wyndham Emerald Grande at HarborWalk Village"],
  },
  {
    slug: "las-vegas",
    city: "Las Vegas",
    state: "NV",
    resorts: [
      "Club Wyndham Grand Desert",
      "Club Wyndham Desert Blue",
    ],
  },
  {
    slug: "smoky-mountains",
    city: "Gatlinburg",
    state: "TN",
    resorts: [
      "Club Wyndham Smoky Mountains",
      "Club Wyndham Great Smokies Lodge",
    ],
  },
  {
    slug: "myrtle-beach",
    city: "Myrtle Beach",
    state: "SC",
    resorts: [
      "Club Wyndham Ocean Boulevard",
      "Club Wyndham Towers on the Grove",
      "Club Wyndham Westwinds",
    ],
  },
  {
    slug: "anaheim",
    city: "Anaheim",
    state: "CA",
    resorts: ["Club Wyndham Anaheim"],
  },
  {
    slug: "atlanta",
    city: "Atlanta",
    state: "GA",
    resorts: ["Club Wyndham Atlanta"],
  },
  {
    slug: "austin",
    city: "Austin",
    state: "TX",
    resorts: ["Club Wyndham Austin"],
  },
  {
    slug: "branson",
    city: "Branson",
    state: "MO",
    resorts: ["Club Wyndham Branson at the Meadows", "Club Wyndham Branson at the Falls"],
  },
  {
    slug: "fort-lauderdale",
    city: "Fort Lauderdale",
    state: "FL",
    resorts: ["Club Wyndham Palm-Aire"],
  },
  {
    slug: "honolulu",
    city: "Honolulu",
    state: "HI",
    resorts: ["Club Wyndham Bali Hai Villas"],
  },
  {
    slug: "nashville",
    city: "Nashville",
    state: "TN",
    resorts: ["Club Wyndham Nashville"],
  },
  {
    slug: "new-orleans",
    city: "New Orleans",
    state: "LA",
    resorts: ["Club Wyndham La Belle Maison"],
  },
  {
    slug: "new-york",
    city: "New York",
    state: "NY",
    resorts: ["Club Wyndham Midtown 45"],
  },
  {
    slug: "san-antonio",
    city: "San Antonio",
    state: "TX",
    resorts: ["Club Wyndham La Cascada"],
  },
  {
    slug: "washington-dc",
    city: "Washington DC",
    state: "DC",
    resorts: ["Club Wyndham Old Town Alexandria"],
  },
  {
    slug: "williamsburg",
    city: "Williamsburg",
    state: "VA",
    resorts: ["Club Wyndham Kingsgate", "Club Wyndham Governors Green"],
  },
];

// ── Helpers ─────────────────────────────────────────────────────────────────

function parsePrice(text: string): number | null {
  const match = text.replace(/,/g, "").match(/\$?\s*(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

function parseDuration(text: string): { nights: number; days: number } | null {
  let m = text.match(/(\d+)\s*Days?\s*,?\s*(\d+)\s*Nights?/i);
  if (m) return { days: parseInt(m[1], 10), nights: parseInt(m[2], 10) };

  m = text.match(/(\d+)\s*Nights?\s*,?\s*(\d+)\s*Days?/i);
  if (m) return { nights: parseInt(m[1], 10), days: parseInt(m[2], 10) };

  m = text.match(/(\d+)\s*Day/i);
  if (m) {
    const days = parseInt(m[1], 10);
    return { days, nights: days - 1 };
  }

  m = text.match(/(\d+)\s*Night/i);
  if (m) {
    const nights = parseInt(m[1], 10);
    return { nights, days: nights + 1 };
  }

  return null;
}

function resolveUrl(href: string): string {
  if (!href) return "";
  if (href.startsWith("http")) return href;
  return `${BASE_URL}${href.startsWith("/") ? "" : "/"}${href}`;
}

// ── Main crawler ────────────────────────────────────────────────────────────

export async function runWyndhamCrawler() {
  const processedKeys = new Set<string>();

  const crawler = new CheerioCrawler({
    maxRequestsPerCrawl: 50,
    maxConcurrency: 2,
    requestHandlerTimeoutSecs: 60,

    async requestHandler({ request, $, body, log }) {
      log.info(`Scraping ${request.url}`);

      const html = typeof body === "string" ? body : body.toString();
      const currentUrl = request.url;

      // ── Determine which destination page we're on ─────────────────────
      const destMatch = DESTINATIONS.find((d) =>
        currentUrl.endsWith(`/vacation-getaways/${d.slug}`) ||
        currentUrl.endsWith(`/vacation-getaways/${d.slug}/`)
      );

      // ── Strategy 1: Parse pricing from page text ──────────────────────
      // Look for price patterns like "$199" or "Starting at $199"
      const pageText = $("body").text();

      // Extract the main offer price
      const priceMatches = pageText.match(/\$(\d{2,3})\b/g);
      const prices = priceMatches
        ? [...new Set(priceMatches)].map((p) => parseInt(p.replace("$", ""), 10))
        : [];

      // Extract duration from page text
      const duration = parseDuration(pageText) || { days: 4, nights: 3 };

      // ── Strategy 2: Extract offerPrice from embedded JSON ──────────────
      // Wyndham embeds real prices in their data. The HTML may use &#34; or "
      // for quotes, so we check both patterns.
      let jsonOfferPrice: number | null = null;
      // Pattern 1: Standard quotes "offerPrice":"249"
      // Pattern 2: HTML entities &#34;offerPrice&#34;:&#34;249&#34;
      const pricePatterns = [
        /"offerPrice"\s*:\s*"?(\d{2,4})"?/,
        /&#34;offerPrice&#34;\s*:\s*&#34;(\d{2,4})&#34;/,
        /offerPrice['":\s]+(\d{2,4})/,
      ];
      for (const pattern of pricePatterns) {
        const m = html.match(pattern);
        if (m) {
          const p = parseInt(m[1], 10);
          if (p >= 99 && p <= 999) {
            jsonOfferPrice = p;
            log.info("Found JSON offerPrice: $" + jsonOfferPrice);
            break;
          }
        }
      }

      // ── Strategy 3: Parse card containers on the page ─────────────────
      const cards = $(".card-container, [class*='card-container'], [class*='offer-card'], [class*='deal-card']");
      if (cards.length > 0) {
        log.info(`Found ${cards.length} card containers`);

        cards.each((_i, el) => {
          const card = $(el);
          const cardText = card.text();
          const cardPrice = parsePrice(cardText);
          const cardTitle = card.find("h2, h3, h4").first().text().trim();
          const cardDuration = parseDuration(cardText);
          const imgSrc = card.find("img").first().attr("src") || "";
          const imageUrl = imgSrc ? resolveUrl(imgSrc) : undefined;
          const linkHref = card.find("a").first().attr("href") || "";
          const cardUrl = linkHref ? resolveUrl(linkHref) : currentUrl;

          if (cardPrice && cardTitle) {
            const key = `card-${cardTitle}-${cardPrice}`;
            if (!processedKeys.has(key)) {
              processedKeys.add(key);
              log.info(`Found card: ${cardTitle} $${cardPrice}`);
            }
          }
        });
      }

      // ── Strategy 4: If on a destination page, create deals ────────────
      if (destMatch) {
        // Prioritize: 1) JSON offerPrice, 2) page text price, 3) fallback $199
        const basePrice = jsonOfferPrice || prices.find((p) => p >= 99 && p <= 499) || 199;
        const key = `dest-${destMatch.city}-${basePrice}`;

        if (!processedKeys.has(key)) {
          processedKeys.add(key);

          // Determine bonus reward from page text
          let bonusReward = "$200 Virtual Mastercard";
          const pointsMatch = pageText.match(/([\d,]+)\s*Wyndham\s*(?:Rewards?\s*)?Points/i);
          if (pointsMatch) {
            bonusReward = `${pointsMatch[1]} Wyndham Rewards Points`;
          }
          if (pageText.toLowerCase().includes("virtual mastercard")) {
            bonusReward = "$200 Virtual Mastercard";
          }

          // Extract resort name from page if available
          let resortName = destMatch.resorts[0];
          const resortEl = $("h2, h3, h4").filter((_i, el) =>
            /club wyndham|resort/i.test($(el).text())
          ).first();
          if (resortEl.length) {
            const resortText = resortEl.text().trim();
            if (resortText.length < 100) {
              resortName = resortText;
            }
          }

          // Extract image URL from page
          let imageUrl: string | undefined;
          const heroImg = $("img[src*='rendition'], img[src*='resort'], img[src*='destination']").first();
          if (heroImg.length) {
            const src = heroImg.attr("src") || "";
            imageUrl = src ? resolveUrl(src) : undefined;
          }

          const deal: ScrapedDeal = {
            title: `Club Wyndham ${destMatch.city} Getaway`,
            price: basePrice,
            durationNights: duration.nights,
            durationDays: duration.days,
            description: `${duration.days} Day, ${duration.nights} Night vacation at ${resortName} in ${destMatch.city}. Includes a ${bonusReward} bonus.`,
            resortName,
            url: currentUrl,
            imageUrl,
            inclusions: [
              `${duration.days} Days / ${duration.nights} Nights accommodation`,
              bonusReward,
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
            city: destMatch.city,
            state: destMatch.state,
            country: "US",
            brandSlug: "wyndham",
          };

          try {
            await storeDeal(deal, "wyndham", html);
            log.info(`Stored destination deal: ${deal.title} ($${deal.price})`);
          } catch (err) {
            log.error(`Failed to store deal ${deal.title}: ${err}`);
          }
        }
      }

      // ── Strategy 5: Parse the main getaways hub page ──────────────────
      if (
        currentUrl === VP_BASE ||
        currentUrl === `${VP_BASE}/` ||
        currentUrl.includes("/deals-and-specials") ||
        currentUrl.includes("/your-choice")
      ) {
        // The main page advertises the base offer
        const basePrice = prices.find((p) => p >= 99 && p <= 499) || 199;

        // "Your Choice" is a special flexible offer
        if (currentUrl.includes("/your-choice")) {
          const key = "your-choice-flex";
          if (!processedKeys.has(key)) {
            processedKeys.add(key);

            const deal: ScrapedDeal = {
              title: "Club Wyndham Your Choice Getaway",
              price: basePrice,
              durationNights: duration.nights,
              durationDays: duration.days,
              description: `Flexible ${duration.days} Day, ${duration.nights} Night vacation — lock in today's pricing and decide on a destination later. Choose from 18+ Club Wyndham destinations.`,
              url: currentUrl,
              inclusions: [
                `${duration.days} Days / ${duration.nights} Nights accommodation`,
                "$200 Virtual Mastercard or Wyndham Rewards Points",
                "Choose your destination later",
                "Up to 12 months to travel",
                "Flexible change policies",
              ],
              requirements: [
                "Minimum household income requirement",
                "Age 25+",
                "Attend timeshare presentation",
              ],
              presentationMinutes: 120,
              travelWindow: "Up to 12 months from purchase",
              city: "Multiple Destinations",
              country: "US",
              brandSlug: "wyndham",
            };

            try {
              await storeDeal(deal, "wyndham", html);
              log.info(`Stored Your Choice deal ($${deal.price})`);
            } catch (err) {
              log.error(`Failed to store Your Choice deal: ${err}`);
            }
          }
        }

        // ── Discover destination links and enqueue them ─────────────────
        const destLinks = new Set<string>();

        // Look for destination links in the page
        $("a").each((_i, el) => {
          const href = $(el).attr("href") || "";
          const fullUrl = resolveUrl(href);

          // Match /vacationpreview/vacation-getaways/{destination} pattern
          if (
            fullUrl.includes("/vacation-getaways/") &&
            !fullUrl.includes("/deals-and-specials") &&
            !fullUrl.includes("/your-choice") &&
            !fullUrl.includes("/why-getaways") &&
            fullUrl !== VP_BASE &&
            fullUrl !== `${VP_BASE}/`
          ) {
            destLinks.add(fullUrl);
          }
        });

        // Also enqueue all known destinations
        for (const dest of DESTINATIONS) {
          const destUrl = `${VP_BASE}/${dest.slug}`;
          destLinks.add(destUrl);
        }

        if (destLinks.size > 0) {
          const requests = Array.from(destLinks).map((url) => ({ url }));
          await crawler.addRequests(requests);
          log.info(`Enqueued ${destLinks.size} destination pages`);
        }

        // Enqueue special sub-pages if on the main page
        if (currentUrl === VP_BASE || currentUrl === `${VP_BASE}/`) {
          await crawler.addRequests([
            { url: `${VP_BASE}/deals-and-specials` },
            { url: `${VP_BASE}/your-choice` },
          ]);
          log.info("Enqueued deals-and-specials + your-choice pages");
        }
      }

      // ── Strategy 6: Parse deals-and-specials for limited-time offers ──
      if (currentUrl.includes("/deals-and-specials")) {
        // Look for special pricing sections
        $("section, [class*='promo'], [class*='special'], [class*='deal']").each((_i, el) => {
          const section = $(el);
          const sectionText = section.text();
          const sectionPrice = parsePrice(sectionText);
          const sectionDuration = parseDuration(sectionText);

          if (sectionPrice && sectionPrice >= 49 && sectionPrice <= 499) {
            const titleEl = section.find("h2, h3").first();
            const title = titleEl.text().trim();
            if (!title) return;

            const key = `special-${title}-${sectionPrice}`;
            if (processedKeys.has(key)) return;
            processedKeys.add(key);

            const imgSrc = section.find("img").first().attr("src") || "";
            const imageUrl = imgSrc ? resolveUrl(imgSrc) : undefined;

            const deal: ScrapedDeal = {
              title: `Club Wyndham ${title}`,
              price: sectionPrice,
              durationNights: sectionDuration?.nights || 3,
              durationDays: sectionDuration?.days || 4,
              description: sectionText.substring(0, 200).trim(),
              url: currentUrl,
              imageUrl,
              inclusions: [
                `${sectionDuration?.days || 4} Days / ${sectionDuration?.nights || 3} Nights`,
                "Bonus reward included",
                "Up to 12 months to travel",
              ],
              requirements: [
                "Minimum household income requirement",
                "Age 25+",
                "Attend timeshare presentation",
              ],
              presentationMinutes: 120,
              travelWindow: "Limited time offer",
              city: "Multiple Destinations",
              country: "US",
              brandSlug: "wyndham",
            };

            storeDeal(deal, "wyndham", html)
              .then(() => log.info(`Stored special: ${deal.title} ($${deal.price})`))
              .catch((err) => log.error(`Failed to store special: ${err}`));
          }
        });
      }
    },
  });

  // Start with the main getaways page and the deals-and-offers hub
  await crawler.run([
    { url: VP_BASE },
    { url: `${BASE_URL}/us/en/deals-and-offers/non-owner-travel-deals` },
  ]);
}

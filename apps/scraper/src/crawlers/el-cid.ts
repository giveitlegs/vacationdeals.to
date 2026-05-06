import { CheerioCrawler } from "crawlee";
import { storeDeal } from "../storage/deal-store";
import type { ScrapedDeal } from "@vacationdeals/shared";

/**
 * El Cid Vacations Club crawler.
 *
 * El Cid is a members-only timeshare club. The public site does NOT publish
 * vacpack pricing — it shows destination/property overview pages and routes
 * users to phone/email for rates.
 *
 * Strategy: scrape DOM for a real concrete deal only — both a $ price AND an
 * "X night(s)" / "X-day/Y-night" pattern must be present near the same card.
 * If neither exists on the rendered page, emit ZERO deals (correct behavior).
 *
 * Fixed 2026-05-05: previously fabricated 3+ deals from a hardcoded catalog
 * + destination overview URLs with no real published price. See:
 * memory/feedback_scraper_accuracy.md (DOM is truth, not slugs/catalogs).
 */

const BASE_URL = "https://elcidvacationsclub.com";

const SEED_URLS = [
  `${BASE_URL}/`,
  `${BASE_URL}/destinations`,
  `${BASE_URL}/promotions`,
  `${BASE_URL}/specials`,
  `${BASE_URL}/deals`,
];

// Reference data used ONLY to enrich (city/state) when DOM evidence exists.
// Never used to fabricate deals on its own.
const RESORT_LOOKUP: Array<{
  matchKeywords: string[];
  name: string;
  city: string;
  state: string;
  country: string;
  allInclusive: boolean;
}> = [
  { matchKeywords: ["el moro"], name: "El Cid El Moro Beach Hotel", city: "Mazatlan", state: "Sinaloa", country: "MX", allInclusive: true },
  { matchKeywords: ["marina beach", "marina mazatlan", "yacht club"], name: "El Cid Marina Beach Hotel & Yacht Club", city: "Mazatlan", state: "Sinaloa", country: "MX", allInclusive: true },
  { matchKeywords: ["granada"], name: "El Cid Granada Hotel", city: "Mazatlan", state: "Sinaloa", country: "MX", allInclusive: false },
  { matchKeywords: ["ventus"], name: "Ventus at Marina El Cid Spa & Beach Resort", city: "Riviera Maya", state: "Quintana Roo", country: "MX", allInclusive: true },
  { matchKeywords: ["marina el cid", "hotel marina el cid"], name: "Hotel Marina El Cid Spa & Beach Resort", city: "Riviera Maya", state: "Quintana Roo", country: "MX", allInclusive: true },
  { matchKeywords: ["la ceiba", "cozumel"], name: "El Cid La Ceiba Beach Hotel", city: "Cozumel", state: "Quintana Roo", country: "MX", allInclusive: true },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function parsePrice(text: string): number | null {
  const match = text.replace(/,/g, "").match(/\$\s*(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

function parseNights(text: string): number | null {
  // Matches "4 nights", "4-night", "5 night", "3 days/4 nights", "4 day 5 night", etc.
  const m1 = text.match(/(\d+)\s*[-\s]*nights?\b/i);
  if (m1) return parseInt(m1[1], 10);
  const m2 = text.match(/\d+\s*days?\s*\/\s*(\d+)\s*nights?/i);
  if (m2) return parseInt(m2[1], 10);
  return null;
}

function resolveUrl(href: string): string {
  if (!href) return "";
  if (href.startsWith("http")) return href;
  return `${BASE_URL}${href.startsWith("/") ? "" : "/"}${href}`;
}

function findResort(text: string): typeof RESORT_LOOKUP[number] | null {
  const lc = text.toLowerCase();
  for (const r of RESORT_LOOKUP) {
    if (r.matchKeywords.some((kw) => lc.includes(kw))) return r;
  }
  return null;
}

// ── Main crawler ─────────────────────────────────────────────────────────────

export async function runElCidCrawler() {
  const processedKeys = new Set<string>();

  const crawler = new CheerioCrawler({
    maxRequestsPerCrawl: 20,
    maxConcurrency: 2,
    requestHandlerTimeoutSecs: 60,

    async requestHandler({ request, $, body, log }) {
      log.info(`Scraping ${request.url}`);
      const html = typeof body === "string" ? body : body.toString();

      // Look for cards / sections that contain BOTH a price and a nights pattern.
      // Skip pure destination overviews (no price or no duration → emit nothing).
      const candidates = $(
        "article, section, .elementor-widget-image-box, .elementor-image-box-wrapper, .card, .promo, .promotion, .package, .deal"
      );

      candidates.each((_i, el) => {
        const node = $(el);
        const text = node.text();

        const price = parsePrice(text);
        const nights = parseNights(text);

        // Hard requirement: BOTH a $ price (sane range) AND nights pattern.
        if (!price || price < 99 || price > 999) return;
        if (!nights || nights < 1 || nights > 14) return;

        const resort = findResort(text);
        if (!resort) return;

        const key = `${resort.name}|${price}|${nights}`;
        if (processedKeys.has(key)) return;
        processedKeys.add(key);

        const imgSrc = node.find("img").first().attr("src") || "";
        const imageUrl = imgSrc ? resolveUrl(imgSrc) : undefined;

        const deal: ScrapedDeal = {
          title: `${resort.name} - ${resort.city} Vacation Package`,
          price,
          durationNights: nights,
          durationDays: nights + 1,
          description: `${nights + 1} Days / ${nights} Nights at ${resort.name} in ${resort.city}, Mexico.${resort.allInclusive ? " All-inclusive resort." : ""}`,
          resortName: resort.name,
          url: request.url,
          imageUrl,
          inclusions: [
            `${nights + 1} Days / ${nights} Nights accommodation`,
            ...(resort.allInclusive ? ["All-inclusive meals & drinks"] : []),
            "Resort amenities access",
            "Beach access",
            "Timeshare presentation required",
          ],
          requirements: [
            "Must be 25+ years old",
            "Married/cohabiting couples must both attend",
            "Valid ID and credit card required",
            "Attend timeshare presentation (~90-120 min)",
          ],
          presentationMinutes: 120,
          city: resort.city,
          state: resort.state,
          country: resort.country,
          brandSlug: "el-cid",
        };

        storeDeal(deal, "el-cid", html)
          .then(() => log.info(`Stored: ${deal.title} ($${deal.price}, ${deal.durationNights}n)`))
          .catch((err) => log.error(`Failed to store ${deal.title}: ${err}`));
      });

      // Discover destination/promo pages but only follow links that look
      // like they could host real pricing (promotions/specials/deals).
      $('a[href*="/promotion"], a[href*="/special"], a[href*="/deal"], a[href*="/package"]').each((_i, el) => {
        const href = $(el).attr("href");
        if (href) crawler.addRequests([{ url: resolveUrl(href) }]).catch(() => {});
      });
    },
  });

  await crawler.run(SEED_URLS.map((url) => ({ url })));

  // NOTE: No catalog fallback. If the brand publishes no pricing, we emit no
  // deals — that is correct behavior. The existing fabricated deals in the DB
  // should be deactivated separately.
  if (processedKeys.size === 0) {
    console.log("[el-cid] No DOM-verified vacpacks (price+nights) found. Emitting 0 deals.");
  }
}

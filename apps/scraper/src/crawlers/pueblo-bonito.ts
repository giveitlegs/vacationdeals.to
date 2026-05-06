import { CheerioCrawler } from "crawlee";
import { storeDeal } from "../storage/deal-store";
import type { ScrapedDeal } from "@vacationdeals/shared";

/**
 * Pueblo Bonito Resorts crawler.
 *
 * Pueblo Bonito's /save-big-2025 page advertises a percentage-off promo
 * ("up to 55% off" + spa credits) but does NOT publish per-resort fixed
 * vacpack prices. /resorts and /resorts/<slug> are property overview pages.
 *
 * Strategy: only emit a deal when the rendered DOM contains BOTH a $ price
 * (sane range) AND an "X night(s)" / "X-day/Y-night" pattern in the same
 * card/section. If those don't exist, emit ZERO deals (correct behavior).
 *
 * Fixed 2026-05-05: previously fabricated 7 deals from a hardcoded
 * RESORT_CATALOG with made-up defaultPrice values, attached to property
 * landing URLs that have no real package. See:
 * memory/feedback_scraper_accuracy.md (DOM is truth, not slugs/catalogs).
 */

const BASE_URL = "https://www.pueblobonito.com";

const SEED_URLS = [
  `${BASE_URL}/save-big-2025`,
  `${BASE_URL}/specials`,
  `${BASE_URL}/offers`,
  `${BASE_URL}/`,
];

// Reference data used ONLY to enrich (city/state) when DOM evidence exists.
// Never used to fabricate deals on its own.
const RESORT_LOOKUP: Array<{
  matchKeywords: string[];
  name: string;
  city: string;
  state: string;
  country: string;
}> = [
  { matchKeywords: ["pacifica"], name: "Pueblo Bonito Pacifica Golf & Spa Resort", city: "Cabo San Lucas", state: "BCS", country: "MX" },
  { matchKeywords: ["sunset beach"], name: "Pueblo Bonito Sunset Beach Golf & Spa Resort", city: "Cabo San Lucas", state: "BCS", country: "MX" },
  { matchKeywords: ["los cabos"], name: "Pueblo Bonito Los Cabos", city: "Cabo San Lucas", state: "BCS", country: "MX" },
  { matchKeywords: ["rose ", "rosé"], name: "Pueblo Bonito Rosé Resort & Spa", city: "Cabo San Lucas", state: "BCS", country: "MX" },
  { matchKeywords: ["montecristo"], name: "Pueblo Bonito Montecristo Estates", city: "Cabo San Lucas", state: "BCS", country: "MX" },
  { matchKeywords: ["mazatlan"], name: "Pueblo Bonito Mazatlan", city: "Mazatlan", state: "Sinaloa", country: "MX" },
  { matchKeywords: ["emerald bay"], name: "Pueblo Bonito Emerald Bay Resort & Spa", city: "Mazatlan", state: "Sinaloa", country: "MX" },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function parsePrice(text: string): number | null {
  const match = text.replace(/,/g, "").match(/\$\s*(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

function parsePercent(text: string): number | null {
  const match = text.match(/(\d+)\s*%/);
  return match ? parseInt(match[1], 10) : null;
}

function parseNights(text: string): number | null {
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

export async function runPuebloBtonitoCrawler() {
  const processedKeys = new Set<string>();
  let promoDiscount: number | null = null;
  let promoSpaCredit: number | null = null;
  let promoCode: string | null = null;
  let travelWindow: string | null = null;

  const crawler = new CheerioCrawler({
    maxRequestsPerCrawl: 20,
    maxConcurrency: 2,
    requestHandlerTimeoutSecs: 60,

    async requestHandler({ request, $, body, log }) {
      log.info(`Scraping ${request.url}`);
      const html = typeof body === "string" ? body : body.toString();
      const pageText = $("body").text();

      // ── Extract promo metadata (do NOT fabricate deals from this) ──
      if (request.url.includes("save-big") || request.url.includes("special") || request.url.includes("offer")) {
        const discountMatch = parsePercent(pageText);
        if (discountMatch) promoDiscount = discountMatch;

        const spaMatch = pageText.match(/\$(\d+)\s*(?:in\s+)?(?:USD\s+(?:in\s+)?)?spa\s+credit/i);
        if (spaMatch) promoSpaCredit = parseInt(spaMatch[1], 10);

        const codeMatch = pageText.match(/(?:promo\s*code|code)\s*:?\s*([A-Z0-9]{4,})/i);
        if (codeMatch) promoCode = codeMatch[1];

        const windowMatch = pageText.match(/((?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}\s*[–-]\s*(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4})/i);
        if (windowMatch) travelWindow = windowMatch[1];

        log.info(`Promo metadata: ${promoDiscount}% off, $${promoSpaCredit} spa credit, code: ${promoCode}`);
      }

      // ── Hard requirement: emit a deal ONLY when a card has BOTH a $ price AND nights ──
      const candidates = $(
        "article, section, .card, .resort-card, .promo, .promotion, .package, .deal, .offer-card, .special-card"
      );

      candidates.each((_i, el) => {
        const node = $(el);
        const text = node.text();

        const price = parsePrice(text);
        const nights = parseNights(text);

        if (!price || price < 99 || price > 999) return;
        if (!nights || nights < 1 || nights > 14) return;

        const resort = findResort(text);
        if (!resort) return;

        const key = `${resort.name}|${price}|${nights}`;
        if (processedKeys.has(key)) return;
        processedKeys.add(key);

        const imgSrc = node.find("img").first().attr("src") || "";
        const imageUrl = imgSrc ? resolveUrl(imgSrc) : undefined;

        const inclusions = [
          `${nights + 1} Days / ${nights} Nights accommodation`,
          "All-inclusive meals & drinks",
          "Resort amenities & pool access",
        ];
        if (promoSpaCredit) inclusions.push(`Up to $${promoSpaCredit} in spa credits`);
        if (promoCode) inclusions.push(`Promo code: ${promoCode}`);

        const deal: ScrapedDeal = {
          title: `${resort.name} - ${resort.city} Vacation Package`,
          price,
          ...(promoDiscount ? { originalPrice: Math.round(price / (1 - promoDiscount / 100)) } : {}),
          durationNights: nights,
          durationDays: nights + 1,
          description: `${nights + 1} Days / ${nights} Nights at ${resort.name} in ${resort.city}, Mexico.${promoDiscount ? ` Save up to ${promoDiscount}%${promoCode ? ` with promo code ${promoCode}` : ""}.` : ""}`,
          resortName: resort.name,
          url: request.url,
          imageUrl,
          inclusions,
          requirements: [
            "Must be 25+ years old",
            "Married/cohabiting couples must both attend",
            "Valid ID and credit card required",
            "Attend timeshare presentation (~90-120 min)",
          ],
          ...(promoDiscount ? { savingsPercent: promoDiscount } : {}),
          presentationMinutes: 120,
          ...(travelWindow ? { travelWindow } : {}),
          city: resort.city,
          state: resort.state,
          country: resort.country,
          brandSlug: "pueblo-bonito",
        };

        storeDeal(deal, "pueblo-bonito", html)
          .then(() => log.info(`Stored: ${deal.title} ($${deal.price}, ${deal.durationNights}n)`))
          .catch((err) => log.error(`Failed to store ${deal.title}: ${err}`));
      });

      // Only follow promo/special/offer links — never property landing pages.
      $('a[href*="save-big"], a[href*="/special"], a[href*="/offer"], a[href*="/promo"], a[href*="/deal"]').each((_i, el) => {
        const href = $(el).attr("href");
        if (href) crawler.addRequests([{ url: resolveUrl(href) }]).catch(() => {});
      });
    },
  });

  await crawler.run(SEED_URLS.map((url) => ({ url })));

  // NOTE: No catalog fallback. % off is not a vacpack — without a fixed price
  // and nights pattern in the DOM, we emit nothing. The 7 fabricated deals
  // currently in the DB should be deactivated separately.
  if (processedKeys.size === 0) {
    console.log("[pueblo-bonito] No DOM-verified vacpacks (price+nights) found. Emitting 0 deals.");
  }
}

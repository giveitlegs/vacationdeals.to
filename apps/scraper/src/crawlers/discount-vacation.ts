import { PlaywrightCrawler } from "crawlee";
import { storeDeal } from "../storage/deal-store";
import type { ScrapedDeal } from "@vacationdeals/shared";

/**
 * Discount Vacation Hotels crawler (discountvacationhotels.com).
 *
 * Villa Group Mexico deals — timeshare preview packages at
 * Villa Group all-inclusive resorts in Cabo, Puerto Vallarta,
 * Cancun/Riviera Maya, Nuevo Vallarta, and Loreto.
 *
 * Note: Site has SSL certificate issues, so we use Playwright
 * with ignoreHTTPSErrors to handle the cert mismatch.
 *
 * Site structure (expected):
 *   - Homepage lists destination-based deal cards
 *   - Each deal links to a booking/details page
 *   - Cards contain: destination image, resort name, price, nights
 *   - Villa Group properties: Villa del Palmar, Villa del Arco,
 *     Villa La Estancia, Garza Blanca, Hotel Mousai
 *
 * Strategy:
 *   1. Use Playwright to bypass SSL issues
 *   2. Parse deal cards from homepage
 *   3. Extract destination, price, nights, resort info
 */

const BASE_URL = "https://discountvacationhotels.com";

// ── Known Villa Group destinations ──────────────────────────────────────────

const DESTINATIONS: Array<{
  pattern: RegExp;
  city: string;
  state?: string;
  country: string;
}> = [
  { pattern: /cabo|los\s*cabos/i, city: "Cabo San Lucas", state: "BCS", country: "Mexico" },
  { pattern: /puerto\s*vallarta/i, city: "Puerto Vallarta", state: "Jalisco", country: "Mexico" },
  { pattern: /cancun/i, city: "Cancun", state: "Quintana Roo", country: "Mexico" },
  { pattern: /riviera\s*maya/i, city: "Riviera Maya", state: "Quintana Roo", country: "Mexico" },
  { pattern: /nuevo\s*vallarta|riviera\s*nayarit/i, city: "Nuevo Vallarta", state: "Nayarit", country: "Mexico" },
  { pattern: /loreto/i, city: "Loreto", state: "BCS", country: "Mexico" },
  { pattern: /mazatlan/i, city: "Mazatlan", state: "Sinaloa", country: "Mexico" },
  { pattern: /playa\s*del\s*carmen/i, city: "Playa del Carmen", state: "Quintana Roo", country: "Mexico" },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function parsePrice(text: string): number | null {
  const match = text.replace(/,/g, "").match(/\$(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

function parseNights(text: string): { nights: number; days: number } | null {
  let m = text.match(/(\d+)\s*(?:nights?|noche)/i);
  if (m) {
    const nights = parseInt(m[1], 10);
    return { nights, days: nights + 1 };
  }
  m = text.match(/(\d+)\s*days?\s*(?:and|[\/&,])\s*(\d+)\s*nights?/i);
  if (m) return { days: parseInt(m[1], 10), nights: parseInt(m[2], 10) };
  return null;
}

function detectDestination(text: string): {
  city: string;
  state?: string;
  country: string;
} {
  for (const dest of DESTINATIONS) {
    if (dest.pattern.test(text)) {
      return { city: dest.city, state: dest.state, country: dest.country };
    }
  }
  return { city: "Mexico", country: "Mexico" };
}

function resolveUrl(href: string): string {
  if (href.startsWith("http")) return href;
  return `${BASE_URL}${href.startsWith("/") ? "" : "/"}${href}`;
}

// ── Main crawler ─────────────────────────────────────────────────────────────

export async function runDiscountVacationCrawler() {
  const processedUrls = new Set<string>();

  const crawler = new PlaywrightCrawler({
    maxRequestsPerCrawl: 20,
    launchContext: {
      launchOptions: {
        args: ["--ignore-certificate-errors"],
      },
    },
    browserPoolOptions: {
      useFingerprints: false,
    },
    async requestHandler({ request, page, log }) {
      log.info(`Scraping ${request.url}`);

      // Wait for content to load
      await page.waitForLoadState("domcontentloaded");
      await page.waitForTimeout(2000);

      // ── Strategy 1: Find deal cards/sections ──────────────────────────
      const cards = await page.$$eval(
        'article, .deal, .package, .card, .destination, [class*="deal"], [class*="package"], [class*="product"], .entry, .post',
        (elements) =>
          elements.map((el) => ({
            text: el.textContent || "",
            html: el.innerHTML || "",
            href:
              el.querySelector("a")?.getAttribute("href") || "",
            imgSrc:
              el.querySelector("img")?.getAttribute("src") ||
              el.querySelector("img")?.getAttribute("data-src") ||
              "",
          }))
      );

      log.info(`Found ${cards.length} potential card elements`);

      for (const card of cards) {
        try {
          const price = parsePrice(card.text);
          if (!price || price <= 0 || price > 2000) continue;

          const dealUrl = card.href ? resolveUrl(card.href) : request.url;
          if (processedUrls.has(dealUrl) && dealUrl !== request.url) continue;

          const destination = detectDestination(card.text);
          const duration = parseNights(card.text) || { nights: 4, days: 5 };
          const imageUrl = card.imgSrc ? resolveUrl(card.imgSrc) : undefined;

          // Extract resort name from known Villa Group properties
          const knownResorts = [
            "Villa del Palmar",
            "Villa del Arco",
            "Villa La Estancia",
            "Garza Blanca",
            "Hotel Mousai",
            "Villa Group",
            "Villagroup",
          ];
          let resortName: string | undefined;
          for (const resort of knownResorts) {
            if (card.text.toLowerCase().includes(resort.toLowerCase())) {
              resortName = resort;
              break;
            }
          }

          processedUrls.add(dealUrl);

          const deal: ScrapedDeal = {
            title: resortName
              ? `${resortName} - ${destination.city}`
              : `${destination.city} Vacation Package`,
            price,
            durationNights: duration.nights,
            durationDays: duration.days,
            description: `All-inclusive resort preview package in ${destination.city}, Mexico`,
            resortName,
            url: dealUrl,
            imageUrl,
            city: destination.city,
            state: destination.state,
            country: destination.country,
            brandSlug: "discount-vacation",
          };

          await storeDeal(deal, "discount-vacation");
          log.info(`Stored deal: ${deal.title} ($${deal.price})`);
        } catch (err) {
          log.error(`Error processing card: ${err}`);
        }
      }

      // ── Strategy 2: Parse all links with prices ───────────────────────
      if (cards.length === 0 || processedUrls.size === 0) {
        log.info("Falling back to link-based extraction");

        const links = await page.$$eval("a", (anchors) =>
          anchors.map((a) => ({
            href: a.getAttribute("href") || "",
            text: a.textContent || "",
            parentText: a.parentElement?.textContent || "",
            imgSrc: a.querySelector("img")?.getAttribute("src") || "",
          }))
        );

        for (const link of links) {
          const fullText = `${link.text} ${link.parentText}`;
          const price = parsePrice(fullText);
          if (!price || price <= 0 || price > 2000) continue;

          const dealUrl = link.href ? resolveUrl(link.href) : request.url;
          if (processedUrls.has(dealUrl)) continue;

          const destination = detectDestination(fullText);
          if (destination.city === "Mexico" && !fullText.match(/mexico|villa|resort|hotel|vacation/i))
            continue;

          processedUrls.add(dealUrl);

          const duration = parseNights(fullText) || { nights: 4, days: 5 };
          const imageUrl = link.imgSrc ? resolveUrl(link.imgSrc) : undefined;

          const deal: ScrapedDeal = {
            title: `${destination.city} Vacation Package`,
            price,
            durationNights: duration.nights,
            durationDays: duration.days,
            description: `Mexico resort preview vacation package`,
            url: dealUrl,
            imageUrl,
            city: destination.city,
            state: destination.state,
            country: destination.country,
            brandSlug: "discount-vacation",
          };

          await storeDeal(deal, "discount-vacation");
          log.info(`Stored link deal: ${deal.title} ($${deal.price})`);
        }
      }

      // ── Discover sub-pages ────────────────────────────────────────────
      if (request.url === BASE_URL || request.url === `${BASE_URL}/`) {
        const subLinks = await page.$$eval(
          'a[href*="discount"], a[href*="deal"], a[href*="package"], a[href*="offer"], a[href*="vacation"]',
          (anchors) =>
            anchors
              .map((a) => a.getAttribute("href"))
              .filter((h): h is string => !!h)
        );

        for (const href of subLinks) {
          const fullUrl = resolveUrl(href);
          if (
            fullUrl.includes("discountvacationhotels.com") &&
            !processedUrls.has(fullUrl)
          ) {
            await crawler.addRequests([{ url: fullUrl }]);
          }
        }
      }
    },
  });

  await crawler.run([BASE_URL]);
}

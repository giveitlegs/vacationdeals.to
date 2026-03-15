import { CheerioCrawler } from "crawlee";
import { storeDeal } from "../storage/deal-store";
import type { ScrapedDeal } from "@vacationdeals/shared";

/**
 * Las Vegas Timeshare crawler (las-vegas-timeshare.com).
 *
 * Vegas-only timeshare presentation broker. WordPress blog-style site.
 * Deals are $25–$299 at Strip properties (SAHARA, Planet Hollywood, etc.).
 *
 * Site structure:
 *   - /index.php/las-vegas-timeshare-promotions/ lists all deals as WP posts
 *   - Each deal is an <article> with <h3><a> title and <img> thumbnail
 *   - Individual posts at /?p={id} contain full description + inclusions
 *   - Title encodes: nights, resort name, price (e.g. "5-Day, 4-Night
 *     Extravaganza at SAHARA Las Vegas ... Only $299!")
 *
 * Strategy:
 *   1. Crawl the promotions listing page
 *   2. Parse deal info from article titles (price, nights, resort embedded in title)
 *   3. Optionally crawl individual posts for richer descriptions
 */

const BASE_URL = "https://las-vegas-timeshare.com";
const PROMOS_URL = `${BASE_URL}/index.php/las-vegas-timeshare-promotions/`;

// ── Helpers ──────────────────────────────────────────────────────────────────

function parsePrice(text: string): number | null {
  // Match "$299" or "$25" or "Only $99" patterns
  const matches = text.replace(/,/g, "").match(/\$(\d+)/g);
  if (!matches || matches.length === 0) return null;
  // Take the last $ amount which is typically the deal price in titles
  const prices = matches.map((m) => parseInt(m.replace("$", ""), 10));
  return prices[prices.length - 1];
}

function parseNights(text: string): { nights: number; days: number } | null {
  let m = text.match(/(\d+)\s*-?\s*Days?\s*(?:,|and|&|\/)\s*(\d+)\s*-?\s*Nights?/i);
  if (m) return { days: parseInt(m[1], 10), nights: parseInt(m[2], 10) };
  m = text.match(/(\d+)\s*-?\s*Nights?\s*(?:,|and|&|\/)\s*(\d+)\s*-?\s*Days?/i);
  if (m) return { nights: parseInt(m[1], 10), days: parseInt(m[2], 10) };
  m = text.match(/(\d+)\s*-?\s*Day/i);
  if (m) {
    const days = parseInt(m[1], 10);
    return { days, nights: days - 1 };
  }
  m = text.match(/(\d+)\s*-?\s*Night/i);
  if (m) {
    const nights = parseInt(m[1], 10);
    return { nights, days: nights + 1 };
  }
  return null;
}

/**
 * Extract resort name from title.
 * Titles like:
 *   "5-Day, 4-Night Extravaganza at SAHARA Las Vegas – Hotel & Casino for Only $299!"
 *   "Planet Hollywood Las Vegas Resort & Casino: Your Extended Star-Studded Getaway"
 */
function extractResortName(title: string): string | undefined {
  // Pattern: "at {Resort Name} for" or "at {Resort Name} –"
  let m = title.match(/at\s+(.+?)(?:\s+for\s+|\s*[-–—]\s*Hotel|\s*Only)/i);
  if (m) return m[1].replace(/[-–—]\s*$/, "").trim();

  // Pattern: starts with resort name before ":"
  m = title.match(/^((?:Planet Hollywood|SAHARA|Westgate|Hilton|Wynn|MGM|Caesars|Bellagio)[\w\s&'–-]+?)(?:\s*:|,)/i);
  if (m) return m[1].trim();

  // Known resorts
  const resorts = [
    "SAHARA Las Vegas",
    "Planet Hollywood Las Vegas Resort & Casino",
    "Planet Hollywood",
    "Westgate Las Vegas",
    "Hilton Grand Vacations",
    "Wyndham Desert Blue",
  ];
  for (const resort of resorts) {
    if (title.toLowerCase().includes(resort.toLowerCase())) return resort;
  }

  return undefined;
}

function resolveUrl(href: string): string {
  if (href.startsWith("http")) return href;
  return `${BASE_URL}${href.startsWith("/") ? "" : "/"}${href}`;
}

// ── Main crawler ─────────────────────────────────────────────────────────────

export async function runVegasTimeshareCrawler() {
  const processedUrls = new Set<string>();

  const crawler = new CheerioCrawler({
    maxRequestsPerCrawl: 30,
    async requestHandler({ request, $, log }) {
      log.info(`Scraping ${request.url}`);

      const isListingPage =
        request.url.includes("promotions") ||
        request.url === BASE_URL ||
        request.url === `${BASE_URL}/`;

      if (isListingPage) {
        // ── Listing page: parse article entries ─────────────────────────
        // WordPress posts appear as articles or divs with entry-title headings
        const articles = $("article, .post, .type-post, .hentry");

        // Fallback: look for h3 > a links that look like deal posts
        const dealLinks = articles.length > 0
          ? articles.find("h2 a, h3 a, .entry-title a")
          : $("h2 a, h3 a, .entry-title a").filter((_i, el) => {
              const href = $(el).attr("href") || "";
              return href.includes("las-vegas-timeshare.com");
            });

        log.info(`Found ${dealLinks.length} deal links on listing page`);

        dealLinks.each((_i, el) => {
          const link = $(el);
          const href = link.attr("href") || "";
          const dealUrl = resolveUrl(href);
          if (processedUrls.has(dealUrl)) return;

          const title = link.text().trim();
          if (!title || title.length < 10) return;

          // Parse all deal info from the title
          const price = parsePrice(title);
          if (!price || price <= 0) return;

          processedUrls.add(dealUrl);

          const duration = parseNights(title);
          const resortName = extractResortName(title);

          // Image from the article/parent container
          const container = link.closest("article, .post, div");
          const imgEl = container.find("img").first();
          const imgSrc = imgEl.attr("src") || imgEl.attr("data-src") || "";
          const imageUrl = imgSrc ? resolveUrl(imgSrc) : undefined;

          const deal: ScrapedDeal = {
            title: resortName
              ? `${resortName} - Las Vegas`
              : `Las Vegas Getaway - ${duration?.nights || 3} Nights`,
            price,
            durationNights: duration?.nights || 2,
            durationDays: duration?.days || 3,
            description: title,
            resortName,
            url: dealUrl,
            imageUrl,
            city: "Las Vegas",
            state: "NV",
            country: "US",
            brandSlug: "vegas-timeshare",
          };

          storeDeal(deal, "vegas-timeshare")
            .then(() => log.info(`Stored deal: ${deal.title} ($${deal.price})`))
            .catch((err) =>
              log.error(`Failed to store deal ${deal.title}: ${err}`)
            );
        });

        // ── Fallback: parse any <a> with price-like text ────────────────
        if (dealLinks.length === 0) {
          $("a").each((_i, el) => {
            const link = $(el);
            const href = link.attr("href") || "";
            if (!href.includes("las-vegas-timeshare.com") || href.includes("#")) return;

            const text = link.text().trim();
            const parentText = link.parent().text().trim();
            const fullText = `${text} ${parentText}`;

            const price = parsePrice(fullText);
            if (!price || price <= 0 || price > 500) return;

            const dealUrl = resolveUrl(href);
            if (processedUrls.has(dealUrl)) return;
            processedUrls.add(dealUrl);

            const duration = parseNights(fullText);
            const resortName = extractResortName(fullText);

            const deal: ScrapedDeal = {
              title: resortName
                ? `${resortName} - Las Vegas`
                : `Las Vegas Getaway`,
              price,
              durationNights: duration?.nights || 2,
              durationDays: duration?.days || 3,
              description: text,
              resortName,
              url: dealUrl,
              city: "Las Vegas",
              state: "NV",
              country: "US",
              brandSlug: "vegas-timeshare",
            };

            storeDeal(deal, "vegas-timeshare")
              .then(() => log.info(`Stored deal: ${deal.title} ($${deal.price})`))
              .catch((err) =>
                log.error(`Failed to store deal: ${err}`)
              );
          });
        }

        // Enqueue promotions page if we're on the homepage
        if (
          request.url === BASE_URL ||
          request.url === `${BASE_URL}/`
        ) {
          await crawler.addRequests([{ url: PROMOS_URL }]);
          log.info("Enqueued promotions listing page");
        }

        // Pagination
        const nextPage = $("a.next, .nav-previous a, .pagination a.next").attr("href");
        if (nextPage) {
          await crawler.addRequests([{ url: resolveUrl(nextPage) }]);
          log.info(`Enqueued next page: ${nextPage}`);
        }
      } else {
        // ── Individual post page: extract richer details ─────────────────
        const title =
          $("h1.entry-title, h1, .post-title").first().text().trim() || "";
        if (!title) return;

        const price = parsePrice(title) || parsePrice($(".entry-content, .post-content, article").text());
        if (!price || price <= 0) return;

        const dealUrl = request.url;
        if (processedUrls.has(dealUrl)) return;
        processedUrls.add(dealUrl);

        const duration = parseNights(title) || parseNights($("article, .entry-content").text());
        const resortName = extractResortName(title);

        const imgEl = $(".entry-content img, .post-content img, article img").first();
        const imgSrc = imgEl.attr("src") || "";
        const imageUrl = imgSrc ? resolveUrl(imgSrc) : undefined;

        // Extract inclusions from bullet points
        const inclusions: string[] = [];
        $(".entry-content li, .post-content li").each((_i, el) => {
          const text = $(el).text().trim();
          if (text && text.length > 5) inclusions.push(text);
        });

        const deal: ScrapedDeal = {
          title: resortName
            ? `${resortName} - Las Vegas`
            : `Las Vegas Getaway - ${duration?.nights || 3} Nights`,
          price,
          durationNights: duration?.nights || 2,
          durationDays: duration?.days || 3,
          description: $(".entry-content p, .post-content p").first().text().trim() || title,
          resortName,
          url: dealUrl,
          imageUrl,
          inclusions: inclusions.length > 0 ? inclusions : undefined,
          city: "Las Vegas",
          state: "NV",
          country: "US",
          brandSlug: "vegas-timeshare",
        };

        storeDeal(deal, "vegas-timeshare")
          .then(() => log.info(`Stored post deal: ${deal.title} ($${deal.price})`))
          .catch((err) =>
            log.error(`Failed to store post deal: ${err}`)
          );
      }
    },
  });

  await crawler.run([PROMOS_URL]);
}

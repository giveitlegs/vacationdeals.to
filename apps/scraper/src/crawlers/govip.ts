import { CheerioCrawler } from "crawlee";
import { storeDeal } from "../storage/deal-store";
import type { ScrapedDeal } from "@vacationdeals/shared";

/**
 * GoVIP crawler (govip.com).
 *
 * STATUS: As of March 2026, govip.com is a parked/placeholder domain
 * registered at Dynadot.com showing "Website coming soon". There are no
 * active vacation packages, deals, or content to scrape.
 *
 * This crawler is written to gracefully detect the parked state and exit,
 * but includes real parsing logic for when the site launches. Based on
 * research of similar vacation package broker sites, we expect GoVIP to
 * follow common patterns:
 *   - Deal cards with destination, price, nights, resort name
 *   - Individual deal detail pages
 *   - Requirements section (age, income, presentation attendance)
 *
 * The crawler will:
 *   1. Fetch the homepage
 *   2. Check if the site is still parked (exit gracefully if so)
 *   3. If active, discover destination pages and scrape deal cards
 *   4. Follow individual deal links for full details
 *
 * Re-check periodically — the domain may launch at any time.
 */

const BASE_URL = "https://www.govip.com";

// ── Helpers ──────────────────────────────────────────────────────────────────

function parsePrice(text: string): number | null {
  const match = text.replace(/,/g, "").match(/\$(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

function parseNights(text: string): { nights: number; days: number } | null {
  let m = text.match(/(\d+)\s*nights?\s*[\/&]\s*(\d+)\s*days?/i);
  if (m) return { nights: parseInt(m[1], 10), days: parseInt(m[2], 10) };

  m = text.match(/(\d+)\s*days?\s*[\/&]\s*(\d+)\s*nights?/i);
  if (m) return { days: parseInt(m[1], 10), nights: parseInt(m[2], 10) };

  m = text.match(/(\d+)\s*nights?/i);
  if (m) {
    const nights = parseInt(m[1], 10);
    return { nights, days: nights + 1 };
  }

  return null;
}

function parseCityState(text: string): { city: string; state?: string; country: string } {
  // "Orlando, FL" or "Cancun, Mexico"
  const parts = text.split(",").map((s) => s.trim());
  const city = parts[0];
  const region = parts[1] || "";

  const stateMap: Record<string, string> = {
    FL: "FL", Florida: "FL",
    NV: "NV", Nevada: "NV",
    SC: "SC", "South Carolina": "SC",
    TN: "TN", Tennessee: "TN",
    MO: "MO", Missouri: "MO",
    VA: "VA", Virginia: "VA",
    CA: "CA", California: "CA",
    TX: "TX", Texas: "TX",
    NY: "NY", "New York": "NY",
    HI: "HI", Hawaii: "HI",
    AZ: "AZ", Arizona: "AZ",
    CO: "CO", Colorado: "CO",
    UT: "UT", Utah: "UT",
  };

  if (stateMap[region]) {
    return { city, state: stateMap[region], country: "US" };
  }
  if (/^[A-Z]{2}$/.test(region)) {
    return { city, state: region, country: "US" };
  }
  return { city, country: region || "US" };
}

// ── Parked domain detector ──────────────────────────────────────────────────

function isParkedDomain(html: string): boolean {
  const parkedIndicators = [
    "website coming soon",
    "domain is for sale",
    "parked free",
    "dynadot",
    "godaddy parking",
    "sedoparking",
    "this domain",
    "domain parking",
    "loading your experience",
    "we're getting things ready",
  ];
  const lower = html.toLowerCase();
  return parkedIndicators.some((indicator) => lower.includes(indicator));
}

// ── Main crawler ─────────────────────────────────────────────────────────────

export async function runGovipCrawler() {
  const processedUrls = new Set<string>();
  let siteIsParked = false;

  const crawler = new CheerioCrawler({
    maxRequestsPerCrawl: 50,
    async requestHandler({ request, $, body, log }) {
      log.info(`Scraping ${request.url}`);

      const html = typeof body === "string" ? body : body.toString();

      // ── Check if domain is parked/placeholder ─────────────────────────
      if (request.url === BASE_URL || request.url === `${BASE_URL}/`) {
        if (isParkedDomain(html)) {
          log.warning(
            "govip.com appears to be a parked/placeholder domain. " +
            "No vacation packages available. Will retry on next scheduled run."
          );
          siteIsParked = true;
          return;
        }
      }

      if (siteIsParked) return;

      // ── Homepage: discover deal cards and destination pages ────────────
      if (request.url === BASE_URL || request.url === `${BASE_URL}/`) {
        // Look for common vacation package card patterns
        const dealCards = $(
          ".deal-card, .package-card, .vacation-deal, " +
          "[class*='deal'], [class*='package'], [class*='offer'], " +
          ".card, .product, .listing"
        );

        if (dealCards.length > 0) {
          log.info(`Found ${dealCards.length} potential deal cards`);

          dealCards.each((_i, el) => {
            const card = $(el);
            try {
              const titleEl = card.find("h2, h3, h4, .title, .deal-title").first();
              const title = titleEl.text().trim();
              if (!title) return;

              const priceText = card.find(
                ".price, .deal-price, .sale-price, [class*='price'], strong"
              ).first().text();
              const price = parsePrice(priceText);
              if (!price || price <= 0) return;

              const linkEl = card.find("a[href]").first();
              const href = linkEl.attr("href") || "";
              const dealUrl = href.startsWith("http")
                ? href
                : `${BASE_URL}${href.startsWith("/") ? "" : "/"}${href}`;

              if (processedUrls.has(dealUrl)) return;
              processedUrls.add(dealUrl);

              // Location
              const locationText = card.find(
                ".location, .destination, .city, [class*='location'], address, p"
              ).first().text().trim();
              const location = locationText
                ? parseCityState(locationText)
                : { city: "Unknown", country: "US" };

              // Duration
              const durationText = card.text();
              const duration = parseNights(durationText) || { nights: 3, days: 4 };

              // Image
              const imgEl = card.find("img").first();
              const imgSrc = imgEl.attr("src") || imgEl.attr("data-src") || "";
              const imageUrl = imgSrc
                ? imgSrc.startsWith("http")
                  ? imgSrc
                  : `${BASE_URL}${imgSrc}`
                : undefined;

              // Resort name
              const resortName = card.find(
                ".resort, .hotel, [class*='resort']"
              ).first().text().trim() || title;

              const deal: ScrapedDeal = {
                title: `${title} - ${location.city}`,
                price,
                durationNights: duration.nights,
                durationDays: duration.days,
                resortName,
                url: dealUrl,
                imageUrl,
                city: location.city,
                state: location.state,
                country: location.country,
                brandSlug: "govip",
              };

              storeDeal(deal, "govip")
                .then(() => log.info(`Stored: ${deal.title} ($${deal.price})`))
                .catch((err) => log.error(`Failed to store ${deal.title}: ${err}`));
            } catch (err) {
              log.error(`Error parsing deal card: ${err}`);
            }
          });
        } else {
          log.info("No deal cards found on homepage — site may not be fully launched yet");
        }

        // Discover destination/deal links
        $('a[href*="deal"], a[href*="package"], a[href*="destination"], a[href*="offer"]').each(
          (_i, el) => {
            const href = $(el).attr("href");
            if (!href) return;
            const fullUrl = href.startsWith("http")
              ? href
              : `${BASE_URL}${href.startsWith("/") ? "" : "/"}${href}`;
            if (!processedUrls.has(fullUrl) && fullUrl.includes("govip.com")) {
              crawler.addRequests([{ url: fullUrl }]).catch(() => {});
            }
          },
        );

        return;
      }

      // ── Individual deal/destination pages ──────────────────────────────
      if (processedUrls.has(request.url)) return;
      processedUrls.add(request.url);

      // Try to extract deal info from individual pages
      const title = $("h1").first().text().trim();
      if (!title) return;

      const bodyText = $("body").text();
      const price = parsePrice(bodyText);
      if (!price || price <= 0) return;

      const duration = parseNights(bodyText) || { nights: 3, days: 4 };

      // Location from breadcrumbs, meta, or text
      const locationText =
        $("meta[name='geo.placename']").attr("content") ||
        $(".breadcrumb, .location, address").first().text().trim() ||
        "";
      const location = locationText
        ? parseCityState(locationText)
        : { city: "Unknown", country: "US" };

      const imageUrl = $("meta[property='og:image']").attr("content") ||
        $(".hero img, .main-image img, .gallery img").first().attr("src") ||
        undefined;

      const inclusions: string[] = [];
      $(".inclusions li, .features li, .package-details li, .includes li").each(
        (_i, el) => {
          const text = $(el).text().trim();
          if (text) inclusions.push(text);
        },
      );

      const deal: ScrapedDeal = {
        title,
        price,
        durationNights: duration.nights,
        durationDays: duration.days,
        url: request.url,
        imageUrl,
        inclusions: inclusions.length > 0 ? inclusions : undefined,
        city: location.city,
        state: location.state,
        country: location.country,
        brandSlug: "govip",
      };

      try {
        await storeDeal(deal, "govip");
        log.info(`Stored: ${deal.title} ($${deal.price})`);
      } catch (err) {
        log.error(`Failed to store ${deal.title}: ${err}`);
      }
    },
  });

  await crawler.run([BASE_URL]);

  if (siteIsParked) {
    console.log(
      "[GoVIP] Site is currently parked/inactive. No deals scraped. " +
      "Will check again on next scheduled run."
    );
  }
}

import { CheerioCrawler } from "crawlee";
import { storeDeal } from "../storage/deal-store";

const SOURCE_KEY = "discover-branson";
const BASE_URL = "https://www.discoverbranson.com";
const SPECIAL_URL = `${BASE_URL}/branson-special`;
const OFFERS_URL = "https://offers.discoverbranson.com/branson-vacation-package/";
const PACKAGES_URL = `${BASE_URL}/packages`;

// DiscoverBranson.com (Branson Shows & Attractions LLC) sells both gated
// preview packages and plain retail packages:
//   /branson-special        — $99 Stone Castle Hotel 4d/3n, requires 2-hour
//                             travel savings preview ("$599 Value. Your Price:
//                             Only $99" in body text, inclusions in ul.fa-ul).
//   offers subdomain        — $79 Super Saver 4d/3n (Elementor page; price in
//                             h2 "…Just $79!", "$650 Value for Only $79").
//   /packages               — ~8 retail packages, Bootstrap .single-product
//                             cards with .fs-3 price + line-through original.
//                             NO presentation requirement on these.
// DOM-verified only: every price below is re-read from the live page text.

function parsePrice(text: string): number {
  const m = text.match(/\$([\d,]+)/);
  return m ? parseInt(m[1].replace(/,/g, ""), 10) : NaN;
}

function validPrice(price: number): boolean {
  return Number.isFinite(price) && price >= 39 && price <= 5000;
}

export async function runDiscoverBransonCrawler() {
  const crawler = new CheerioCrawler({
    maxRequestsPerCrawl: 5,
    maxRequestRetries: 2,
    requestHandlerTimeoutSecs: 30,
    async requestHandler({ request, $, log }) {
      log.info(`Processing ${request.url}`);
      let stored = 0;
      const pending: Promise<unknown>[] = [];
      const bodyText = $("body").text().replace(/\s+/g, " ");

      if (request.url.includes("branson-special")) {
        // "$599 Value. Your Price: Only $99 for all 3 nights"
        const priceMatch = bodyText.match(/Your Price:\s*Only\s*\$([\d,]+)/i);
        const originalMatch = bodyText.match(/\$([\d,]+)\s*Value/i);
        const price = priceMatch ? parseInt(priceMatch[1].replace(/,/g, ""), 10) : NaN;
        const original = originalMatch ? parseInt(originalMatch[1].replace(/,/g, ""), 10) : NaN;
        if (validPrice(price)) {
          // First fa-ul list is "Your Getaway Includes"
          const inclusions: string[] = [];
          $("ul.fa-ul")
            .filter((_, ul) => /Lodging/i.test($(ul).text()))
            .first()
            .find("li")
            .each((_, li) => {
              const t = $(li).text().replace(/\s+/g, " ").trim();
              if (t && !/Your Price/i.test(t)) inclusions.push(t);
            });

          const resortName = /Stone Castle Hotel/i.test(bodyText) ? "Stone Castle Hotel" : undefined;
          pending.push(
            storeDeal(
              {
                title: `Branson $${price} Special — 4 Days / 3 Nights${resortName ? ` at ${resortName}` : ""}`,
                price,
                originalPrice: validPrice(original) && original > price ? original : undefined,
                durationNights: 3,
                durationDays: 4,
                city: "Branson",
                state: "MO",
                country: "US",
                brandSlug: SOURCE_KEY,
                url: SPECIAL_URL,
                resortName,
                inclusions: inclusions.length ? inclusions : undefined,
                presentationMinutes: 120,
                requirements: ["Attend a 2-hour travel savings preview"],
              },
              SOURCE_KEY,
            ),
          );
          stored++;
        }
      } else if (request.url.includes("offers.discoverbranson.com")) {
        // h2 "Branson Super Saver – 4 Days of Fun for Just $79!"
        let price = NaN;
        $("h2.elementor-heading-title, h2").each((_, h) => {
          const m = $(h).text().match(/Just\s*\$([\d,]+)/i);
          if (m && !Number.isFinite(price)) price = parseInt(m[1].replace(/,/g, ""), 10);
        });
        if (validPrice(price)) {
          // "$650 Value for Only $79"
          const originalMatch = bodyText.match(/\$([\d,]+)\s*Value for Only/i);
          const nightsMatch = bodyText.match(/(\d+)\s*Days?\s*(\d+)\s*Nights?/i);
          const nights = nightsMatch ? parseInt(nightsMatch[2], 10) : 3;
          const inclusions: string[] = [];
          if (/VIP show tickets/i.test(bodyText)) inclusions.push("2 VIP show tickets");
          if (/\$50 Gift Card/i.test(bodyText)) inclusions.push("$50 gift card");
          inclusions.push(`${nights} nights hotel lodging`);

          pending.push(
            storeDeal(
              {
                title: `Branson Super Saver — ${nights + 1} Days / ${nights} Nights for $${price}`,
                price,
                originalPrice: originalMatch ? parseInt(originalMatch[1].replace(/,/g, ""), 10) : undefined,
                durationNights: nights,
                durationDays: nights + 1,
                city: "Branson",
                state: "MO",
                country: "US",
                brandSlug: SOURCE_KEY,
                url: OFFERS_URL,
                inclusions,
                presentationMinutes: 120,
                requirements: ["Resort preview required"],
              },
              SOURCE_KEY,
            ),
          );
          stored++;
        }
      } else {
        // /packages — retail cards, no presentation requirement.
        $(".single-product").each((_, el) => {
          const card = $(el);
          const titleLink = card.find(".product-info a").first();
          const title = titleLink.text().replace(/\s+/g, " ").trim();
          const href = titleLink.attr("href");
          if (!title || !href) return;

          const price = parsePrice(card.find(".fs-3").first().text());
          if (!validPrice(price)) {
            log.warning(`[${SOURCE_KEY}] Skipping "${title}" — no valid price`);
            return;
          }
          const original = parsePrice(card.find(".text-decoration-line-through").first().text());

          const desc = card.find(".small.lh-sm").first().text().replace(/\s+/g, " ").trim();
          // "4 days and 3 nights" / "3-night" in the excerpt; default 3.
          const nightsMatch = desc.match(/(\d+)\s*days?\s*and\s*(\d+)\s*nights?/i) || desc.match(/(\d+)[-\s]night/i);
          const nights = nightsMatch ? parseInt(nightsMatch[2] ?? nightsMatch[1], 10) : 3;

          const img = card.find(".product-image img").first().attr("src");

          pending.push(
            storeDeal(
              {
                title: `${title} — Branson Vacation Package`,
                price,
                originalPrice: validPrice(original) && original > price ? original : undefined,
                durationNights: nights,
                durationDays: nights + 1,
                description: desc || undefined,
                city: "Branson",
                state: "MO",
                country: "US",
                brandSlug: SOURCE_KEY,
                url: href.startsWith("http") ? href : `${BASE_URL}${href}`,
                imageUrl: img ? (img.startsWith("http") ? img : `${BASE_URL}${img}`) : undefined,
              },
              SOURCE_KEY,
            ),
          );
          stored++;
        });
      }

      await Promise.all(pending);
      if (stored === 0) {
        log.warning(`[${SOURCE_KEY}] No DOM-verified deals found; emitting 0 (${request.url})`);
      } else {
        log.info(`[${SOURCE_KEY}] Stored ${stored} deals from ${request.url}`);
      }
    },
  });

  await crawler.run([SPECIAL_URL, OFFERS_URL, PACKAGES_URL]);
}

import { CheerioCrawler } from "crawlee";
import { storeDeal } from "../storage/deal-store";

const SOURCE_KEY = "cheap-vacation-getaways";
const BASE_URL = "https://cheapvacationgetaways.net";

// cheapvacationgetaways.net is a GoDaddy Website Builder site (verified
// 2026-07-20) selling Club Exploria preview packages. Each package page
// carries a headline like:
//   "3 Days & 2 Nights In the Poconos starting at $99*"
//   "3 Days & 2 Nights Summer Bay Orlando starting at 49*"   (note: no $)
// plus body copy with the retail value ("retail value of this stay ranges
// from $318 - $788") and the 90-minute Club Exploria presentation terms.
// The homepage is only a link seed; deals are stored from package pages whose
// headline matches DEAL_RE and whose destination we can place.
const DEAL_RE =
  /(\d+)\s*Days?\s*(?:&|and)\s*(\d+)\s*Nights?\s+(.{3,60}?)\s*starting at\s*\$?\s*(\d{2,4})/i;
const RETAIL_RE = /retail value of this (?:stay|offer)[^$]{0,60}\$\s?([\d,]+)/i;

// Pages that are never package pages.
const SKIP_PATHS =
  /^\/(?:$|privacy-policy|contact-us|reservation-request|m\/|dnc|zoom-to-up-one-travel|manifest)/i;

function placeFromDescriptor(
  descriptor: string,
): { city: string; state: string; resort?: string } | null {
  if (/pocono mountain villas/i.test(descriptor))
    return { city: "Pocono Mountains", state: "PA", resort: "Pocono Mountain Villas by Exploria" };
  if (/pocono/i.test(descriptor)) return { city: "Pocono Mountains", state: "PA" };
  if (/shawnee/i.test(descriptor))
    return { city: "Pocono Mountains", state: "PA", resort: "Shawnee Village Resort" };
  if (/summer bay/i.test(descriptor))
    return { city: "Orlando", state: "FL", resort: "Summer Bay Orlando" };
  if (/orlando/i.test(descriptor)) return { city: "Orlando", state: "FL" };
  return null;
}

export async function runCheapVacationGetawaysCrawler() {
  const crawler = new CheerioCrawler({
    maxRequestsPerCrawl: 10,
    maxRequestRetries: 2,
    requestHandlerTimeoutSecs: 30,
    async requestHandler({ request, $, log, crawler: c }) {
      log.info(`Processing ${request.url}`);

      // Enqueue internal package pages from any crawled page (homepage nav
      // links /pocono-mountain-villas, /summer-bay-orlando, and any future
      // resort pages like Shawnee Village).
      const seen = new Set<string>();
      $("a[href^='/']").each((_, el) => {
        const href = ($(el).attr("href") || "").split("#")[0].split("?")[0];
        if (!href || SKIP_PATHS.test(href) || seen.has(href)) return;
        seen.add(href);
      });
      if (seen.size > 0) {
        await c.addRequests([...seen].map((p) => `${BASE_URL}${p}`));
      }

      // Homepage is a link seed only — its CTA button repeats the Pocono price.
      if (request.url.replace(/\/$/, "") === BASE_URL) return;

      const pageText = $("body").text().replace(/\s+/g, " ");
      const dealMatch = pageText.match(DEAL_RE);
      if (!dealMatch) {
        log.info(`[${SOURCE_KEY}] No package headline on ${request.url} — storing nothing`);
        return;
      }

      const days = parseInt(dealMatch[1], 10);
      const nights = parseInt(dealMatch[2], 10);
      const descriptor = dealMatch[3].trim();
      const price = parseInt(dealMatch[4], 10);
      if (!Number.isFinite(price) || price < 39 || price > 5000) {
        log.warning(`[${SOURCE_KEY}] Implausible price $${price} on ${request.url}`);
        return;
      }

      const place = placeFromDescriptor(descriptor) ?? placeFromDescriptor(pageText.slice(0, 2000));
      if (!place) {
        log.warning(`[${SOURCE_KEY}] Cannot place destination for "${descriptor}" — skipping`);
        return;
      }

      const retailMatch = pageText.match(RETAIL_RE);
      const originalPrice = retailMatch
        ? parseInt(retailMatch[1].replace(/,/g, ""), 10)
        : undefined;

      const imageUrl = $("meta[property='og:image']").attr("content");

      storeDeal(
        {
          title: `${place.resort ?? place.city} — ${days} Day / ${nights} Night Getaway from $${price}`,
          price,
          originalPrice: originalPrice && originalPrice > price ? originalPrice : undefined,
          savingsPercent:
            originalPrice && originalPrice > price
              ? Math.round(((originalPrice - price) / originalPrice) * 100)
              : undefined,
          durationNights: nights,
          durationDays: days,
          city: place.city,
          state: place.state,
          country: "US",
          brandSlug: SOURCE_KEY,
          url: request.url,
          resortName: place.resort,
          imageUrl,
          inclusions: ["Resort accommodations for up to 4 guests"],
          presentationMinutes: 90,
          requirements: ["Attend a 90-minute Club Exploria timeshare presentation"],
        },
        SOURCE_KEY,
      );
      log.info(`[${SOURCE_KEY}] Stored ${place.resort ?? place.city} @ $${price}`);
    },
  });

  await crawler.run([BASE_URL, `${BASE_URL}/pocono-mountain-villas`]);
}

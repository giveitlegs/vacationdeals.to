import { CheerioCrawler } from "crawlee";
import { storeDeal } from "../storage/deal-store";

const SOURCE_KEY = "magical-getaway";
const BASE_URL = "https://deals.magicalgetaway.com";

// deals.magicalgetaway.com is a WordPress/Elementor landing page selling
// Westgate Resorts Orlando inventory (verified 2026-07-20). The single offer
// is rendered as a text-editor price breakdown:
//   "4-Day/3-Night Resort Stay ......... $589"
//   "Cash Back ......................... $100"
//   "Total for stay PLUS gift .......... $99"
// A separate "5 days and 4 Nights" raffle blurb on the page is NOT the deal —
// anchor strictly on the breakdown lines. Deal is Westgate inventory, so it
// links to the existing westgate brand. DOM-verified only: if the breakdown
// disappears, store nothing.
const PRICE_RE = /Total for stay PLUS gift[^$]{0,120}\$\s?(\d{2,4})/i;
const ORIGINAL_RE = /(\d+)-Day\/(\d+)-Night Resort Stay[^$]{0,120}\$\s?(\d{2,4})/i;
const CASHBACK_RE = /Cash Back[^$]{0,120}\$\s?(\d{2,4})/i;

export async function runMagicalGetawayCrawler() {
  const crawler = new CheerioCrawler({
    maxRequestsPerCrawl: 3,
    maxRequestRetries: 2,
    requestHandlerTimeoutSecs: 30,
    async requestHandler({ request, $, log }) {
      log.info(`Processing ${request.url}`);

      const pageText = $("body").text().replace(/\s+/g, " ");

      const priceMatch = pageText.match(PRICE_RE);
      if (!priceMatch) {
        log.warning(`[${SOURCE_KEY}] Price breakdown not found on page — storing nothing`);
        return;
      }
      const price = parseInt(priceMatch[1], 10);
      if (!Number.isFinite(price) || price < 39 || price > 5000) {
        log.warning(`[${SOURCE_KEY}] Implausible price $${price} — storing nothing`);
        return;
      }

      const originalMatch = pageText.match(ORIGINAL_RE);
      const days = originalMatch ? parseInt(originalMatch[1], 10) : 4;
      const nights = originalMatch ? parseInt(originalMatch[2], 10) : 3;
      const originalPrice = originalMatch ? parseInt(originalMatch[3], 10) : undefined;

      const cashbackMatch = pageText.match(CASHBACK_RE);
      const inclusions = ["Westgate resort accommodations", "Resort discovery tour"];
      if (cashbackMatch) inclusions.splice(1, 0, `$${cashbackMatch[1]} cash back`);

      const imageUrl = $("meta[property='og:image']").attr("content");

      await storeDeal(
        {
          title: `Orlando Magical Getaway — $${price} ${days} Day / ${nights} Night Westgate Resort Stay`,
          price,
          originalPrice: originalPrice && originalPrice > price ? originalPrice : undefined,
          savingsPercent:
            originalPrice && originalPrice > price
              ? Math.round(((originalPrice - price) / originalPrice) * 100)
              : undefined,
          durationNights: nights,
          durationDays: days,
          city: "Orlando",
          state: "FL",
          country: "US",
          brandSlug: "westgate", // Westgate-operated inventory — existing brand
          url: BASE_URL,
          imageUrl,
          inclusions,
          presentationMinutes: 120,
          requirements: ["Attend a Westgate resort discovery tour"],
        },
        SOURCE_KEY,
      );
      log.info(`[${SOURCE_KEY}] Stored Orlando deal @ $${price} (was $${originalPrice ?? "?"})`);
    },
  });

  await crawler.run([BASE_URL]);
}

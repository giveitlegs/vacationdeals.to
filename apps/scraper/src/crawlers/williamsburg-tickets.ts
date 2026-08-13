import { CheerioCrawler } from "crawlee";
import { storeDeal } from "../storage/deal-store";

const SOURCE_KEY = "williamsburg-tickets";
const BASE_URL = "https://williamsburgtickets.com";
const PACKAGES_URL = `${BASE_URL}/williamsburg-getaway/`;

// WilliamsburgTickets.com ("Williamsburg Tickets") sells ONE gated preview
// package — the "Williamsburg Getaway" at King's Creek Resort, Williamsburg VA —
// marketed across several landing pages (busch-gardens-tickets,
// colonial-williamsburg-tickets, water-country-tickets, free-100-visa-gift-card)
// that all funnel to the same $199 getaway. The site is an Artisteer WordPress
// theme (art-* classes); post body lives in `.art-postcontent.entry-content`.
//
// The getaway page states the buy price in prose:
//   "...3 relaxing nights for only $199 + tax. This is the total package cost,
//    not per person..." and "...your choice of 2 tickets to either Busch Gardens,
//    Water Country USA or Colonial Williamsburg... a $100 VISA gift card instead
//    of tickets..."
//
// PRICE-BUG guard: the PACKAGE price is the "$199 + tax" / "total package cost"
// figure. The "$100 VISA gift card" is an inclusion/alternative, NOT the price;
// the Busch Gardens / Water Country / Colonial Williamsburg tickets are inclusion
// VALUES, never the price. parsePackagePrice() only accepts a $ figure adjacent to
// "+ tax" / "total package cost" and explicitly rejects 100 (the gift-card trap).
//
// DEEP-CRAWL: the single $199 package is emitted as one variant per ticket choice
// (each ticket option the DOM lists, plus the $100-gift-card option), every variant
// carrying a unique #fragment url so deal-store's URL-keyed upsert keeps them
// distinct. All variant facts are read from the live getaway-page DOM.

function parsePackagePrice(text: string): number {
  // Prefer a $ figure tied to "+ tax" or "total package cost"; both frame the
  // buy price on this page. Never the $100 gift card / ticket values.
  const taxMatch = text.match(/\$([\d,]+)\s*\+\s*tax/i);
  if (taxMatch) return parseInt(taxMatch[1].replace(/,/g, ""), 10);
  const costMatch = text.match(/\$([\d,]+)[^.]{0,40}total package cost/i);
  if (costMatch) return parseInt(costMatch[1].replace(/,/g, ""), 10);
  return NaN;
}

function validPrice(price: number): boolean {
  // Reject 100 outright — that is the VISA gift-card amount, not the package.
  return Number.isFinite(price) && price !== 100 && price >= 39 && price <= 5000;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function cleanLine(text: string): string {
  return text
    .replace(/\s+/g, " ")
    .replace(/^[^\w$]+/, "")
    .trim();
}

export async function runWilliamsburgTicketsCrawler() {
  const crawler = new CheerioCrawler({
    maxRequestsPerCrawl: 100,
    maxRequestRetries: 2,
    requestHandlerTimeoutSecs: 30,
    preNavigationHooks: [
      async (_ctx, gotOptions) => {
        gotOptions.headers = {
          ...(gotOptions.headers || {}),
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9",
        };
      },
    ],
    async requestHandler({ request, $, log }) {
      log.info(`Processing ${request.url}`);
      let stored = 0;
      const pending: Promise<unknown>[] = [];

      // Post body only — avoid nav/meta $ figures.
      const $body = $(".art-postcontent, .entry-content").first();
      const bodyText = ($body.text() || $("body").text() || "")
        .replace(/\s+/g, " ")
        .trim();

      const price = parsePackagePrice(bodyText);
      if (!validPrice(price)) {
        log.warning(
          `[${SOURCE_KEY}] No DOM-verified package price on ${request.url}; emitting 0`,
        );
        return;
      }

      // Duration: "4 ... days and 3 ... nights" (fall back to 4D/3N).
      const durMatch = bodyText.match(/(\d+)\s*days?\s*(?:and|\/)\s*(\d+)\s*nights?/i);
      const nightsOnly = bodyText.match(/(\d+)\s*(?:relaxing\s*)?nights?/i);
      const durationNights = durMatch
        ? parseInt(durMatch[2], 10)
        : nightsOnly
          ? parseInt(nightsOnly[1], 10)
          : 3;
      const durationDays = durMatch ? parseInt(durMatch[1], 10) : durationNights + 1;

      // Ticket choices, derived from the DOM copy:
      // "your choice of 2 tickets to either Busch Gardens, Water Country USA or
      //  Colonial Williamsburg".
      const choiceSentence =
        bodyText.match(/choice of 2 tickets to (?:either\s*)?([^.]{5,160})/i)?.[1] ||
        "";
      const ticketNames = choiceSentence
        .split(/,| or | and /i)
        .map((t) => cleanLine(t))
        .filter((t) => t.length > 2 && !/tickets?$/i.test(t) && !/gift card/i.test(t));

      // Has a $100 VISA gift-card alternative? (DOM-verified.)
      const hasGiftCard = /\$100\s*visa gift card/i.test(bodyText);

      // Base inclusions common to every variant (all read from body prose).
      const baseInclusions: string[] = ["3 nights lodging (accommodates 2 adults + up to 2 children)"];
      if (/complimentary hot breakfast|hot breakfast/i.test(bodyText))
        baseInclusions.push("Complimentary hot breakfast daily");
      if (/pool/i.test(bodyText)) baseInclusions.push("Pool access");
      if (/fitness/i.test(bodyText)) baseInclusions.push("Fitness room");
      if (/wi-?fi/i.test(bodyText)) baseInclusions.push("Free WiFi");

      // Featured / cottage image from post body.
      const img = $body
        .find("img")
        .filter((_i, el) => /uploads/i.test($(el).attr("src") || ""))
        .first()
        .attr("src");
      const imageUrl = img
        ? img.startsWith("http")
          ? img
          : `${BASE_URL}${img}`
        : undefined;

      // Build one variant per ticket choice + a gift-card variant.
      type Variant = { key: string; label: string; inclusion: string };
      const variants: Variant[] = ticketNames.map((name) => ({
        key: slugify(name),
        label: name,
        inclusion: `2 free ${name} tickets${hasGiftCard ? " (or $100 VISA gift card in lieu of tickets)" : ""}`,
      }));
      if (hasGiftCard) {
        variants.push({
          key: "visa-gift-card",
          label: "$100 VISA Gift Card",
          inclusion: "$100 VISA gift card (in lieu of tickets)",
        });
      }
      // Safety net: if the DOM copy shape ever changes, still emit the base package.
      if (variants.length === 0) {
        variants.push({ key: "package", label: "Getaway", inclusion: "Choice of 2 attraction tickets or $100 VISA gift card" });
      }

      const description =
        `${durationDays}-day / ${durationNights}-night Williamsburg, VA getaway at King's Creek Resort for $${price} + tax (total package cost, not per person). ` +
        `Includes lodging plus your choice of 2 attraction tickets or a $100 VISA gift card, in exchange for attending a 90-120 minute guided resort tour.`;

      for (const v of variants) {
        pending.push(
          storeDeal(
            {
              title: `Williamsburg Getaway — ${v.label} (${durationDays} Days / ${durationNights} Nights)`,
              price,
              durationNights,
              durationDays,
              description,
              resortName: "King's Creek Resort",
              city: "Williamsburg",
              state: "VA",
              country: "US",
              brandSlug: SOURCE_KEY,
              url: `${PACKAGES_URL}#${v.key}`,
              imageUrl,
              inclusions: [v.inclusion, ...baseInclusions],
              presentationMinutes: 120,
              requirements: ["Attend a 90-120 minute guided resort tour"],
            },
            SOURCE_KEY,
          ),
        );
        stored++;
      }

      await Promise.all(pending);
      if (stored === 0) {
        log.warning(`[${SOURCE_KEY}] No DOM-verified deals found; emitting 0 (${request.url})`);
      } else {
        log.info(`[${SOURCE_KEY}] Stored ${stored} deals from ${request.url}`);
      }
    },
  });

  await crawler.run([PACKAGES_URL]);
}

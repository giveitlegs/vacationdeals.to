import { CheerioCrawler } from "crawlee";
import { storeDeal } from "../storage/deal-store";

const SOURCE_KEY = "vallarta-sales";
const BASE_URL = "https://vallartasales.com";
const PACKAGES_URL = `${BASE_URL}/packages/`;

// VallartaSales.com sells gated "vacation ownership presentation" packages for
// Paradise Village Beach Resort in Nuevo Vallarta (Nayarit, MX). All plans live
// on the single /packages/ page: each is a WPBakery/Codevz ".cz_wpe_content"
// block whose <h2 style="color: #ffbc1f;"> holds the plan name plus a blue
// <span> reading "Price $799 USD Total price". The days/nights line sits in a
// <p><strong> just before the h2 ("6 days /5 Night"), and the inclusion bullets
// are the <p> tags after it. Verified live plans (2 adults + 2 kids under 12):
//   All Inclusive        6d/5n  $799  (regular rate $1,266)
//   European Plan        6d/5n  $429  (room only)
//   European Plan        5d/4n  $349  (room only)
//   Buffet Breakfast     6d/5n  $599  (+ "$200 dlls certificate" — NOT the price)
//   Golf & Spa           8d/7n  $989
// DOM-verified only: every price below is re-read from the live page's h2 span.
//
// PRICE-BUG GUARDS: parse only the "Price $X USD" figure inside the plan's h2 —
// never the "Regular rate $1,266" (that's originalPrice) nor the "$200 dlls
// certificate" resort-credit line (Buffet plan). Each plan gets a unique
// #fragment URL because deal-store upserts match on URL and all 5 share a page.

function parsePrice(text: string): number {
  const m = text.match(/\$([\d,]+)/);
  return m ? parseInt(m[1].replace(/,/g, ""), 10) : NaN;
}

// Mexico all-inclusives run higher than US preview packages.
function validPrice(price: number): boolean {
  return Number.isFinite(price) && price >= 39 && price <= 9999;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const NOISE =
  /^Taxes included$|Regular rate|SPECIAL PROMOTION|Limited Promotion|Other room categories|The vacation shown|^\s*$|days?\s*\/?\s*\d+\s*Night|Price\s*\$/i;

const REQUIREMENTS = [
  "Attend a ~120-minute vacation ownership presentation",
  "Married couples 28-72 or single women 30-70; combined income $50K USD; single men ineligible",
];

export async function runVallartaSalesCrawler() {
  const crawler = new CheerioCrawler({
    maxRequestsPerCrawl: 60,
    maxRequestRetries: 2,
    requestHandlerTimeoutSecs: 30,
    async requestHandler({ request, $, log, enqueueLinks }) {
      log.info(`Processing ${request.url}`);
      let stored = 0;
      const pending: Promise<unknown>[] = [];
      const seenUrls = new Set<string>();

      $(".cz_wpe_content").each((_, el) => {
        const box = $(el);

        // Each plan's h2 carries "…Price $X USD…". Non-plan h2s are skipped.
        const h2 = box
          .find("h2")
          .filter((_, h) => /Price\s*\$/i.test($(h).text()))
          .first();
        if (!h2.length) return;

        // Plan name = h2 text minus the price/label spans (e.g. "Golf & Spa Package").
        const title = h2
          .clone()
          .find("span, strong, br")
          .remove()
          .end()
          .text()
          .replace(/\s+/g, " ")
          .trim();

        // Price ONLY from the h2's "Price $X USD" span — never a credit/regular-rate figure.
        const priceSpan = h2
          .find("span")
          .filter((_, s) => /Price/i.test($(s).text()))
          .first();
        const price = parsePrice((priceSpan.length ? priceSpan : h2).text());
        if (!validPrice(price)) {
          log.warning(`[${SOURCE_KEY}] Skipping "${title || "unknown plan"}" — no valid price`);
          return;
        }

        // "6 days /5 Night" line precedes the h2 within the same block.
        const daysLine = box
          .find("p")
          .filter((_, p) => /days?\s*\/?\s*\d+\s*Night/i.test($(p).text()))
          .first()
          .text();
        const dnMatch = daysLine.match(/(\d+)\s*days?\s*\/?\s*(\d+)\s*Night/i);
        const durationDays = dnMatch ? parseInt(dnMatch[1], 10) : NaN;
        const durationNights = dnMatch ? parseInt(dnMatch[2], 10) : NaN;
        if (!Number.isFinite(durationNights) || !Number.isFinite(durationDays)) {
          log.warning(`[${SOURCE_KEY}] Skipping "${title}" — could not parse days/nights`);
          return;
        }

        // "Regular rate $1,266" (All Inclusive) is the strike-through original price.
        const regularMatch = box
          .find("p")
          .filter((_, p) => /Regular rate/i.test($(p).text()))
          .first()
          .text()
          .match(/Regular rate\s*\$([\d,]+)/i);
        const original = regularMatch ? parseInt(regularMatch[1].replace(/,/g, ""), 10) : NaN;
        const originalPrice = validPrice(original) && original > price ? original : undefined;
        const savingsPercent = originalPrice
          ? Math.round((1 - price / originalPrice) * 100)
          : undefined;

        // Inclusion bullets = the remaining <p> tags (drops taxes/promo/regular-rate noise).
        const inclusions: string[] = [];
        box.find("p, li").each((_, p) => {
          const t = $(p).text().replace(/\s+/g, " ").trim();
          if (t && !NOISE.test(t)) inclusions.push(t);
        });

        // Image lives in the sibling column of the same row.
        const img = box.closest(".vc_row, .wpb_row").find("img").first().attr("src");
        const imageUrl = img ? (img.startsWith("http") ? img : `${BASE_URL}${img}`) : undefined;

        // All 5 plans share /packages/ — unique #fragment so upserts don't collide.
        const planSlug = `${slugify(title)}-${durationNights}n-${durationDays}d`;
        const url = `${PACKAGES_URL}#${planSlug}`;
        if (seenUrls.has(url)) return;
        seenUrls.add(url);

        pending.push(
          storeDeal(
            {
              title: `Paradise Village ${title} — ${durationDays} Days / ${durationNights} Nights for $${price}`,
              price,
              originalPrice,
              durationNights,
              durationDays,
              description:
                `${title} package at Paradise Village Beach Resort, Nuevo Vallarta — ` +
                `${durationDays} days / ${durationNights} nights for 2 adults + 2 kids under 12.`,
              resortName: "Paradise Village Beach Resort",
              url,
              imageUrl,
              inclusions: inclusions.length ? inclusions : undefined,
              requirements: REQUIREMENTS,
              presentationMinutes: 120,
              savingsPercent,
              city: "Nuevo Vallarta",
              state: "Nayarit",
              country: "MX",
              brandSlug: SOURCE_KEY,
            },
            SOURCE_KEY,
          ),
        );
        stored++;
      });

      // Best-effort: follow any additional package/offer pages within the domain.
      await enqueueLinks({
        selector: "a[href*='package'], a[href*='offer'], a[href*='promo']",
        baseUrl: BASE_URL,
        globs: [`${BASE_URL}/**`],
      });

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

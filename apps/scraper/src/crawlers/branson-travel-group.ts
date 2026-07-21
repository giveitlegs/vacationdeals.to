import { CheerioCrawler } from "crawlee";
import { storeDeal } from "../storage/deal-store";

const SOURCE_KEY = "branson-travel-group";
const LIST_URL = "https://bransontravelgroup.com/browse-branson-vacation-packages/";

// BransonTravelGroup.com (WordPress/Ignition theme). Listing page cards:
//   .entry-item
//     .entry-meta .entry-duration   — "4 DAYS & 3 NIGHTS" (absent on
//                                     ticket-only / no-lodging entries)
//     .entry-meta .entry-price      — "From $299" / "Only $399" / "$399"
//     h2.entry-item-title a         — title + unique /package/... href
// Package detail pages sit behind a SiteGround captcha, so ONLY the listing
// page is crawled. Entries titled "Entertainment" with no nights are ticket
// bundles — skipped. The Christmas package lists a price but no duration on
// the card; it is a lodging getaway, stored with a conservative 2-night
// default.
const DEFAULT_NIGHTS = 2;

function parsePrice(text: string): number {
  const m = text.match(/\$\s*([\d,]+)/);
  return m ? parseInt(m[1].replace(/,/g, ""), 10) : NaN;
}

function validPrice(price: number): boolean {
  return Number.isFinite(price) && price >= 39 && price <= 5000;
}

export async function runBransonTravelGroupCrawler() {
  const crawler = new CheerioCrawler({
    maxRequestsPerCrawl: 3,
    maxRequestRetries: 2,
    requestHandlerTimeoutSecs: 30,
    async requestHandler({ request, $, log }) {
      log.info(`Processing ${request.url}`);
      let stored = 0;
      const pending: Promise<unknown>[] = [];

      $(".entry-item").each((_, el) => {
        const card = $(el);
        const titleLink = card.find(".entry-item-title a").first();
        const rawTitle = titleLink.text().replace(/\s+/g, " ").trim();
        const href = titleLink.attr("href");
        if (!rawTitle || !href) return;

        const price = parsePrice(card.find(".entry-price").first().text());
        if (!validPrice(price)) {
          log.warning(`[${SOURCE_KEY}] Skipping "${rawTitle}" — no valid price`);
          return;
        }

        // "4 DAYS & 3 NIGHTS" / "4 DAYS / 3 NIGHTS" / "4 Days 3 Nights" —
        // check the meta span first, then the title itself.
        const durSource = `${card.find(".entry-duration").text()} ${rawTitle}`;
        const durMatch = durSource.match(/(\d+)\s*Days?\s*(?:&(?:amp;)?|\/|and)?\s*(\d+)\s*Nights?/i);

        let nights: number;
        if (durMatch) {
          nights = parseInt(durMatch[2], 10);
        } else if (/entertainment/i.test(rawTitle)) {
          // Ticket-only bundle, no lodging — skip.
          log.info(`[${SOURCE_KEY}] Skipping "${rawTitle}" — no lodging nights`);
          return;
        } else {
          nights = DEFAULT_NIGHTS;
        }

        // Strip price/duration suffixes from titles like
        // "Silver Dollar City Couples Getaway Package | $399" and
        // "Branson Christmas Package – … (Only $199)".
        const title = rawTitle
          .replace(/\s*\(Only\s*\$[\d,]+\)\s*$/i, "")
          .split("|")[0]
          .trim();

        // Real image URL lives in the lazyload <noscript> fallback.
        let img = card.find(".entry-item-thumb img").first().attr("src");
        if (!img || img.startsWith("data:")) {
          const noscript = card.find("noscript").first().html() || "";
          const m = noscript.match(/src="(https?:\/\/[^"]+)"/);
          img = m ? m[1] : undefined;
        }

        pending.push(
          storeDeal(
            {
              title: `${title} — Branson, MO`,
              price,
              durationNights: nights,
              durationDays: nights + 1,
              city: "Branson",
              state: "MO",
              country: "US",
              brandSlug: SOURCE_KEY,
              url: href,
              imageUrl: img,
              requirements: ["Certain restrictions apply — call for details"],
            },
            SOURCE_KEY,
          ),
        );
        stored++;
      });

      await Promise.all(pending);
      if (stored === 0) {
        log.warning(`[${SOURCE_KEY}] No DOM-verified deals found; emitting 0`);
      } else {
        log.info(`[${SOURCE_KEY}] Stored ${stored} packages`);
      }
    },
  });

  await crawler.run([LIST_URL]);
}

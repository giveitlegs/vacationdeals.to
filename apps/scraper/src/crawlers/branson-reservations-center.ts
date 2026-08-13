import { CheerioCrawler } from "crawlee";
import { storeDeal } from "../storage/deal-store";

const SOURCE_KEY = "branson-reservations-center";
const BASE_URL = "https://bransonreservationscenter.com";
const PACKAGES_URL = `${BASE_URL}/vacation-packages/`;

// BransonReservationsCenter.com (Branson Reservations Center, Branson MO) sells
// gated preview packages. /vacation-packages lists 6 Branson bundles, each built
// with the "Image Card Content Box" Elementor widget
// (.elementor-widget-ucaddon_image_card_content_box):
//   - title  : span.uc_style_image_card_content_box_elementor_title
//   - content: span.uc_style_image_card_content_box_elementor_content
//              (bullet inclusions, then "NOW ONLY $419" rack price, then
//               "Call about getting this package for $99." promotional price)
//   - image  : .uc_classic_content_placeholder img
//
// PRICE-BUG guard: the "$99" ("getting this package for $X") is the PACKAGE
// price; the "NOW ONLY $419" is the rack/retail value -> originalPrice. The
// "2 Adult ... Tickets" and "One Branson Guest Card" are INCLUSIONS, never the
// price. When only a "NOW ONLY $X" figure exists (Branson Fun Trip = $89) that
// IS the package price and there is no original.
//
// Orlando / Williamsburg / Las Vegas appear ONLY in the page's Terms & Conditions
// (income/age qualifications) with NO published price, so — DOM-verified only —
// they are not emitted. Every price below is re-read from the live card text.

function parsePrice(text: string): number {
  const m = text.match(/\$([\d,]+)/);
  return m ? parseInt(m[1].replace(/,/g, ""), 10) : NaN;
}

function validPrice(price: number): boolean {
  return Number.isFinite(price) && price >= 39 && price <= 5000;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

// Elementor content is served latin-1-ish: bullet chars arrive mangled (e.g. "�").
// Strip any leading non-word punctuation/whitespace from a bullet line.
function cleanLine(text: string): string {
  return text
    .replace(/\s+/g, " ")
    .replace(/^[^\w$]+/, "")
    .trim();
}

export async function runBransonReservationsCenterCrawler() {
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

      // The live DOM has no `.elementor-widget-ucaddon_image_card_content_box`
      // wrapper; the 6 title spans and 6 content spans render directly, in
      // document order, so zip them by index.
      const $titles = $(".uc_style_image_card_content_box_elementor_title");
      const $contents = $(".uc_style_image_card_content_box_elementor_content");
      $titles.each((i, el) => {
        const title = $(el).text().replace(/\s+/g, " ").trim();
        if (!title) return;

        // Content span holds inclusions + prices + description. Use .text()
        // (verified to carry the price copy); inclusions are bullet-separated
        // with the "•" char (.text() drops <br> boundaries, so split on bullets).
        const contentEl = $contents.eq(i);
        const contentText = (contentEl.text() || "").replace(/\s+/g, " ").trim();

        // PACKAGE price = "getting this package for $X"; fall back to "NOW ONLY $X".
        const promoMatch = contentText.match(/getting this package for\s*\$([\d,]+)/i);
        const rackMatch = contentText.match(/NOW ONLY\s*\$([\d,]+)/i);
        const rack = rackMatch ? parseInt(rackMatch[1].replace(/,/g, ""), 10) : NaN;

        let price: number;
        let original: number | undefined;
        if (promoMatch) {
          price = parseInt(promoMatch[1].replace(/,/g, ""), 10);
          original = validPrice(rack) && rack > price ? rack : undefined;
        } else {
          // No promo line (e.g. Branson Fun Trip): "NOW ONLY $89" is the price.
          price = rack;
          original = undefined;
        }

        if (!validPrice(price)) {
          log.warning(`[${SOURCE_KEY}] Skipping "${title}" — no valid package price`);
          return;
        }

        // Inclusions = bullet lines before the "NOW ONLY" price copy.
        const beforePrice = contentText.split(/NOW ONLY/i)[0] || "";
        const inclusions = beforePrice
          .split(/[•·\n]/)
          .map(cleanLine)
          .filter((l) => l && !/^\$/.test(l) && l.length > 2 && !/getting this package/i.test(l));

        // Duration, e.g. "4 Days / 3 Nights".
        const durMatch = contentText.match(/(\d+)\s*Days?\s*\/\s*(\d+)\s*Nights?/i);
        const durationDays = durMatch ? parseInt(durMatch[1], 10) : 4;
        const durationNights = durMatch ? parseInt(durMatch[2], 10) : 3;

        // Description = prose after the promotional/terms copy.
        const afterPrice = contentText.split(/for details\.?/i).pop() || "";
        const description = cleanLine(afterPrice.replace(/\s+/g, " ")).slice(0, 500) || undefined;

        const img = contentEl
          .closest(".elementor-widget-wrap, .elementor-element")
          .find(".uc_classic_content_placeholder img, img")
          .first()
          .attr("src");

        const slug = slugify(title);

        pending.push(
          storeDeal(
            {
              title: `${title} — Branson Vacation Package (${durationDays} Days / ${durationNights} Nights)`,
              price,
              originalPrice: original,
              durationNights,
              durationDays,
              description,
              resortName: "Stone Castle Hotel",
              city: "Branson",
              state: "MO",
              country: "US",
              brandSlug: SOURCE_KEY,
              url: `${PACKAGES_URL}#${slug}`,
              imageUrl: img
                ? img.startsWith("http")
                  ? img
                  : `${BASE_URL}${img}`
                : undefined,
              inclusions: inclusions.length ? inclusions : undefined,
              presentationMinutes: 120,
              requirements: ["Must attend a 120-minute vacation travel presentation"],
            },
            SOURCE_KEY,
          ),
        );
        stored++;
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

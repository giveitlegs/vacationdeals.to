import { CheerioCrawler } from "crawlee";
import { storeDeal } from "../storage/deal-store";

const SOURCE_KEY = "save-on-branson";
const BASE_URL = "https://www.saveonbranson.com";
const PACKAGES_URL = `${BASE_URL}/vacation-packages/`;

// SaveOnBranson.com (Gatsby SSR — package markup is in the static HTML).
// Each package lives in <div class="container package"> with:
//   h3.item-title              — package name
//   .pack-title                — "3 Days & 2 Nights" (pass-only items lack nights)
//   .price-block .price        — listed package price ("$254", comment nodes
//                                inside are ignored by cheerio .text())
//   li "…available for as low as $129 - Call for Details. Conditions Apply."
// Store price = the gated "as low as" price when present, originalPrice = the
// listed package price. Pass-only products with no lodging nights (VIP Pass,
// Ultimate Attractions Pass) are skipped — lodging packages only.

function slug(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function parsePrice(text: string): number {
  const m = text.match(/\$\s*([\d,]+)/);
  return m ? parseInt(m[1].replace(/,/g, ""), 10) : NaN;
}

function validPrice(price: number): boolean {
  return Number.isFinite(price) && price >= 39 && price <= 5000;
}

export async function runSaveOnBransonCrawler() {
  const crawler = new CheerioCrawler({
    maxRequestsPerCrawl: 3,
    maxRequestRetries: 2,
    requestHandlerTimeoutSecs: 30,
    async requestHandler({ request, $, log }) {
      log.info(`Processing ${request.url}`);
      let stored = 0;
      const pending: Promise<unknown>[] = [];

      $("div.container.package").each((_, el) => {
        const pkg = $(el);
        const name = pkg.find("h3.item-title").first().text().replace(/\s+/g, " ").trim();
        if (!name) return;

        // "3 Days & 2 Nights" — pass-only products (VIP Pass, Attractions
        // Pass) have no nights and are skipped.
        const durMatch = pkg
          .find(".pack-title")
          .text()
          .match(/(\d+)\s*Days?\s*&?\s*(\d+)\s*Nights?/i);
        if (!durMatch) {
          log.info(`[${SOURCE_KEY}] Skipping "${name}" — no lodging nights (pass-only product)`);
          return;
        }
        const days = parseInt(durMatch[1], 10);
        const nights = parseInt(durMatch[2], 10);

        const listedPrice = parsePrice(pkg.find(".price-block .price").first().text());
        // "This package is available for as low as $129 - Call for Details."
        const gatedMatch = pkg
          .text()
          .match(/available for as low as \$([\d,]+)/i);
        const gatedPrice = gatedMatch ? parseInt(gatedMatch[1].replace(/,/g, ""), 10) : NaN;

        const price = validPrice(gatedPrice) ? gatedPrice : listedPrice;
        if (!validPrice(price)) {
          log.warning(`[${SOURCE_KEY}] Skipping "${name}" — no valid price`);
          return;
        }
        const originalPrice = validPrice(gatedPrice) && validPrice(listedPrice) && listedPrice > price
          ? listedPrice
          : undefined;

        const inclusions: string[] = [];
        pkg.find(".central-col dl dd ul li").each((__, li) => {
          const t = $(li).text().replace(/\s+/g, " ").trim();
          if (t && inclusions.length < 8) inclusions.push(t);
        });

        const img = pkg.find("img.img-responsive").first().attr("src");

        pending.push(
          storeDeal(
            {
              title: `${name} — ${days} Days / ${nights} Nights`,
              price,
              originalPrice,
              durationNights: nights,
              durationDays: days,
              city: "Branson",
              state: "MO",
              country: "US",
              brandSlug: SOURCE_KEY,
              // All packages share this page URL — deal-store upserts by URL,
              // so each gets a unique #fragment anchor.
              url: `${PACKAGES_URL}#${slug(name)}`,
              imageUrl: img ? (img.startsWith("http") ? img : `${BASE_URL}${img}`) : undefined,
              inclusions: inclusions.length ? inclusions : undefined,
              requirements: ["Conditions apply — discounted rate requires qualification by phone"],
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
        log.info(`[${SOURCE_KEY}] Stored ${stored} lodging packages`);
      }
    },
  });

  await crawler.run([PACKAGES_URL]);
}

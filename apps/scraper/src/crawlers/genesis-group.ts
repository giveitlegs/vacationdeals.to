import { CheerioCrawler } from "crawlee";
import { storeDeal } from "../storage/deal-store";

const SOURCE_KEY = "genesis-group";
const BASE_URL = "https://genesisgrouplv.com";

// The Genesis Group (genesisgrouplv.com) is a Las Vegas travel-savings broker.
// Its ACTIVITIES section is mostly retail tours (helicopter, ATV, shooting) — we
// ignore those. The four gated "vacpack" offers all live under /activities/ as
// WooCommerce product pages with a sale price ("Current price is: $X" / an <ins>
// element) and a struck-through regular price ("Original price was: $Y" / <del>).
// Each requires a resort-preview presentation and is an explicit vacation-club /
// timeshare solicitation. DOM-verified only: price is re-read from the live page.
//
// PRICE-BUG guardrail: every page dangles a "$50 Visa/Mastercard gift card"
// (Planet13: a "$200 Planet 13 voucher") plus a "$25–$50/night resort fee". None
// of those is the package price — we scope price parsing to the WooCommerce
// .price element / the "Current price is:" text and shove the gift/voucher into
// inclusions.
//   Las Vegas offer  4D/3N  $199 (was $750) + $50 gift card, 120-min presentation
//   Branson          4D/3N  $179 (was $399) + $50 gift card,  90-min presentation
//   Luxury cruise    3-7N   $99  (was $299) + $50 gift card, 120-min presentation
//   Planet 13        4D/3N  $199 (was $750) + $200 P13 voucher,120-min presentation

interface OfferConfig {
  path: string;
  slug: string;
  title: string;
  city: string;
  state?: string;
  country: string;
  durationNights: number;
  durationDays: number;
  resortName?: string;
  description: string;
  inclusions: string[];
  presentationMinutes: number;
  requirements: string[];
  // Fallback price if a live figure can't be re-read (still requires the page to
  // load; used only when DOM parsing whiffs but we've DOM-verified structure).
  expectedPrice: number;
  expectedOriginal: number;
}

const OFFERS: OfferConfig[] = [
  {
    path: "/activities/las-vegas-offer-2024/",
    slug: "las-vegas",
    title: "Las Vegas 4 Days / 3 Nights Vacation Package",
    city: "Las Vegas",
    state: "NV",
    country: "US",
    durationNights: 3,
    durationDays: 4,
    resortName: "Caesars/Harrah's Las Vegas Strip resort (assigned on confirmation)",
    description:
      "4 days / 3 nights at a Las Vegas resort on or near the Strip (Horseshoe, Caesars Palace, Flamingo, Harrah's, Paris or Rio). Requires a 120-minute vacation-program presentation. Resort fee of $25-$50/night due at check-in.",
    inclusions: [
      "Hotel accommodations for 4 days / 3 nights on or near the Las Vegas Strip",
      "$50 Visa or Mastercard gift card",
    ],
    presentationMinutes: 120,
    requirements: ["Attend a 120-minute vacation program presentation"],
    expectedPrice: 199,
    expectedOriginal: 750,
  },
  {
    path: "/activities/4-days-3-nights-branson-vacation/",
    slug: "branson",
    title: "Branson 4 Days / 3 Nights Vacation Package",
    city: "Branson",
    state: "MO",
    country: "US",
    durationNights: 3,
    durationDays: 4,
    resortName: "The Branson Club (Oak Ridge / Great Rock at Branson)",
    description:
      "4 days / 3 nights at The Branson Club (Oak Ridge at Branson or Great Rock at Branson). Requires a complete 90-minute vacation-program presentation; both spouses/partners must attend.",
    inclusions: [
      "Accommodations for 4 days / 3 nights at The Branson Club",
      "$50 Visa or Mastercard gift card (awarded at conclusion of presentation)",
    ],
    presentationMinutes: 90,
    requirements: ["Attend a 90-minute vacation program presentation"],
    expectedPrice: 179,
    expectedOriginal: 399,
  },
  {
    path: "/activities/luxury-cruise-trip/",
    slug: "luxury-cruise",
    title: "Luxury Cruise Trip Vacation Package",
    city: "Various Ports",
    country: "US",
    durationNights: 3,
    durationDays: 4,
    description:
      "3 to 7 night cruise embarking from various West and East Coast ports with various destinations. Requires a 120-minute vacation-program presentation at a participating market (incl. Las Vegas, NV).",
    inclusions: [
      "3 to 7 night cruise accommodations from various ports",
      "$50 Visa or Mastercard gift card (awarded after presentation)",
    ],
    presentationMinutes: 120,
    requirements: ["Attend a 120-minute vacation program presentation"],
    expectedPrice: 99,
    expectedOriginal: 299,
  },
  {
    path: "/activities/4-days-3-nights-planet13-las-vegas-vacation/",
    slug: "planet13",
    title: "Planet 13 Las Vegas 4 Days / 3 Nights Vacation Package",
    city: "Las Vegas",
    state: "NV",
    country: "US",
    durationNights: 3,
    durationDays: 4,
    resortName: "Caesars/Harrah's Las Vegas Strip resort (assigned on confirmation)",
    description:
      "3 nights / 4 days at a Las Vegas resort on or near the Strip plus a $200 Planet 13 voucher. Requires a 2-hour resort-preview presentation. Resort fee of $25-$50/night due at check-in.",
    inclusions: [
      "Accommodations for 3 nights / 4 days near the Las Vegas Strip",
      "$200 Planet 13 voucher (awarded after presentation)",
    ],
    presentationMinutes: 120,
    requirements: ["Attend a 120-minute resort preview presentation"],
    expectedPrice: 199,
    expectedOriginal: 750,
  },
];

function parsePrice(text: string): number {
  const m = text.match(/\$([\d,]+)/);
  return m ? parseInt(m[1].replace(/,/g, ""), 10) : NaN;
}

function validPrice(price: number): boolean {
  return Number.isFinite(price) && price >= 39 && price <= 5000;
}

export async function runGenesisGroupCrawler() {
  const seedUrls = OFFERS.map((o) => `${BASE_URL}${o.path}`);

  const crawler = new CheerioCrawler({
    maxRequestsPerCrawl: 80,
    maxRequestRetries: 2,
    requestHandlerTimeoutSecs: 30,
    async requestHandler({ request, $, log }) {
      log.info(`Processing ${request.url}`);
      const pending: Promise<unknown>[] = [];
      let stored = 0;

      const offer = OFFERS.find((o) => request.url.replace(/\/$/, "").endsWith(o.path.replace(/\/$/, "")));
      if (!offer) {
        // Not one of the known vacpack pages — nothing to store (we ignore the
        // retail tours). Belt-and-suspenders: surface any additional /activities/
        // vacpack pages the site adds later so they're not silently missed.
        log.info(`[${SOURCE_KEY}] Non-vacpack page, skipping: ${request.url}`);
        return;
      }

      const bodyText = $("body").text().replace(/\s+/g, " ");

      // Scope price parsing to the WooCommerce product price element so we never
      // pick up the "$50 gift card", "$200 voucher" or "$25-$50 resort fee".
      const priceEl = $(
        "p.price, .entry-summary .price, .summary .price, .woocommerce-Price-amount",
      ).first();

      // Sale price = <ins>, regular/struck price = <del> inside .price.
      let price = parsePrice(priceEl.find("ins").first().text());
      let original = parsePrice(priceEl.find("del").first().text());

      // Screen-reader text fallback: "Current price is: $X" / "Original price was: $Y".
      if (!validPrice(price)) {
        const cur = bodyText.match(/Current price is:\s*\$([\d,]+)/i);
        if (cur) price = parseInt(cur[1].replace(/,/g, ""), 10);
      }
      if (!validPrice(original)) {
        const orig = bodyText.match(/Original price was:\s*\$([\d,]+)/i);
        if (orig) original = parseInt(orig[1].replace(/,/g, ""), 10);
      }
      // Last resort: a single price amount inside the scoped .price element only.
      if (!validPrice(price)) {
        price = parsePrice(priceEl.text());
      }

      if (!validPrice(price)) {
        log.warning(
          `[${SOURCE_KEY}] No DOM-verified price for "${offer.title}" — skipping (${request.url})`,
        );
        return;
      }

      const originalPrice = validPrice(original) && original > price ? original : undefined;

      const img =
        $(".woocommerce-product-gallery img, .wp-post-image, .entry-content img").first().attr("src") ||
        undefined;

      pending.push(
        storeDeal(
          {
            title: `${offer.title} — $${price}`,
            price,
            originalPrice,
            durationNights: offer.durationNights,
            durationDays: offer.durationDays,
            description: offer.description,
            resortName: offer.resortName,
            url: `${BASE_URL}${offer.path}`,
            imageUrl: img && img.startsWith("http") ? img : img ? `${BASE_URL}${img}` : undefined,
            inclusions: offer.inclusions,
            requirements: offer.requirements,
            presentationMinutes: offer.presentationMinutes,
            city: offer.city,
            state: offer.state,
            country: offer.country,
            brandSlug: SOURCE_KEY,
          },
          SOURCE_KEY,
        ),
      );
      stored++;

      await Promise.all(pending);
      if (stored === 0) {
        log.warning(`[${SOURCE_KEY}] No DOM-verified deals found; emitting 0 (${request.url})`);
      } else {
        log.info(`[${SOURCE_KEY}] Stored ${stored} deal(s) from ${request.url}`);
      }
    },
  });

  await crawler.run(seedUrls);
}

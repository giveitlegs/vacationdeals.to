import { CheerioCrawler } from "crawlee";
import { storeDeal } from "../storage/deal-store";

const SOURCE_KEY = "poconomo";
const BASE_URL = "https://poconomo.com";

// poconomo.com is the dedicated preview-package microsite for Pocono Mountain
// Villas by Exploria Resorts (2157 River Road, East Stroudsburg, PA 18302).
// The homepage 301s to exploriaresorts.com, but the microsite keeps three
// Pocono-specific *booking* pages, each carrying exactly ONE package in a
// headline heading of the form "Only $X for a N-Day/M-Night Mountain Retreat":
//
//   /book-pocono-mountains-resortpreview/ — "Only $149 for a 3-Day/2-Night ..."
//                                           (1BR condo, sleeps 4)
//   /book-pocono-mountains-ownergetaway/  — "Only $99 for a 4-Day/3-Night ..."
//   /book-pocono-mountains-owneradventure/— "Only $99 for a 4-Day/3-Night ..."
//
// PRICE-BUG guard: the PACKAGE price is the "Only $X for a N-Day/M-Night"
// headline figure — parsed off that anchored phrase ONLY. The pages also
// mention a "$100 Mastercard Gift Card" (an INCLUSION, never the price) and a
// retail range (~$318–$788) that lives only in third-party listings / T&C, so
// originalPrice is emitted ONLY if an on-page "retail value $X" figure is
// actually parsed. DOM-verified only: no headline price -> skip the page.
//
// The /resortpreview/ and /ownergetaway/ landing pages are multi-resort
// (Summer Bay Orlando + Grand Seas + Pocono) with the price buried in T&C
// text, so they are NOT seeded — only the three Pocono-specific book pages are.

const PACKAGES: { url: string; slug: string; label: string }[] = [
  {
    url: `${BASE_URL}/book-pocono-mountains-resortpreview/`,
    slug: "resort-preview",
    label: "Resort Preview",
  },
  {
    url: `${BASE_URL}/book-pocono-mountains-ownergetaway/`,
    slug: "owner-getaway",
    label: "Owner Getaway",
  },
  {
    url: `${BASE_URL}/book-pocono-mountains-owneradventure/`,
    slug: "owner-adventure",
    label: "Owner Adventure",
  },
];

const RESORT_NAME = "Pocono Mountain Villas";
const CITY = "East Stroudsburg";
const STATE = "PA";
const COUNTRY = "US";

// DOM-verified amenity inclusions: emitted only when the phrase is present on
// the page. Order preserved.
const AMENITY_KEYWORDS: [string, RegExp][] = [
  ["One-bedroom condo (sleeps 4)", /one[-\s]?bedroom condo/i],
  ["Fully-equipped kitchen", /fully[-\s]?equipped kitchen/i],
  ["Living room, washer & dryer", /washer\s*(?:&|and|\+)\s*dryer/i],
  ["Indoor & outdoor pools", /indoor.{0,12}outdoor pools/i],
  ["18-hole golf course", /18[-\s]?hole golf/i],
  ["Snow tubing hill", /snow tubing/i],
  ["Zip line / ropes adventure park", /zip[-\s]?line|ropes course|adventure park/i],
  ["Paintball", /paintball/i],
];

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

function cleanLine(text: string): string {
  return text
    .replace(/\s+/g, " ")
    .replace(/^[^\w$]+/, "")
    .trim();
}

export async function runPoconomoCrawler() {
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

      const { slug, label } = request.userData as {
        slug: string;
        label: string;
      };

      const bodyText = ($("body").text() || "").replace(/\s+/g, " ").trim();

      // PACKAGE price + duration come ONLY from the anchored headline phrase
      // "Only $X for a N-Day/M-Night ...". This deliberately cannot match the
      // "$100 Mastercard Gift Card" or any retail/credit figure.
      const headline = bodyText.match(
        /Only\s*\$([\d,]+)\s*for a\s*(\d+)\s*-?\s*Day\s*\/\s*(\d+)\s*-?\s*Night/i,
      );

      if (!headline) {
        log.warning(
          `[${SOURCE_KEY}] Skipping "${label}" — no "Only $X for a N-Day/M-Night" headline (${request.url})`,
        );
        await Promise.all(pending);
        return;
      }

      const price = parseInt(headline[1].replace(/,/g, ""), 10);
      const durationDays = parseInt(headline[2], 10);
      const durationNights = parseInt(headline[3], 10);

      if (!validPrice(price)) {
        log.warning(
          `[${SOURCE_KEY}] Skipping "${label}" — headline price $${headline[1]} out of range`,
        );
        await Promise.all(pending);
        return;
      }

      // originalPrice: ONLY if a real on-page retail figure is parsed. Prefer a
      // range's high end. Never fabricate — undefined is the honest default.
      let original: number | undefined;
      const retailRange = bodyText.match(
        /retail(?:\s*value)?[^$]{0,20}\$([\d,]+)\s*(?:[-–—]|to)\s*\$([\d,]+)/i,
      );
      const retailSingle = bodyText.match(
        /(?:retail value|valued at|reg(?:ularly)?\.?)[^$]{0,20}\$([\d,]+)/i,
      );
      if (retailRange) {
        const hi = parseInt(retailRange[2].replace(/,/g, ""), 10);
        if (validPrice(hi) && hi > price) original = hi;
      } else if (retailSingle) {
        const v = parseInt(retailSingle[1].replace(/,/g, ""), 10);
        if (validPrice(v) && v > price) original = v;
      }

      // Inclusions: DOM-verified amenity phrases + a gift-card line if present.
      const inclusions = AMENITY_KEYWORDS.filter(([, re]) => re.test(bodyText)).map(
        ([label]) => label,
      );
      const giftCard = bodyText.match(
        /\$([\d,]+)\s*(?:Mastercard|Visa|Master Card)?\s*Gift Card/i,
      );
      if (giftCard) {
        inclusions.push(`$${giftCard[1]} gift card`);
      }

      // Description: prefer the meta description, else prose around the headline.
      const metaDesc =
        $('meta[name="description"]').attr("content") ||
        $('meta[property="og:description"]').attr("content") ||
        "";
      const description =
        cleanLine(metaDesc).slice(0, 500) ||
        cleanLine(bodyText).slice(0, 300) ||
        undefined;

      // Image: og:image, else first sizeable content image.
      const ogImg = $('meta[property="og:image"]').attr("content");
      const img =
        ogImg ||
        $("img")
          .map((_, el) => $(el).attr("src"))
          .get()
          .find((src) => src && !/logo|icon|sprite|placeholder/i.test(src));

      const title = `${label} — ${RESORT_NAME} Vacation Package (${durationDays}-Day / ${durationNights}-Night)`;

      pending.push(
        storeDeal(
          {
            title,
            price,
            originalPrice: original,
            durationNights,
            durationDays,
            description,
            resortName: RESORT_NAME,
            city: CITY,
            state: STATE,
            country: COUNTRY,
            brandSlug: SOURCE_KEY,
            url: `${request.url}#${slugify(slug)}`,
            imageUrl: img
              ? img.startsWith("http")
                ? img
                : `${BASE_URL}${img}`
              : undefined,
            inclusions: inclusions.length ? inclusions : undefined,
            presentationMinutes: 120,
            requirements: ["Attend a resort tour / vacation-ownership preview"],
          },
          SOURCE_KEY,
        ),
      );
      stored++;

      await Promise.all(pending);
      if (stored === 0) {
        log.warning(
          `[${SOURCE_KEY}] No DOM-verified deals found; emitting 0 (${request.url})`,
        );
      } else {
        log.info(`[${SOURCE_KEY}] Stored ${stored} deal from ${request.url}`);
      }
    },
  });

  await crawler.run(
    PACKAGES.map((p) => ({
      url: p.url,
      userData: { slug: p.slug, label: p.label },
    })),
  );
}

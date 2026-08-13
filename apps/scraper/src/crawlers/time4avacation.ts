import { CheerioCrawler } from "crawlee";
import { storeDeal } from "../storage/deal-store";

const SOURCE_KEY = "time4avacation";
const BASE_URL = "https://www.time4avacation.com";

// Time4AVacation.com (Momentum Ventures LLC) sells gated "resort preview"
// vacation packages. There is no single listing/grid page with priced cards —
// each destination has its own dedicated offer page (linked from the homepage),
// so we deep-crawl one page PER destination and re-read the price from that
// page's DOM. Every package is 4 Days / 3 Nights at $199 with a "REG PRICE"
// rack value, and each requires attending a 90-120 minute resort preview.
//
// PRICE-BUG guard: every page dangles a "$100 Mastercard upon completion of
// resort sales preview" — that $100 is a COMPLETION CREDIT / gift card, NOT the
// package price and NOT an original price. parseOfferPrice() strips any
// "$<n> Mastercard" phrase BEFORE hunting the price. The PACKAGE price is the
// "$199" offer figure; the "REG PRICE: $750 / $1,414" rack value is
// originalPrice (Williamsburg & Branson $750, Hilton Head $1,414; Ormond
// publishes no rack price -> no originalPrice). DOM-verified only: if a page's
// $199 offer figure can't be parsed, that destination is skipped.
//
// Seeds carry only the intrinsic per-URL geography + resort identity (which
// destination a fixed URL is for); the money is always re-read from the page.
const SEEDS: Array<{
  url: string;
  city: string;
  state: string;
  resortName?: string;
  fallbackImage?: string;
}> = [
  {
    url: `${BASE_URL}/book-williamsburg/`,
    city: "Williamsburg",
    state: "VA",
    resortName: "Kings Creek Plantation",
    fallbackImage: `${BASE_URL}/wp-content/uploads/2022/03/Kings-Creek-Plantation-1.jpg`,
  },
  {
    url: `${BASE_URL}/book-ormond/`,
    city: "Ormond Beach",
    state: "FL",
    fallbackImage: `${BASE_URL}/wp-content/uploads/2022/03/OrmondHeader.jpg`,
  },
  {
    url: `${BASE_URL}/4-days-3-night-hilton-head-island-vacation-package/`,
    city: "Hilton Head Island",
    state: "SC",
    fallbackImage: `${BASE_URL}/wp-content/uploads/2022/02/Hilton-head-hero.jpg`,
  },
  {
    url: `${BASE_URL}/book-branson/`,
    city: "Branson",
    state: "MO",
    fallbackImage: `${BASE_URL}/wp-content/uploads/2022/03/branson-hero.jpg`,
  },
];

function toInt(text: string): number {
  return parseInt(text.replace(/,/g, ""), 10);
}

function validPrice(price: number): boolean {
  // Package-price band for THIS source: a 4-day / 3-night resort-preview package
  // here is always $199 and is never $1,000+. Reject the 1993/1994-style garbage
  // that a loose parse produced, plus household-income ($40,000) and $0 noise.
  return Number.isFinite(price) && price >= 39 && price <= 999;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

// Returns the discounted PACKAGE price and (optional) REG-PRICE rack value.
//
// The offer block renders as "REG PRICE: $750 Only $ 199 4 Day Total" (note the
// SPACE after the "$" — "$ 199", which a bare /\$([\d,]+)/ would miss). We take
// the package price ONLY from that anchored "Only $<n> ... Day/Night Total"
// block (or a "total package" / "+ tax" cue). Anchoring this tightly is what
// keeps the parser off: the "$100 Mastercard" completion credit, the "$100 VISA
// gift card" bonus, the Williamsburg "only $149 plus a $100 VISA Gift Card"
// decoy, the household-income dropdown ($0 / $40,000+), and the "Price $ 199"
// related-offer cards. If no anchored text price exists, price is NaN and the
// caller skips the page (DOM-verified only — never fabricate $199).
function parseOfferPrice(text: string): { price: number; original?: number } {
  // 1) Discounted package price — must sit in the priced offer block, e.g.
  //    "Only $ 199 4 Day Total" / "Only $199 3 Night Total", or a "$X total
  //    package" / "$X + tax" cue. "$ 199" -> allow whitespace after the "$".
  let price = NaN;
  const anchored =
    text.match(
      /only\s*\$\s*([\d,]+)\s*(?:\d+\s*(?:day|night)s?\s*)?total/i,
    ) ||
    text.match(/\$\s*([\d,]+)\s*(?:\+\s*tax|total\s+package)/i) ||
    text.match(
      /(?:total\s+package|package\s+(?:price|total))\s*[:\-]?\s*\$\s*([\d,]+)/i,
    );
  if (anchored && validPrice(toInt(anchored[1]))) {
    price = toInt(anchored[1]);
  }

  // 2) Rack / original price: "REG PRICE: $750", "Regular Price $1,414".
  //    NOT gated by validPrice — a rack value legitimately exceeds $999 (Hilton
  //    Head is $1,414). Keep it only if it's a sane figure ABOVE the package
  //    price. Ormond publishes no REG PRICE -> no originalPrice.
  let original: number | undefined;
  const regMatch =
    text.match(/REG(?:ULAR)?\.?\s*PRICE\s*:?\s*\$\s*([\d,]+)/i) ||
    text.match(/regular(?:ly)?\s*price\s*:?\s*\$\s*([\d,]+)/i);
  if (regMatch) {
    const reg = toInt(regMatch[1]);
    if (Number.isFinite(reg) && reg > price && reg <= 20000) original = reg;
  }

  return { price, original };
}

// DOM-verified inclusion phrases: emit only the ones actually present on the page.
const INCLUSION_PROBES: Array<{ re: RegExp; text: string }> = [
  { re: /up to\s*4\s*(?:persons|people|guests)/i, text: "Resort accommodations for up to 4 persons" },
  { re: /\$\s?\d[\d,]*\s*mastercard/i, text: "$100 Mastercard upon completion of the resort sales preview" },
  { re: /18\s*months/i, text: "18 months to travel — no blackout dates or restrictions" },
  { re: /blackout/i, text: "No blackout dates and no restrictions" },
];

export async function runTime4avacationCrawler() {
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
      const seed = request.userData as (typeof SEEDS)[number];
      const pending: Promise<unknown>[] = [];
      let stored = 0;

      const bodyText = $("body").text().replace(/\s+/g, " ").trim();

      const { price, original } = parseOfferPrice(bodyText);
      if (!validPrice(price)) {
        log.warning(
          `[${SOURCE_KEY}] Skipping ${seed.city} — no DOM-verified package price at ${request.url}`,
        );
        return;
      }

      // Duration: "4 Days / 3 Nights" (fallback to the site-standard 4/3).
      const durMatch = bodyText.match(/(\d+)\s*Days?\s*\/\s*(\d+)\s*Nights?/i);
      const durationDays = durMatch ? parseInt(durMatch[1], 10) : 4;
      const durationNights = durMatch ? parseInt(durMatch[2], 10) : 3;

      const inclusions = INCLUSION_PROBES.filter((p) => p.re.test(bodyText)).map(
        (p) => p.text,
      );

      // Image: prefer og:image, then a hero <img>, else the known seed image.
      const ogImg = $('meta[property="og:image"]').attr("content");
      const heroImg = $("img").first().attr("src");
      let imageUrl = ogImg || heroImg || seed.fallbackImage;
      if (imageUrl && !imageUrl.startsWith("http")) {
        imageUrl = `${BASE_URL}${imageUrl}`;
      }

      const label = seed.resortName
        ? `${seed.resortName} — ${seed.city}, ${seed.state}`
        : `${seed.city}, ${seed.state}`;

      pending.push(
        storeDeal(
          {
            title: `${label} Vacation Package (${durationDays} Days / ${durationNights} Nights)`,
            price,
            originalPrice: original,
            durationNights,
            durationDays,
            description:
              `${durationDays}-day / ${durationNights}-night resort preview package in ` +
              `${seed.city}, ${seed.state}${seed.resortName ? ` at ${seed.resortName}` : ""}. ` +
              `Requires attending a 90-120 minute resort preview presentation; no obligation to purchase.`,
            resortName: seed.resortName,
            city: seed.city,
            state: seed.state,
            country: "US",
            brandSlug: SOURCE_KEY,
            url: request.url,
            imageUrl,
            inclusions: inclusions.length ? inclusions : undefined,
            presentationMinutes: 120,
            requirements: ["Attend a 90-120 minute resort preview presentation"],
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

  await crawler.run(
    SEEDS.map((seed) => ({
      url: seed.url,
      uniqueKey: slugify(`${SOURCE_KEY}-${seed.city}`),
      userData: seed,
    })),
  );
}

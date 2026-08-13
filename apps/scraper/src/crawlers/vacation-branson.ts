import { CheerioCrawler } from "crawlee";
import { storeDeal } from "../storage/deal-store";

const SOURCE_KEY = "vacation-branson";
const OFFERS_BASE = "https://offers.vacationbranson.com";

// Vacation Branson runs a "travel savings preview" funnel on
// offers.vacationbranson.com/getaways/<slug>/ per-offer landing pages.
// (vacationbranson.com / www.vacationbranson.com is the editorial directory that
// links INTO these funnels — it has no priced packages of its own. The old
// vip.vacationbranson.com seed was DROPPED 2026-08-13: it is the same $69
// Thousand Hills package and only caused price confusion.)
//
// These are bespoke, hand-built landing pages: WebFetch confirmed there are NO
// repeatable offer-card CSS classes, so we can't zip cards by selector like the
// Elementor sites. Instead we seed each known offer page (DOM-verified below),
// read the full rendered text, and classify every dollar amount by the copy
// AROUND it into package-price vs. value/retail vs. trap.
//
// Two distinct DOM-verified packages:
//   1. Thousand Hills Resort Hotel — Branson, MO — "ONLY $69" / "Per Couple" /
//      "$69 total only", 4 Days/3 Nights, "Normal Rate $962" -> originalPrice.
//   2. Summer Bay Orlando by Exploria Resorts — Orlando, FL — "$49" for the
//      entire 4-Day/3-Night stay, "Retail Rate Up To $2,303" -> originalPrice.
//
// PRICE-BUG guards (the whole reason for the context classifier below). These
// dollar figures must NEVER become price OR originalPrice — they are HARD TRAPS
// that even "package" copy cannot rescue:
//   * "Add a 4th night ... $39" / "EXTEND MY STAY FOR ONLY $39" — an upsell that
//     ALSO says "only $", so "only $" alone can't be trusted as a price signal;
//     the trap words (extend / 4th night / add) win over it.
//   * "$5,000 coupon book" (also "worth over $5,000") — a coupon-value figure.
//   * "$150 REFUNDABLE reservation deposit ... refunded as a Visa Gift Card"
//     — a gift-card/deposit figure, NOT the package price.
//   * "$29.47 processing fee", "$19.98 Hotel Booking Protection" — fees.
//   * "$26 / $40 add show tickets", "$50 Guest Card", "$1575 bonus cruise",
//     "$100 transfer fee", "$12-$24 per night tax" — upsells/inclusions/fees.
// VALUE -> originalPrice ONLY from a labelled rack figure ("Normal Rate $962",
// "Retail Rate $2,303") that is > price and < 5000.
//   * The headline copy itself says "NOT PER NIGHT" — a positive package signal,
//     so it must NOT disqualify the $69/$49 it sits next to.

interface OfferSeed {
  url: string; // page to fetch
  canonicalUrl: string; // dedupe key stored as deal.url (may equal url)
  resortName: string;
  city: string;
  state: string;
}

// DOM-verified offer pages (2026-08-13 crawl). Crawl only the two
// offers.vacationbranson.com getaway pages (vip seed dropped — see above).
const SEEDS: OfferSeed[] = [
  {
    url: `${OFFERS_BASE}/getaways/thousand-hills-69-upg/`,
    canonicalUrl: `${OFFERS_BASE}/getaways/thousand-hills-69-upg/`,
    resortName: "Thousand Hills Resort Hotel",
    city: "Branson",
    state: "MO",
  },
  {
    url: `${OFFERS_BASE}/getaways/orlando-resort-49/`,
    canonicalUrl: `${OFFERS_BASE}/getaways/orlando-resort-49/`,
    resortName: "Summer Bay Orlando by Exploria Resorts",
    city: "Orlando",
    state: "FL",
  },
];

// Headline package price must sit in this band. Upper bound 2000 keeps rack
// figures ($2,303 retail) and coupon values ($5,000) out of the price slot.
function validPrice(price: number): boolean {
  return Number.isFinite(price) && price >= 39 && price <= 2000;
}

// originalPrice = a labelled rack/retail figure strictly above the price and
// below $5,000 (rejects the "$5,000 coupon book" value trap).
function validOriginalPrice(orig: number, price: number): boolean {
  return Number.isFinite(orig) && orig > price && orig < 5000;
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

// A dollar figure is a VALUE/retail comparison (-> originalPrice), never a price.
const VALUE_RE =
  /(normal rate|retail rate|retail value|rack rate|reg(?:ular)?\.? ?(?:price|rate)|\bvalue\b|worth|\bmsrp\b|regularly)/;
// A dollar figure is a HARD TRAP (fee / deposit / gift card / coupon / per-item
// upsell / extend-stay). Hard traps are NEVER a price or originalPrice, and —
// unlike the old classifier — they can NOT be overridden by package copy. This
// is what stops "EXTEND MY STAY FOR ONLY $39" (has "only $") from winning.
// NOTE: "per person" / "per night" are guarded with (?<!not ) — the headline
// copy is literally "TOTAL PRICE. NOT PER PERSON. NOT PER NIGHT", and those
// clarifiers sit right beside the $69 price and $962 rack figure; an unguarded
// "per person" was trapping "Normal Rate $962" and nulling out originalPrice.
const TRAP_RE =
  /(deposit|gift ?card|\bvisa\b|processing|booking protection|\bfee\b|coupon|guest card|refundable|\btax(?:es)?\b|\badd\b|add-on|add(?:s| a| \d)|\bextend\b|extra night|4th night|show ticket|(?<!not )per person|per day|(?<!not )per night|\/night|\bcruise\b|transfer|change fee)/;
// Copy that positively identifies the headline PACKAGE price. "not per night" is
// a positive signal (the $69/$49 copy literally says it), so it must never trap.
const PKG_RE =
  /(per couple|total price|total only|for two|for 2|entire stay|whole stay|\/stay|only \$|package price|not per night|for the (?:entire|whole))/;
// PAGE-LEVEL package signal: strong "this is a whole-stay package" phrasing that
// may appear ANYWHERE on the page, not next to the price. On these funnels the
// headline number can render on its own element (Orlando's "$49 *" sits apart
// from "Entire Stay"), so when a figure has no adjacent package copy we still
// accept the smallest clean in-band figure as the headline IF the page shows
// one of these. Deliberately excludes the loose "only $" token.
const PAGE_PKG_RE =
  /(per couple|total price|total only|entire stay|whole stay|package price|not per night)/;

interface DollarCtx {
  amount: number;
  context: string;
}

function dollarContexts(text: string): DollarCtx[] {
  const out: DollarCtx[] = [];
  const re = /\$\s?([\d,]+(?:\.\d{1,2})?)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const amount = parseFloat(m[1].replace(/,/g, ""));
    const matchEnd = m.index + m[0].length;
    // Clamp the context window at the NEAREST neighbouring "$" so a figure never
    // inherits the descriptor of an adjacent figure. Without this, "$49 plus a
    // $29.47 processing fee" leaks "processing fee" onto $49 (trapping the real
    // price), and "Retail Rate Up To $2,303 $49" leaks "Retail Rate" onto $49.
    const rawStart = Math.max(0, m.index - 60);
    const prevDollar = text.lastIndexOf("$", m.index - 1);
    const start = prevDollar >= rawStart ? prevDollar + 1 : rawStart;
    const rawEnd = Math.min(text.length, matchEnd + 60);
    const nextDollar = text.indexOf("$", matchEnd);
    const end = nextDollar !== -1 && nextDollar < rawEnd ? nextDollar : rawEnd;
    out.push({ amount, context: text.slice(start, end).toLowerCase() });
  }
  return out;
}

export async function runVacationBransonCrawler() {
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
      const seed = request.userData as OfferSeed;
      let stored = 0;
      const pending: Promise<unknown>[] = [];

      const bodyText = ($("body").text() || "").replace(/\s+/g, " ").trim();
      const contexts = dollarContexts(bodyText);
      const pagePkgSignal = PAGE_PKG_RE.test(bodyText.toLowerCase());

      // Classify each dollar amount by the copy around it. Precedence is strict:
      // HARD TRAP > VALUE > PACKAGE. A hard trap can never be rescued by package
      // copy, so "EXTEND MY STAY FOR ONLY $39" (trap: extend/4th night) loses to
      // the true "$69 Per Couple" headline even though both contain "only $".
      const isTrap = (c: DollarCtx) => TRAP_RE.test(c.context);
      const isValue = (c: DollarCtx) => !isTrap(c) && VALUE_RE.test(c.context);
      const isPkg = (c: DollarCtx) =>
        !isTrap(c) && !isValue(c) && PKG_RE.test(c.context);

      // Headline price must be in the 39-2000 band and never a trap/value figure.
      const priceCandidates = contexts.filter(
        (c) => validPrice(c.amount) && !isTrap(c) && !isValue(c),
      );
      const pkgCandidates = priceCandidates.filter(isPkg);

      // Headline package price:
      //   1. an amount with adjacent package copy ("$69 Per Couple", "$49 Entire
      //      Stay"); else
      //   2. if the page carries a strong package signal anywhere (Orlando's
      //      "Entire Stay" renders apart from the standalone "$49 *"), the
      //      smallest clean in-band figure — still rejecting fees/deposits/
      //      gift-cards/coupons, which were filtered out above.
      let price = NaN;
      if (pkgCandidates.length) {
        price = Math.min(...pkgCandidates.map((c) => c.amount));
      } else if (pagePkgSignal && priceCandidates.length) {
        price = Math.min(...priceCandidates.map((c) => c.amount));
      }

      // originalPrice = the largest labelled value/retail figure > price and
      // < 5000 (rejects the "$5,000 coupon book" which is a hard trap anyway).
      const valueFigs = contexts
        .filter(isValue)
        .map((c) => c.amount)
        .filter((v) => validOriginalPrice(v, price));
      const originalPrice: number | undefined = valueFigs.length
        ? Math.max(...valueFigs)
        : undefined;

      if (!validPrice(price)) {
        log.warning(
          `[${SOURCE_KEY}] Skipping ${seed.resortName} (${request.url}) — no DOM-verified package price`,
        );
        return;
      }

      // Duration: "4 Days / 3 Nights", "4-Day/3-Night".
      const durMatch = bodyText.match(
        /(\d+)[\s-]*Days?\s*\/\s*(\d+)[\s-]*Nights?/i,
      );
      const durationDays = durMatch ? parseInt(durMatch[1], 10) : 4;
      const durationNights = durMatch ? parseInt(durMatch[2], 10) : 3;

      // Inclusions from list items (bullet copy on these funnels).
      const inclusions = Array.from(
        new Set(
          $("li")
            .map((_, el) => cleanLine($(el).text()))
            .get()
            .filter(
              (l) =>
                l &&
                l.length > 3 &&
                l.length < 120 &&
                /(night|accommodation|show ticket|breakfast|attraction|guest card|photo|resort|cruise|suite|lodging|coupon)/i.test(
                  l,
                ) &&
                !/^\$/.test(l),
            ),
        ),
      ).slice(0, 12);

      // Description: og:description, else meta description.
      const description =
        ($('meta[property="og:description"]').attr("content") ||
          $('meta[name="description"]').attr("content") ||
          "")
          .replace(/\s+/g, " ")
          .trim()
          .slice(0, 500) || undefined;

      // Image: og:image, else first sizeable <img>. Resolve relative URLs.
      const rawImg =
        $('meta[property="og:image"]').attr("content") ||
        $("img")
          .map((_, el) => $(el).attr("src"))
          .get()
          .find((s) => s && !/logo|icon|svg/i.test(s));
      let imageUrl: string | undefined;
      if (rawImg) {
        try {
          imageUrl = new URL(rawImg, request.loadedUrl || request.url).href;
        } catch {
          imageUrl = undefined;
        }
      }

      const title = `${seed.resortName} — ${seed.city} Vacation Package (${durationDays} Days / ${durationNights} Nights)`;
      const slug = slugify(`${seed.resortName}-${seed.city}`);
      const dealUrl = seed.canonicalUrl || request.url;

      pending.push(
        storeDeal(
          {
            title,
            price,
            originalPrice,
            durationNights,
            durationDays,
            description,
            resortName: seed.resortName,
            url: dealUrl.includes("#") ? dealUrl : `${dealUrl}#${slug}`,
            imageUrl,
            inclusions: inclusions.length ? inclusions : undefined,
            requirements: ["Attend a 90-120 minute travel savings preview"],
            presentationMinutes: 120,
            city: seed.city,
            state: seed.state,
            country: "US",
            brandSlug: SOURCE_KEY,
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
        log.info(
          `[${SOURCE_KEY}] Stored ${stored} deal (${seed.resortName} $${price}) from ${request.url}`,
        );
      }
    },
  });

  await crawler.run(
    SEEDS.map((seed) => ({ url: seed.url, userData: seed })),
  );
}

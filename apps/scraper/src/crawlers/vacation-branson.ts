import { CheerioCrawler } from "crawlee";
import { storeDeal } from "../storage/deal-store";

const SOURCE_KEY = "vacation-branson";
const OFFERS_BASE = "https://offers.vacationbranson.com";
const VIP_BASE = "https://vip.vacationbranson.com";

// Vacation Branson runs a two-subdomain "travel savings preview" funnel:
//   - offers.vacationbranson.com/getaways/<slug>/  — per-offer landing pages
//   - vip.vacationbranson.com/                      — the live Thousand Hills funnel
// (vacationbranson.com / www.vacationbranson.com is the editorial directory that
// links INTO these funnels — it has no priced packages of its own.)
//
// These are bespoke, hand-built landing pages: WebFetch confirmed there are NO
// repeatable offer-card CSS classes, so we can't zip cards by selector like the
// Elementor sites. Instead we seed each known offer page (DOM-verified below),
// read the full rendered text, and classify every dollar amount by the copy
// AROUND it into package-price vs. value/retail vs. trap.
//
// Two distinct DOM-verified packages exist across both subdomains:
//   1. Thousand Hills Resort Hotel — Branson, MO — "$69 Total Per Couple",
//      4 Days/3 Nights, "Normal Rate $962" -> originalPrice. Sold on BOTH the
//      offers getaway page AND vip root; both seeds upsert to ONE canonical URL
//      (deal-store matches on URL) so we don't store the same package twice.
//   2. Summer Bay Orlando by Exploria Resorts — Orlando, FL — "$49" for the
//      entire 4-Day/3-Night stay, "Retail Rate Up To $2,303" -> originalPrice.
//
// PRICE-BUG guards (the whole reason for the context classifier below):
//   * "$962 / $648 Normal Rate", "$2,303 Retail Rate" = VALUE -> originalPrice,
//     never the price.
//   * "$150 REFUNDABLE reservation deposit ... refunded as a Visa Gift Card"
//     (Orlando) — a gift-card/deposit figure, NOT the package price. Dropped.
//   * "$29.47 processing fee", "$19.98 Hotel Booking Protection" — fees. Dropped.
//   * "$39 add a 4th night", "$26 / $40 add show tickets", "$5,000 coupon book",
//     "$50 Guest Card" — per-item upsells/inclusions, NOT the headline price.
//   * The package price copy itself says "NOT PER NIGHT" — so a "per night" match
//     inside a "per couple / total price" window must NOT disqualify it.

interface OfferSeed {
  url: string; // page to fetch
  canonicalUrl: string; // dedupe key stored as deal.url (may equal url)
  resortName: string;
  city: string;
  state: string;
}

// DOM-verified offer pages (2026-08-12 crawl). thousand-hills appears on both
// subdomains -> two seeds sharing one canonicalUrl so the upsert collapses them.
const SEEDS: OfferSeed[] = [
  {
    url: `${OFFERS_BASE}/getaways/thousand-hills-69-upg/`,
    canonicalUrl: `${OFFERS_BASE}/getaways/thousand-hills-69-upg/`,
    resortName: "Thousand Hills Resort Hotel",
    city: "Branson",
    state: "MO",
  },
  {
    url: `${VIP_BASE}/`,
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

// A dollar figure is a VALUE/retail comparison (-> originalPrice), never a price.
const VALUE_RE = /(value|normal rate|retail|worth|\bmsrp\b|regularly)/;
// A dollar figure is a hard TRAP (fee / deposit / gift card / upsell / per-item).
const TRAP_RE =
  /(deposit|gift ?card|\bvisa\b|processing|booking protection|\bfee\b|coupon|guest card|refundable|\btax(?:es)?\b|add(?:s|-on| a| \d)|extra night|4th night|show ticket|per person|\/night|\bcruise\b)/;
// Copy that positively identifies the headline PACKAGE price.
const PKG_RE =
  /(per couple|total price|for two|for 2|entire stay|whole stay|\/stay|only \$|package price|for the (?:entire|whole))/;

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
    const start = Math.max(0, m.index - 55);
    const end = Math.min(text.length, m.index + m[0].length + 55);
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

      // Classify each dollar amount by the copy around it.
      const isPkg = (c: DollarCtx) => PKG_RE.test(c.context);
      const isValue = (c: DollarCtx) => VALUE_RE.test(c.context) && !isPkg(c);
      // Hard traps: fees/deposits/gift-cards/per-item upsells. A "package" match
      // (e.g. "per couple / total price") overrides — the headline $69 copy also
      // literally says "NOT PER NIGHT", which must not disqualify it.
      const isTrap = (c: DollarCtx) =>
        !isPkg(c) && (isValue(c) || TRAP_RE.test(c.context));

      const valid = contexts.filter((c) => validPrice(c.amount));
      const pkgCandidates = valid.filter(isPkg);
      const cleanCandidates = valid.filter((c) => !isTrap(c));

      // Headline package price: prefer an explicit "per couple / for two / entire
      // stay" figure; else the smallest non-trap, non-value dollar amount.
      let price = NaN;
      if (pkgCandidates.length) {
        price = Math.min(...pkgCandidates.map((c) => c.amount));
      } else if (cleanCandidates.length) {
        price = Math.min(...cleanCandidates.map((c) => c.amount));
      }

      // originalPrice = the largest labelled value/retail figure above the price.
      const valueFigs = valid.filter(isValue).map((c) => c.amount);
      let originalPrice: number | undefined = valueFigs.length
        ? Math.max(...valueFigs)
        : undefined;
      if (!(validPrice(originalPrice as number) && (originalPrice as number) > price)) {
        originalPrice = undefined;
      }

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

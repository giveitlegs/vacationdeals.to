import { CheerioCrawler } from "crawlee";
import { storeDeal } from "../storage/deal-store";

const SOURCE_KEY = "goodtime-entertainment";
const BASE_URL = "https://goodtimeentertainment.com";
const VACATION_URL = `${BASE_URL}/vacation/`;

// Good Time Entertainment (goodtimeentertainment.com/vacation) is a single
// WordPress content page describing ONE Diamond-Resorts-style preview offer that
// is redeemable at a fixed list of continental-US resorts:
//   Base package: 4 days / 3 nights, "$199 for the entire stay" (no extra taxes
//   or resort fees), + a $100 Visa gift card, in exchange for attending a
//   ~120-minute (90-120) timeshare/resort sales presentation.
// The $199 price + $100 gift card + 120-min presentation are stated ONCE in the
// body prose and apply to every listed resort; the resorts themselves are listed
// as plain <li>/<p> text inside .entry-content (no per-card price markup), so we
// re-read the shared package price/gift-card/presentation from the live DOM and
// emit one deal per resort that is actually named on the page.
//
// PRICE-BUG GUARD: the page also mentions "$100 Visa gift card" and an
// "$50,000 annual income" eligibility figure. We target ONLY the package figure
// ("...for $199" / "$199.00 for the entire stay"), never the gift-card, income,
// or any deposit number. The $100 Visa card is recorded as an INCLUSION.
//
// Hawaii (2 resorts) + Cabo San Lucas are mentioned but the page states their
// "package differs from the base package" with NO stated price -> skipped
// (DOM-verified-only: no price parsed, no deal published).

interface ResortOffer {
  name: string; // display / resortName
  // distinctive lowercase substring that must appear in the page text to publish
  match: string;
  city: string;
  state: string;
  detailUrl?: string; // dedicated offer page, when the site links one out
  note?: string; // accommodation note (e.g. Greensprings 2-bedroom)
}

// Derived from the live .entry-content list on 2026-08-12.
const RESORTS: ResortOffer[] = [
  {
    name: "Cancun Resort",
    match: "cancun resort",
    city: "Las Vegas",
    state: "NV",
    detailUrl: "http://goodtime.lavasquare.com/vacation/vacation-to-las-vegas-nv-at-the-cancun-resort-las-vegas/",
  },
  {
    name: "Polo Towers Suites",
    match: "polo towers",
    city: "Las Vegas",
    state: "NV",
    detailUrl: "http://goodtime.lavasquare.com/vacation/polo-towers-suites-las-vegas-nv/",
  },
  { name: "Lake Tahoe Resort", match: "lake tahoe resort", city: "Lake Tahoe", state: "CA" },
  { name: "San Luis Bay Inn", match: "san luis bay inn", city: "Avila Beach", state: "CA" },
  { name: "Palm Canyon Resort", match: "palm canyon resort", city: "Palm Springs", state: "CA" },
  { name: "Mystic Dunes", match: "mystic dunes", city: "Orlando", state: "FL" },
  { name: "Daytona Beach Regency", match: "daytona beach regency", city: "Daytona Beach", state: "FL" },
  { name: "Historic Powhatan Resort", match: "historic powhatan", city: "Williamsburg", state: "VA" },
  {
    name: "Greensprings Resort",
    match: "greensprings",
    city: "Williamsburg",
    state: "VA",
    note: "Two-bedroom accommodation (sleeps 6)",
  },
  { name: "Bent Creek Golf Village", match: "bent creek golf village", city: "Gatlinburg", state: "TN" },
  { name: "The Suites at Fall Creek", match: "suites at fall creek", city: "Branson", state: "MO" },
  { name: "Scottsdale Villa Mirage", match: "scottsdale villa mirage", city: "Scottsdale", state: "AZ" },
  { name: "Scottsdale Links Resort", match: "scottsdale links", city: "Scottsdale", state: "AZ" },
  { name: "Los Abrigados Resort and Spa", match: "los abrigados", city: "Sedona", state: "AZ" },
  { name: "Sedona Summit", match: "sedona summit", city: "Sedona", state: "AZ" },
  { name: "The Ridge Resort", match: "the ridge resort", city: "Sedona", state: "AZ" },
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
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function runGoodtimeEntertainmentCrawler() {
  const crawler = new CheerioCrawler({
    maxRequestsPerCrawl: 100,
    maxRequestRetries: 2,
    requestHandlerTimeoutSecs: 30,
    async requestHandler({ request, $, log, enqueueLinks }) {
      log.info(`Processing ${request.url}`);
      void enqueueLinks; // single-page listing; all offers live on VACATION_URL
      const pending: Promise<unknown>[] = [];
      let stored = 0;

      const content = $(".entry-content").first();
      const scope = content.length ? content : $("body");
      const bodyText = scope.text().replace(/\s+/g, " ").trim();
      const lower = bodyText.toLowerCase();

      // --- Package price (DOM-verified) ---------------------------------
      // Target the whole-stay figure only: "...for $199" / "$199.00 for the
      // entire stay". Never the "$100 Visa gift card" or "$50,000 income".
      let basePrice = NaN;
      const forMatch = bodyText.match(/for\s*\$\s?([\d,]+)/i);
      const stayMatch = bodyText.match(/\$\s?([\d,]+)(?:\.\d+)?\s*for the entire stay/i);
      if (stayMatch) basePrice = parsePrice(`$${stayMatch[1]}`);
      else if (forMatch) basePrice = parsePrice(`$${forMatch[1]}`);

      if (!validPrice(basePrice)) {
        log.warning(
          `[${SOURCE_KEY}] No DOM-verified package price found; emitting 0 (${request.url})`,
        );
        await Promise.all(pending);
        return;
      }

      // --- Nights / days (DOM-verified, with sane fallback) --------------
      const durMatch =
        bodyText.match(/(\d+)\s*days?\s*and\s*(\d+)\s*nights?/i) ||
        bodyText.match(/(\d+)\s*nights?\s*(?:at|stay)/i);
      let durationDays = 4;
      let durationNights = 3;
      if (durMatch && durMatch[2]) {
        durationDays = parseInt(durMatch[1], 10);
        durationNights = parseInt(durMatch[2], 10);
      } else if (durMatch && durMatch[1]) {
        durationNights = parseInt(durMatch[1], 10);
        durationDays = durationNights + 1;
      }

      // --- Presentation length (90 or 120) ------------------------------
      let presentationMinutes: number | undefined;
      const presMatch = bodyText.match(/(\d{2,3})\s*minutes/i);
      if (presMatch) {
        const mins = parseInt(presMatch[1], 10);
        if (mins === 90 || mins === 120) presentationMinutes = mins;
      }
      if (!presentationMinutes && /\b90\s*to\s*120\b/i.test(bodyText)) presentationMinutes = 120;

      // --- Gift card / resort credit -> INCLUSION (never the price) ------
      const giftMatch = bodyText.match(/\$\s?([\d,]+)(?:\.\d+)?\s*Visa gift card/i);
      const baseInclusions: string[] = [];
      if (giftMatch) baseInclusions.push(`$${giftMatch[1].replace(/,/g, "")} Visa gift card`);
      if (/no additional taxes or resort fees/i.test(bodyText)) {
        baseInclusions.push("No additional taxes or resort fees");
      }

      const requirements = presentationMinutes
        ? [`Resort preview / timeshare presentation required (approx. ${presentationMinutes} minutes)`]
        : ["Resort preview / timeshare presentation required"];

      const description =
        `Diamond-Resorts-style preview package: ${durationDays} days / ${durationNights} nights ` +
        `at ${RESORTS.length}+ resorts for $${basePrice} for the entire stay, plus a Visa gift card, ` +
        `in exchange for attending a resort sales presentation.`;

      // --- One deal per resort actually named on the page ----------------
      for (const resort of RESORTS) {
        if (!lower.includes(resort.match)) {
          log.warning(`[${SOURCE_KEY}] "${resort.name}" not found on page; skipping`);
          continue;
        }

        const accommodation = resort.note ?? "One-bedroom condo (sleeps 4)";
        const inclusions = [accommodation, ...baseInclusions];
        const url = resort.detailUrl ?? `${VACATION_URL}#${slugify(`${resort.name}-${resort.city}`)}`;

        pending.push(
          storeDeal(
            {
              title: `${resort.name} — ${resort.city}, ${resort.state} Vacation Package (${durationDays} Days / ${durationNights} Nights for $${basePrice})`,
              price: basePrice,
              durationNights,
              durationDays,
              description,
              resortName: resort.name,
              url,
              inclusions,
              requirements,
              presentationMinutes,
              city: resort.city,
              state: resort.state,
              country: "US",
              brandSlug: SOURCE_KEY,
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

  await crawler.run([VACATION_URL]);
}
